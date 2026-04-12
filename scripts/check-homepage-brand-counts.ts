import { getPostgresClient } from '../db/index.js';

async function main() {
    const sql = getPostgresClient();
    try {
        const rows = await sql<{ brand: string; cnt: number }[]>`
            SELECT brand, COUNT(*)::int AS cnt
            FROM products
            WHERE brand IN ('Geekbar Pulse X', 'Foger Pods', 'Utbar', 'Flum Mello')
            GROUP BY brand
            ORDER BY brand
        `;

        console.log(rows);
    } finally {
        await sql.end({ timeout: 5 });
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
