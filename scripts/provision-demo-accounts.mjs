import bcrypt from 'bcryptjs';
import 'dotenv/config';
import postgres from 'postgres';

function sanitizeDatabaseUrl(value) {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return null;
    return trimmedValue.replace(/^['\"]|['\"]$/g, '');
}

function resolveDatabaseUrl() {
    return sanitizeDatabaseUrl(process.env.DATABASE_URL)
        || sanitizeDatabaseUrl(process.env.DATABASE_URL_LOCAL)
        || null;
}

function resolveSslMode(databaseUrl) {
    const hostname = new URL(databaseUrl).hostname.toLowerCase();
    if (process.env.NODE_ENV === 'production') {
        return { rejectUnauthorized: false };
    }
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1'
        ? false
        : 'require';
}

const dbUrl = resolveDatabaseUrl();
if (!dbUrl) {
    throw new Error('DATABASE_URL is required');
}

const sql = postgres(dbUrl, { ssl: resolveSslMode(dbUrl) });

const credentials = {
    customer: {
        email: 'customer@bananaleaf.com',
        name: 'BananaLeaf Demo Customer',
        role: 'customer',
        password: process.env.DEMO_CUSTOMER_PASSWORD || 'BananaLeafDemo!2026',
        storeId: null,
    },
    vendor: {
        email: 'vendor@bananaleaf.com',
        name: 'BananaLeaf Demo Vendor',
        role: 'vendor',
        password: process.env.DEMO_VENDOR_PASSWORD || 'BananaLeafDemo!2026',
        storeId: 1,
    },
    admin: {
        email: 'admin@bananaleaf.com',
        name: 'BananaLeaf Demo Admin',
        role: 'admin',
        password: process.env.DEMO_ADMIN_PASSWORD || 'BananaLeafDemo!2026',
        storeId: null,
    },
};

await sql.begin(async (tx) => {
    await tx`
        INSERT INTO stores (id, name, address)
        VALUES (1, 'BananaLeaf Marketplace', 'Online Store')
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name, address = EXCLUDED.address
    `;

    for (const account of Object.values(credentials)) {
        const passwordHash = await bcrypt.hash(account.password, 10);
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
                ${account.email},
                ${passwordHash},
                ${account.name},
                ${account.role},
                ${account.storeId},
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

    const vendorRows = await tx`SELECT id FROM users WHERE email = ${credentials.vendor.email} LIMIT 1`;
    const vendorId = vendorRows[0]?.id;
    if (vendorId) {
        await tx`UPDATE stores SET owner_id = ${vendorId} WHERE id = 1`;
    }
});

const stores = await sql`
    SELECT id, name, owner_id
    FROM stores
    WHERE id = 1
    ORDER BY id ASC
`;

console.log('DEMO_ACCOUNT_CREDENTIALS_START');
console.log(`CUSTOMER_EMAIL=${credentials.customer.email}`);
console.log(`VENDOR_EMAIL=${credentials.vendor.email}`);
console.log(`ADMIN_EMAIL=${credentials.admin.email}`);
console.log('STORES_CREATED_OR_UPDATED=' + JSON.stringify(stores));
console.log('DEMO_ACCOUNT_CREDENTIALS_END');

await sql.end();
