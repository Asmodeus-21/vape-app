import { createApp } from '../server.js';

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
    try {
        if (!appPromise) {
            appPromise = createApp({ skipSeed: true, skipVite: true });
        }
        const app = await appPromise;
        return app(req, res);
    } catch (err) {
        appPromise = null; // reset so the next request can retry initialisation
        console.error('[vercel-handler] App initialisation failed:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Service temporarily unavailable. Please retry.' });
        }
    }
}
