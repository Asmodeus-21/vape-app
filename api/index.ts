import { seedPostgres } from '../db/seed-postgres.js';
import { createApp } from '../server.js';

let appPromise: ReturnType<typeof createApp> | null = null;
let seedRan = false;

export default async function handler(req: any, res: any) {
    try {
        if (!appPromise) {
            appPromise = createApp({ skipSeed: true, skipVite: true });
        }
        const app = await appPromise;

        // Run seed once after app is ready — idempotent (skips if products already exist).
        // Fire-and-forget so it never blocks the HTTP response.
        if (!seedRan) {
            seedRan = true;
            seedPostgres().catch((err) => {
                console.error('[vercel-handler] Background seed failed:', err);
                seedRan = false; // allow retry on next cold-start
            });
        }

        return app(req, res);
    } catch (err) {
        appPromise = null; // reset so the next request can retry initialisation
        console.error('[vercel-handler] App initialisation failed:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Service temporarily unavailable. Please retry.' });
        }
    }
}
