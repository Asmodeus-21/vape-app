import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

type ParsedEnv = {
    rawUrl: string;
    user: string;
    password: string;
    projectRef: string;
};

function parseDatabaseUrlFromEnvLocal(): ParsedEnv {
    const envPath = path.join(process.cwd(), '.env.local');
    const envText = fs.readFileSync(envPath, 'utf8');
    const databaseUrlLine = envText
        .split(/\r?\n/)
        .find((line) => /^DATABASE_URL\s*=/.test(line.trim()));

    if (!databaseUrlLine) {
        throw new Error('DATABASE_URL is missing in .env.local');
    }

    const rawUrl = databaseUrlLine
        .split('=', 2)[1]
        ?.trim()
        .replace(/^['"]|['"]$/g, '');

    if (!rawUrl) {
        throw new Error('DATABASE_URL is empty in .env.local');
    }

    const parsed = new URL(rawUrl);
    const [user, password] = parsed.username ? [parsed.username, parsed.password] : ['', ''];
    const hostMatch = parsed.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);

    if (!hostMatch) {
        throw new Error('DATABASE_URL host does not look like db.<project-ref>.supabase.co');
    }
    if (!password) {
        throw new Error('DATABASE_URL password is missing');
    }

    return {
        rawUrl,
        user,
        password,
        projectRef: hostMatch[1],
    };
}

async function canConnect(connectionUrl: string): Promise<boolean> {
    const sql = postgres(connectionUrl, {
        ssl: 'require',
        connect_timeout: 8,
        max: 1,
    });

    try {
        await sql`select 1`;
        return true;
    } catch {
        return false;
    } finally {
        try {
            await sql.end({ timeout: 1 });
        } catch {
            // ignore connection close errors in probe mode
        }
    }
}

async function main() {
    const parsed = parseDatabaseUrlFromEnvLocal();
    const regions = ['us-west-1', 'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1'];
    const userCandidates = [`postgres.${parsed.projectRef}`, parsed.user || 'postgres'];

    for (const region of regions) {
        const poolerHost = `aws-0-${region}.pooler.supabase.com`;
        for (const user of userCandidates) {
            const poolerUrl = `postgresql://${user}:${parsed.password}@${poolerHost}:6543/postgres`;
            const ok = await canConnect(poolerUrl);
            if (ok) {
                const maskedPoolerUrl = poolerUrl.replace(/:[^:@/]+@/, ':***@');
                console.log(maskedPoolerUrl);
                return;
            }
        }
    }

    process.exitCode = 2;
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
