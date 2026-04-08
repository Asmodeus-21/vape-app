import { createApp } from '../server.js';

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
    if (!appPromise) {
        appPromise = createApp({ skipSeed: true, skipVite: true });
    }

    const app = await appPromise;
    return app(req, res);
}