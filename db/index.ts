import path from 'path';
import postgres, { type Sql } from 'postgres';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTGRES_SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const DATABASE_URL = process.env.DATABASE_URL?.trim();

let _postgres: Sql | null = null;

export function getPostgresClient(): Sql {
    if (!_postgres) {
        if (!DATABASE_URL) {
            throw new Error('DATABASE_URL is required for Supabase/PostgreSQL runtime.');
        }
        _postgres = postgres(DATABASE_URL, {
            ssl: 'require',
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
