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

const password = process.env.DEMO_ADMIN_PASSWORD || 'BananaLeafDemo!2026';
const passwordHash = await bcrypt.hash(password, 10);

const email = 'admin@bananaleaf.com';
const role = 'admin';
const storeId = 1;

await sql.begin(async (tx) => {
    const storeRows = await tx`SELECT id FROM stores WHERE id = ${storeId} LIMIT 1`;

    if (!storeRows[0]) {
        await tx`INSERT INTO stores (id, name, address) VALUES (${storeId}, ${'BananaLeaf Marketplace'}, ${'Online Store'})`;
    }

    await tx`
    INSERT INTO users (email, password_hash, name, role, store_id, age_verified, verification_status)
    VALUES (${email}, ${passwordHash}, ${'Master Admin'}, ${role}, ${storeId}, TRUE, ${'verified'})
    ON CONFLICT (email)
    DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      store_id = EXCLUDED.store_id,
      age_verified = EXCLUDED.age_verified,
      verification_status = EXCLUDED.verification_status
  `;
});

const users = await sql`SELECT id, email, role, store_id FROM users WHERE email = ${email} LIMIT 1`;
const user = users[0];

console.log(`ADMIN_EMAIL=${email}`);
console.log(`ADMIN_ROLE_STORED=${user?.role ?? 'unknown'}`);
console.log(`ADMIN_STORE_ID=${user?.store_id ?? 'unknown'}`);

await sql.end();
