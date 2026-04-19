import fs from 'fs';
import path from 'path';
import postgres, { type Sql } from 'postgres';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTGRES_SCHEMA_PATH = path.join(__dirname, 'schema.sql');
type PostgresSslMode = false | 'require' | { rejectUnauthorized: boolean };

function sanitizeDatabaseUrl(value?: string | null): string | null {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return null;

    const normalizedValue = trimmedValue.replace(/^['\"]|['\"]$/g, '');
    if (!normalizedValue || normalizedValue === 'your_supabase_url_here') {
        return null;
    }

    return normalizedValue;
}

function readDatabaseUrlFromEnvFile(filePath: string): string | null {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    for (const line of fileContents.split(/\r?\n/)) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }

        const separatorIndex = trimmedLine.indexOf('=');
        if (separatorIndex === -1) {
            continue;
        }

        const key = trimmedLine.slice(0, separatorIndex).trim();
        const value = trimmedLine.slice(separatorIndex + 1);
        if (key === 'DATABASE_URL') {
            return sanitizeDatabaseUrl(value);
        }
    }

    return null;
}

function resolveDatabaseUrl(): string | null {
    const fromProcessEnv = sanitizeDatabaseUrl(process.env.DATABASE_URL);
    if (fromProcessEnv) {
        return fromProcessEnv;
    }

    const workspaceRoot = process.cwd();
    if (process.env.NODE_ENV === 'production') {
        const fromEnvProduction = readDatabaseUrlFromEnvFile(path.join(workspaceRoot, '.env.production'));
        if (fromEnvProduction) {
            return fromEnvProduction;
        }
    }

    const fromEnvLocal = readDatabaseUrlFromEnvFile(path.join(workspaceRoot, '.env.local'));
    if (fromEnvLocal) {
        return fromEnvLocal;
    }

    return readDatabaseUrlFromEnvFile(path.join(workspaceRoot, '.env'));
}

function parseDatabaseUrl(databaseUrl: string): URL | null {
    try {
        return new URL(databaseUrl);
    } catch {
        return null;
    }
}

function isLocalDatabaseHost(hostname: string): boolean {
    const normalizedHostname = hostname.trim().toLowerCase();
    return normalizedHostname === 'localhost'
        || normalizedHostname === '127.0.0.1'
        || normalizedHostname === '0.0.0.0'
        || normalizedHostname === '::1';
}

function resolveSslMode(databaseUrl: string): PostgresSslMode {
    const configuredMode = process.env.DATABASE_SSL?.trim().toLowerCase();
    if (configuredMode === 'disable' || configuredMode === 'false' || configuredMode === 'off') {
        return false;
    }
    if (configuredMode === 'require' || configuredMode === 'true' || configuredMode === 'on') {
        return 'require';
    }

    const parsedDatabaseUrl = parseDatabaseUrl(databaseUrl);
    if (parsedDatabaseUrl && isLocalDatabaseHost(parsedDatabaseUrl.hostname)) {
        return false;
    }

    return process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : 'require';
}

function describeDatabaseTarget(databaseUrl: string): string {
    const parsedDatabaseUrl = parseDatabaseUrl(databaseUrl);
    if (!parsedDatabaseUrl) {
        return 'the configured DATABASE_URL';
    }

    const databaseName = parsedDatabaseUrl.pathname.replace(/^\//, '') || '(default database)';
    const port = parsedDatabaseUrl.port || '5432';
    return `${parsedDatabaseUrl.hostname}:${port}/${databaseName}`;
}

function buildDatabaseConnectionError(databaseUrl: string, error: unknown): Error {
    const baseMessage = error instanceof Error ? error.message : String(error);
    const parsedDatabaseUrl = parseDatabaseUrl(databaseUrl);
    const target = describeDatabaseTarget(databaseUrl);
    const details: string[] = [`Failed to connect to PostgreSQL at ${target}. ${baseMessage}`];

    if ((error as { code?: string } | null)?.code === 'ENOTFOUND') {
        details.push('The configured database hostname could not be resolved.');
        if (parsedDatabaseUrl?.hostname?.endsWith('.supabase.co') && parsedDatabaseUrl.port === '6543') {
            details.push('Supabase direct hosts use port 5432. Port 6543 requires a Supabase pooler hostname, not db.<project-ref>.supabase.co.');
        }
    }

    if (parsedDatabaseUrl && isLocalDatabaseHost(parsedDatabaseUrl.hostname)) {
        details.push('Local PostgreSQL connections default to SSL disabled in this app. Start a local server or update .env.local with a reachable DATABASE_URL.');
    }

    return new Error(details.join(' '));
}

let _postgres: Sql | null = null;

export function getPostgresClient(): Sql {
    if (!_postgres) {
        const databaseUrl = resolveDatabaseUrl();
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is required for Supabase/PostgreSQL runtime. Set it in .env or .env.local.');
        }
        _postgres = postgres(databaseUrl, {
            ssl: resolveSslMode(databaseUrl),
            max: 10,
            idle_timeout: 20,
            connect_timeout: 15,
            prepare: false, // Required for Supabase pgBouncer (transaction pooler, port 6543)
        });
    }
    return _postgres;
}

export async function initializePostgresSchema(sql: Sql = getPostgresClient()): Promise<void> {
    const databaseUrl = resolveDatabaseUrl();
    try {
        await sql.file(POSTGRES_SCHEMA_PATH);
    } catch (error) {
        if (databaseUrl) {
            throw buildDatabaseConnectionError(databaseUrl, error);
        }
        throw error;
    }
}

export async function initializeDatabase(): Promise<void> {
    await initializePostgresSchema();
}

export default getPostgresClient;
