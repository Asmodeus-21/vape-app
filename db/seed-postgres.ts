import 'dotenv/config';
import { hashPassword } from '../server/auth.js';
import { getPostgresClient, initializePostgresSchema } from './index.js';
import { seedProducts } from './seed.js';

const HOMEPAGE_INVENTORY_BRANDS = new Set([
    'Geekbar Pulse X',
    'Foger Pods',
    'Utbar',
    'Flum Mello',
    'Geek Bar Pulse X 25K',
    'Utbar UT 50K',
    'Float Mello Pro 50K',
    'Foger Switch Pro',
    'Foger Switch Pro Pods',
]);

const DEFAULT_BRAND_IMAGE_BY_NAME: Record<string, string> = {
    'Geekbar Pulse X': '/images/geek-bar-pulse-x-25000-clear.jpg',
    'Foger Pods': '/images/devices/uwell-caliburn-g2.webp',
    Utbar: '/images/ut-bar-clear-no-flavor.jpg',
    'Flum Mello': '/images/devices/elf-bar-bc5000.png',
    'Geek Bar Pulse X 25K': '/images/devices/geek-bar-pulse-x-25k.jpg',
    'Utbar UT 50K': '/images/devices/utbar-ut-50k.jpg',
    'Float Mello Pro 50K': '/images/devices/float-mello-pro-50k.jpg',
    'Foger Switch Pro': '/images/devices/foger-switch-pro-kit.jpg',
    'Foger Switch Pro Pods': '/images/devices/foger-switch-pro-pods.jpg',
};

const DEFAULT_PLACEHOLDER_IMAGE = '/images/2023-05-11.webp';

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

function getHomepageInventorySeedProducts() {
    return seedProducts.filter((product) => HOMEPAGE_INVENTORY_BRANDS.has(product.brand));
}

function resolveSeedImageUrl(product: (typeof seedProducts)[number]): string {
    const image = product.image?.trim();
    if (image) {
        return image;
    }

    return DEFAULT_BRAND_IMAGE_BY_NAME[product.brand] || DEFAULT_PLACEHOLDER_IMAGE;
}

async function hasProductsImageUrlColumn(sql: ReturnType<typeof getPostgresClient>): Promise<boolean> {
    const rows = await sql<{ has_image_url: boolean }[]>`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'products'
              AND column_name = 'image_url'
        ) AS has_image_url
    `;

    return Boolean(rows[0]?.has_image_url);
}

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
    const hasImageUrlColumn = await hasProductsImageUrlColumn(sql);
    const homepageInventorySeedProducts = getHomepageInventorySeedProducts();
    const hasRequiredHomepageInventory = homepageInventorySeedProducts.length > 0;

    if (!hasRequiredHomepageInventory) {
        throw new Error('Seed catalog missing required homepage brands (Geekbar, Foger, Utbar, Flum Mello).');
    }

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

    // Build a single bulk INSERT for all products — avoids Vercel function timeout
    // that occurs when inserting 100+ rows one-at-a-time.
    const columns = hasImageUrlColumn
        ? ['name','brand','flavor','nicotine','price','rating','reviews','image','image_url','category','description','stock_qty','store_id','is_express_delivery','is_bestseller','is_new_arrival']
        : ['name','brand','flavor','nicotine','price','rating','reviews','image','category','description','stock_qty','store_id','is_express_delivery','is_bestseller','is_new_arrival'];

    const values: any[] = [];
    const placeholderRows: string[] = [];

    seedProducts.forEach((product, i) => {
        const img = resolveSeedImageUrl(product);
        const row = hasImageUrlColumn
            ? [product.name, product.brand, product.flavor, product.nicotine, product.price, product.rating, product.reviews, img, img, product.category, product.description, product.stock_qty, PRIMARY_STORE.id, Boolean(product.is_express_delivery), Boolean(product.is_bestseller), Boolean(product.is_new_arrival)]
            : [product.name, product.brand, product.flavor, product.nicotine, product.price, product.rating, product.reviews, img, product.category, product.description, product.stock_qty, PRIMARY_STORE.id, Boolean(product.is_express_delivery), Boolean(product.is_bestseller), Boolean(product.is_new_arrival)];
        const offset = i * columns.length;
        placeholderRows.push(`(${row.map((_, j) => `$${offset + j + 1}`).join(',')})`);
        values.push(...row);
    });

    await sql.unsafe(
        `INSERT INTO products (${columns.join(',')}) VALUES ${placeholderRows.join(',')}`,
        values,
    );

    console.log(`[Seed:Postgres] Refreshed ${OFFICIAL_DEMO_USERS.length} demo users and seeded ${seedProducts.length} products${forceReseed ? ' (force reseed)' : ''}.`);
    console.log(`[Seed:Postgres] Homepage inventory brands verified: ${Array.from(HOMEPAGE_INVENTORY_BRANDS).join(', ')} (${homepageInventorySeedProducts.length} products).`);
    if (closeClient) {
        await sql.end({ timeout: 5 });
    }
}

const scriptEntryArg = process.argv[1]?.replace(/\\/g, '/') ?? '';
const isInvokedAsSeedScript = /\/seed-postgres\.(ts|js)$/i.test(scriptEntryArg);

if (isInvokedAsSeedScript) {
    seedPostgres({ closeClient: true }).catch((err) => {
        console.error('[Seed:Postgres] Failed:', err);
        process.exitCode = 1;
    });
}
