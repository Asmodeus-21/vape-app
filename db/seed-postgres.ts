import 'dotenv/config';
import { hashPassword } from '../server/auth.js';
import { getPostgresClient, initializePostgresSchema } from './index.js';
import { seedProducts } from './seed.js';

export const PRIMARY_STORE = {
    id: 1,
    name: 'BananaLeaf Marketplace',
    address: 'Online Store',
};

const OFFICIAL_DEMO_PASSWORD = 'BananaLeafDemo!2026';

export const OFFICIAL_DEMO_USERS = [
    {
        email: 'customer@bananaleaf.com',
        name: 'BananaLeaf Demo Customer',
        role: 'customer',
        password: OFFICIAL_DEMO_PASSWORD,
        storeId: null,
    },
    {
        email: 'vendor@bananaleaf.com',
        name: 'BananaLeaf Demo Vendor',
        role: 'vendor',
        password: OFFICIAL_DEMO_PASSWORD,
        storeId: PRIMARY_STORE.id,
    },
    {
        email: 'admin@bananaleaf.com',
        name: 'BananaLeaf Demo Admin',
        role: 'admin',
        password: OFFICIAL_DEMO_PASSWORD,
        storeId: null,
    },
] as const;

async function ensurePrimaryStore(sql: any): Promise<void> {
    await sql`
        INSERT INTO stores (id, name, address)
        VALUES (${PRIMARY_STORE.id}, ${PRIMARY_STORE.name}, ${PRIMARY_STORE.address})
        ON CONFLICT (id) DO UPDATE
        SET
            name = EXCLUDED.name,
            address = EXCLUDED.address
    `;
}

async function upsertOfficialDemoUsers(sql: ReturnType<typeof getPostgresClient>): Promise<void> {
    const passwordHashes = await Promise.all(
        OFFICIAL_DEMO_USERS.map(async (user) => [user.email, await hashPassword(user.password)] as const)
    );
    const passwordHashByEmail = new Map(passwordHashes);

    await sql.begin(async (tx: any) => {
        await ensurePrimaryStore(tx);

        for (const user of OFFICIAL_DEMO_USERS) {
            const passwordHash = passwordHashByEmail.get(user.email);
            if (!passwordHash) {
                throw new Error(`Missing password hash for ${user.email}`);
            }

            await tx`
                INSERT INTO users (
                    email,
                    password_hash,
                    name,
                    role,
                    store_id,
                    age_verified,
                    verification_status
                ) VALUES (
                    ${user.email},
                    ${passwordHash},
                    ${user.name},
                    ${user.role},
                    ${user.storeId},
                    TRUE,
                    'verified'
                )
                ON CONFLICT (email)
                DO UPDATE SET
                    password_hash = EXCLUDED.password_hash,
                    name = EXCLUDED.name,
                    role = EXCLUDED.role,
                    store_id = EXCLUDED.store_id,
                    age_verified = EXCLUDED.age_verified,
                    verification_status = EXCLUDED.verification_status
            `;
        }

        const vendorRows = await tx<{ id: number }[]>`
            SELECT id
            FROM users
            WHERE email = ${'vendor@bananaleaf.com'}
            LIMIT 1
        `;
        const vendorId = vendorRows[0]?.id;

        if (vendorId) {
            await tx`
                UPDATE stores
                SET owner_id = ${vendorId}
                WHERE id = ${PRIMARY_STORE.id}
            `;
        }
    });
}

export async function seedPostgres(options?: { closeClient?: boolean }): Promise<void> {
    const sql = getPostgresClient();
    const closeClient = options?.closeClient ?? false;

    await initializePostgresSchema(sql);
    await ensurePrimaryStore(sql);
    await upsertOfficialDemoUsers(sql);

    const forceReseed = process.env.FORCE_RESEED === 'true';
    const countResult = await sql<{ cnt: string }[]>`SELECT COUNT(*)::text AS cnt FROM products`;
    const count = Number(countResult[0]?.cnt ?? 0);

    if (!forceReseed && count > 0) {
        console.log(`[Seed:Postgres] Refreshed ${OFFICIAL_DEMO_USERS.length} demo users. DB already has ${count} products - skipping product seed.`);
        if (closeClient) {
            await sql.end({ timeout: 5 });
        }
        return;
    }

    if (count > 0) {
        await sql`TRUNCATE TABLE products RESTART IDENTITY CASCADE`;
    }

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

    console.log(`[Seed:Postgres] Refreshed ${OFFICIAL_DEMO_USERS.length} demo users and seeded ${seedProducts.length} products${forceReseed ? ' (force reseed)' : ''}.`);
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
