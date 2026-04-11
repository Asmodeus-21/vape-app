import 'dotenv/config';
import { getPostgresClient, initializePostgresSchema } from './index.js';

async function runMigration(): Promise<void> {
    const sql = getPostgresClient();
    await initializePostgresSchema(sql);
    console.log('[db:migrate:postgres] schema.sql applied successfully.');
    await sql.end({ timeout: 5 });
}

runMigration().catch((error) => {
    console.error('[db:migrate:postgres] failed:', error);
    process.exitCode = 1;
});
