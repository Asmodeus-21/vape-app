import fs from 'fs';
import path from 'path';
import postgres, { type Sql } from 'postgres';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTGRES_SCHEMA_PATH = path.join(__dirname, 'schema.sql');

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
    const fromEnvLocal = readDatabaseUrlFromEnvFile(path.join(workspaceRoot, '.env.local'));
    if (fromEnvLocal) {
        return fromEnvLocal;
    }

    return readDatabaseUrlFromEnvFile(path.join(workspaceRoot, '.env'));
}

let _postgres: Sql | null = null;

export function getPostgresClient(): Sql {
    if (!_postgres) {
        const databaseUrl = resolveDatabaseUrl();
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is required for Supabase/PostgreSQL runtime. Set it in .env or .env.local.');
        }
        _postgres = postgres(databaseUrl, {
            ssl: process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false }
                : 'require',
            max: 10,
            idle_timeout: 20,
            connect_timeout: 15,
        });
    }
    return _postgres;
}

export async function initializePostgresSchema(sql: Sql = getPostgresClient()): Promise<void> {
    await sql.file(POSTGRES_SCHEMA_PATH);
}

export async function initializeDatabase(): Promise<void> {
    await initializePostgresSchema();
}

export default getPostgresClient;
