import { getPostgresClient, initializePostgresSchema } from './index.js';
import { seedProducts } from './seed.js';

export async function seedPostgres(options?: { closeClient?: boolean }): Promise<void> {
    const sql = getPostgresClient();
    const closeClient = options?.closeClient ?? false;

    await initializePostgresSchema(sql);

    const forceReseed = process.env.FORCE_RESEED === 'true';
    const countResult = await sql<{ cnt: string }[]>`SELECT COUNT(*)::text AS cnt FROM products`;
    const count = Number(countResult[0]?.cnt ?? 0);

    if (!forceReseed && count > 0) {
        console.log(`[Seed:Postgres] DB already has ${count} products - skipping seed.`);
        if (closeClient) {
            await sql.end({ timeout: 5 });
        }
        return;
    }

    if (count > 0) {
        await sql`TRUNCATE TABLE products RESTART IDENTITY CASCADE`;
    }

    await sql`
        INSERT INTO stores (id, name, address)
        VALUES (1, 'BananaLeaf Marketplace', 'Online Store')
        ON CONFLICT (id) DO UPDATE
        SET
            name = EXCLUDED.name,
            address = EXCLUDED.address
    `;

    for (const product of seedProducts) {
        await sql`
            INSERT INTO products (
                name,
                brand,
                flavor,
                nicotine,
                price,
                rating,
                reviews,
                image,
                category,
                description,
                stock_qty,
                store_id,
                is_express_delivery,
                is_bestseller,
                is_new_arrival
            ) VALUES (
                ${product.name},
                ${product.brand},
                ${product.flavor},
                ${product.nicotine},
                ${product.price},
                ${product.rating},
                ${product.reviews},
                ${product.image},
                ${product.category},
                ${product.description},
                ${product.stock_qty},
                ${1},
                ${Boolean(product.is_express_delivery)},
                ${Boolean(product.is_bestseller)},
                ${Boolean(product.is_new_arrival)}
            )
        `;
    }

    console.log(`[Seed:Postgres] Seeded ${seedProducts.length} products${forceReseed ? ' (force reseed)' : ''}.`);
    if (closeClient) {
        await sql.end({ timeout: 5 });
    }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
    seedPostgres({ closeClient: true }).catch((err) => {
        console.error('[Seed:Postgres] Failed:', err);
        process.exitCode = 1;
    });
}
