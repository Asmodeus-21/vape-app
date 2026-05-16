import postgres from 'postgres';
const sql = postgres('postgresql://postgres.avpuwbwkbyjggetyepzq:7kKJqVAW892kIAth@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require');
sql`SELECT 1 as result`.then(() => {
    console.log('DB Connected!');
    process.exit(0);
}).catch(e => {
    console.error('DB Error:', e.message);
    process.exit(1);
});
