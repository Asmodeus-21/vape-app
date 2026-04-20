import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import 'dotenv/config';
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
// vite is a devDependency — import dynamically to avoid crashing in production
import { getPostgresClient, initializeDatabase } from "./db/index.js";
import { seedPostgres } from "./db/seed-postgres.js";
import { authMiddleware, createToken, loginUser, registerUser, verifyToken, type AuthPayload } from "./server/auth.js";
import { sendDeliveredNotification, sendOrderConfirmation, sendOtpEmail } from "./server/email.js";
import {
    checkoutOrder,
    clearUserCart,
    createOtp,
    createVendorProduct,
    deleteVendorProduct,
    findUserByEmail,
    findUserById,
    getAdminStats,
    getCartItems,
    getOrderWithUser,
    getProductById,
    getValidOtp,
    getVendorStats,
    listAdminOrders,
    listAdminProducts,
    listAdminStores,
    listAdminUsers,
    listHomepageMasterListings,
    listMarketplaceProducts,
    listVendorOrders,
    listVendorProducts,
    markOtpUsed,
    removeCartItem,
    setCartItemQuantity,
    storeExists,
    updateUserRole,
    updateUserVerification,
    updateVendorOrderStatus,
    updateVendorProduct,
    upsertCartItem
} from "./server/postgres-repo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Gemini AI (server-side only) ─────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function callGemini(prompt: string, systemInstruction: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: { systemInstruction },
        });
        return response.text || "No response generated.";
    } catch (err) {
        console.error("[Gemini Error]", err);
        return "AI service temporarily unavailable. Please try again.";
    }
}

const AI_MAINTENANCE_MESSAGE = 'Maintenance Mode: AI assistance is temporarily unavailable while the data layer is offline. Please try again shortly.';

function isStoreManagerRole(role?: string): boolean {
    return role === 'vendor' || role === 'store_manager';
}

function isSuperAdminRole(role?: string): boolean {
    return role === 'admin' || role === 'super_admin';
}

function parseOptionalStoreId(rawStoreId: unknown): number | null {
    if (typeof rawStoreId !== 'string') {
        return null;
    }

    const parsed = Number(rawStoreId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error('Invalid storeId query parameter');
    }

    return parsed;
}

function sendSafeError(res: express.Response, err: any, fallback: string): void {
    const safeMessage = process.env.NODE_ENV === 'production' ? fallback : (err?.message || fallback);
    console.error('[server]', err);
    res.status(500).json({ error: safeMessage });
}

function parseProductNumberFields(rawPrice: unknown, rawStockQty: unknown) {
    const price = Number(rawPrice);
    const stockQty = Number(rawStockQty ?? 100);

    if (!Number.isFinite(price) || price <= 0 || price > 999999) {
        throw new Error('Price must be a positive number between 0.01 and 999999');
    }

    if (!Number.isInteger(stockQty) || stockQty < 0 || stockQty > 1000000) {
        throw new Error('Stock quantity must be a non-negative integer up to 1,000,000');
    }

    return { price, stockQty };
}

function parseProductInput(body: any, fallbackVendorId: number, storeId: number) {
    const { price, stockQty } = parseProductNumberFields(body.price, body.stockQty);

    return {
        name: body.name,
        brand: body.brand || 'BananaLeaf Retailer',
        flavor: body.flavor || 'N/A',
        nicotine: body.nicotine || 'N/A',
        price,
        image: body.image,
        category: body.category,
        description: body.description,
        stockQty,
        vendorId: fallbackVendorId,
        storeId,
    };
}

export async function createApp(options: { skipSeed?: boolean; skipVite?: boolean } = {}) {
    const { skipSeed = false, skipVite = false } = options;

    if (process.env.NODE_ENV === "production") {
        if (!process.env.JWT_SECRET?.trim()) {
            throw new Error("JWT_SECRET is required in production.");
        }
        // CORS_ORIGIN is optional — on Vercel the frontend and API share the same
        // domain (same-origin), so the browser never sends a CORS preflight.
        // VERCEL_URL is used as an automatic fallback when present.
    }

    // ─── Init DB ───────────────────────────────────────────────────────────────
    let sql!: ReturnType<typeof getPostgresClient>;
    let isDatabaseConnected = false;
    const databaseWarningMessage = '⚠️ DATABASE NOT CONNECTED. Add DATABASE_URL to the environment, .env.production, .env.local, or .env and restart the server.';

    try {
        await initializeDatabase();
        if (!skipSeed) {
            await seedPostgres();
        }
        sql = getPostgresClient();
        isDatabaseConnected = true;
    } catch (err) {
        console.error(databaseWarningMessage);
        console.error('[db]', err);
    }

    const app = express();
    app.locals.isDatabaseConnected = isDatabaseConnected;

    app.use(express.json());

    // Build allowed origins list:
    // 1. Explicit CORS_ORIGIN env var (comma-separated for multiple)
    // 2. Vercel preview URL auto-injected by Vercel
    // 3. Custom domain(s) from CORS_EXTRA_ORIGINS env var (comma-separated)
    // 4. Known production domains (hardcoded as fallback)
    const KNOWN_PRODUCTION_ORIGINS = [
        'https://banana-leaf.store',
        'https://www.banana-leaf.store',
    ];

    const LOCAL_DEVELOPMENT_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ];

    const rawOrigins = [
        process.env.CORS_ORIGIN,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
        process.env.CORS_EXTRA_ORIGINS,
        ...KNOWN_PRODUCTION_ORIGINS,
        ...LOCAL_DEVELOPMENT_ORIGINS,
    ]
        .filter(Boolean)
        .join(',')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

    const allowedOrigins = rawOrigins.length > 0 ? rawOrigins : null;

    app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === "production"
            ? undefined
            : false,
    }));
    app.use(cors({
        origin: allowedOrigins
            ? (origin, cb) => {
                // Allow same-origin requests (no Origin header) and listed origins
                if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
                cb(new Error(`CORS: ${origin} not allowed`));
            }
            : process.env.NODE_ENV !== 'production',
        credentials: Boolean(allowedOrigins),
    }));

    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "Too many requests, please try again later." },
    });

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "Too many auth attempts, please try again later." },
    });

    const aiLimiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 50,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "AI quota exceeded. Please try again later." },
    });

    app.use("/api/auth/login", authLimiter);
    app.use("/api/auth/register", authLimiter);
    app.use("/api/auth/request-otp", authLimiter);
    app.use("/api/auth/register-with-otp", authLimiter);
    app.use("/api/auth/login-otp", authLimiter);
    app.use("/api/auth/verify-login-otp", authLimiter);
    app.use("/api", apiLimiter);

    app.get('/api/health', (_req, res) => {
        res.status(isDatabaseConnected ? 200 : 503).json({
            ok: isDatabaseConnected,
            error: isDatabaseConnected ? null : databaseWarningMessage,
        });
    });

    app.use('/api', (req, res, next) => {
        if (req.path === '/health') {
            next();
            return;
        }
        if (isDatabaseConnected) {
            next();
            return;
        }

        if (req.path === '/ai/chat') {
            res.json({
                text: AI_MAINTENANCE_MESSAGE,
                maintenanceMode: true,
            });
            return;
        }

        res.status(503).json({ error: databaseWarningMessage });
    });

    // ─── PRODUCTS API ─────────────────────────────────────────────────────────
    app.get("/api/products", async (req, res) => {
        try {
            const { search = "", filter = "all", category = "", limit = "" } = req.query as Record<string, string>;
            const parsedLimit = Number(limit);
            const resolvedLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;
            res.json(await listMarketplaceProducts(sql, { search, filter, category, limit: resolvedLimit }));
        } catch (err: any) {
            sendSafeError(res, err, "Failed to fetch products");
        }
    });

    app.get("/api/products/master-listings", async (req, res) => {
        try {
            const { limit = "8" } = req.query as Record<string, string>;
            const parsedLimit = Number(limit);
            const resolvedLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 8;
            res.json(await listHomepageMasterListings(sql, resolvedLimit));
        } catch (err: any) {
            sendSafeError(res, err, "Failed to fetch homepage master listings");
        }
    });

    app.get("/api/products/:id", async (req, res) => {
        try {
            const product = await getProductById(sql, Number(req.params.id));
            if (!product) {
                res.status(404).json({ error: "Product not found" });
                return;
            }
            res.json(product);
        } catch (err: any) {
            sendSafeError(res, err, "Failed to fetch product");
        }
    });

    // ─── AUTH ROUTES ──────────────────────────────────────────────────────────
    app.post("/api/auth/register", async (req, res) => {
        const { email, password, name, role, storeName, storeAddress } = req.body;
        if (!email || !password || !name) {
            res.status(400).json({ error: "Email, password, and name are required." });
            return;
        }
        const result = await registerUser(email, password, name, role || "customer", {
            name: storeName,
            address: storeAddress,
        });
        if (!result.success) {
            res.status(400).json({ error: result.error });
            return;
        }
        res.status(201).json({ token: result.token, user: result.user });
    });

    app.post("/api/auth/login", async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: "Email and password are required." });
            return;
        }
        const result = await loginUser(email, password);
        if (!result.success) {
            res.status(401).json({ error: result.error });
            return;
        }
        res.json({ token: result.token, user: result.user });
    });

    app.post('/api/auth/login-otp', async (req, res) => {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            res.status(400).json({ error: 'Valid email is required.' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        try {
            const existingUser = await findUserByEmail(sql, normalizedEmail);
            if (!existingUser) {
                res.status(404).json({ error: 'No account found for that email.' });
                return;
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await createOtp(sql, normalizedEmail, code, expiresAt);
            await sendOtpEmail(normalizedEmail, code);
            res.json({ success: true });
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to send login code');
        }
    });

    app.post('/api/auth/verify-login-otp', async (req, res) => {
        const { email, code } = req.body;
        if (!email || !code) {
            res.status(400).json({ error: 'Email and code are required.' });
            return;
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        try {
            const otp = await getValidOtp(sql, normalizedEmail, String(code).trim());
            if (!otp) {
                res.status(400).json({ error: 'Invalid or expired verification code.' });
                return;
            }

            const existingUser = await findUserByEmail(sql, normalizedEmail);
            if (!existingUser) {
                res.status(404).json({ error: 'User not found.' });
                return;
            }

            await markOtpUsed(sql, otp.id);

            const token = createToken({
                userId: Number(existingUser.id),
                email: existingUser.email,
                role: existingUser.role,
                storeId: existingUser.store_id ?? null,
            });

            res.json({
                token,
                user: {
                    id: Number(existingUser.id),
                    email: existingUser.email,
                    name: existingUser.name,
                    role: existingUser.role,
                    storeId: existingUser.store_id ?? null,
                },
            });
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to verify login code');
        }
    });

    app.get("/api/auth/me", async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const token = authHeader.slice(7);
        const payload = verifyToken(token) as AuthPayload | null;
        if (!payload) {
            res.status(401).json({ error: "Invalid or expired token" });
            return;
        }
        const user = await findUserById(sql, payload.userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({
            user: {
                ...user,
                storeId: user.store_id ?? null,
            },
        });
    });
    // ─── ORDERS API ─────────────────────────────────────────────────────────
    app.post("/api/orders/checkout", authMiddleware, async (req, res) => {
        const { items, shippingAddress } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: "Items array is required" });
            return;
        }
        if (items.length > 50) {
            res.status(400).json({ error: "Maximum 50 items per order" });
            return;
        }
        if (typeof shippingAddress !== 'string' || shippingAddress.trim().length < 10) {
            res.status(400).json({ error: "Valid shipping address is required (min 10 characters)" });
            return;
        }

        for (const item of items) {
            if (!item || !Number.isInteger(item.productId) || item.productId <= 0) {
                res.status(400).json({ error: "Invalid product ID" });
                return;
            }
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                res.status(400).json({ error: "Quantity must be a positive integer" });
                return;
            }
            if (item.quantity > 1000) {
                res.status(400).json({ error: "Maximum quantity per item is 1000" });
                return;
            }
        }

        const normalizedShippingAddress = shippingAddress.trim();
        if (!normalizedShippingAddress) {
            res.status(400).json({ error: "Invalid checkout data" });
            return;
        }
        const userId = req.user!.userId;

        try {
            const orderId = await checkoutOrder(sql, userId, items, normalizedShippingAddress);
            // Clear the user's saved cart after successful checkout
            await clearUserCart(sql, userId);
            // Send order confirmation email
            const orderInfo = await getOrderWithUser(sql, orderId);
            if (orderInfo?.email) {
                await sendOrderConfirmation(orderInfo.email, orderId, Number(orderInfo.total_amount));
            }
            res.status(201).json({ success: true, orderId });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    });

    app.post('/api/orders/guest-checkout', async (req, res) => {
        const { items, shippingAddress, customerEmail, customerName, saveDetails } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'Items array is required' });
            return;
        }
        if (items.length > 50) {
            res.status(400).json({ error: 'Maximum 50 items per order' });
            return;
        }
        if (typeof shippingAddress !== 'string' || shippingAddress.trim().length < 10) {
            res.status(400).json({ error: 'Valid shipping address is required (min 10 characters)' });
            return;
        }

        for (const item of items) {
            if (!item || !Number.isInteger(item.productId) || item.productId <= 0) {
                res.status(400).json({ error: 'Invalid product ID' });
                return;
            }
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                res.status(400).json({ error: 'Quantity must be a positive integer' });
                return;
            }
            if (item.quantity > 1000) {
                res.status(400).json({ error: 'Maximum quantity per item is 1000' });
                return;
            }
        }

        const normalizedShippingAddress = shippingAddress.trim();
        const normalizedEmail = typeof customerEmail === 'string' ? customerEmail.toLowerCase().trim() : '';
        const normalizedName = typeof customerName === 'string' && customerName.trim()
            ? customerName.trim()
            : 'Guest Customer';

        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            res.status(400).json({ error: 'A valid email is required for guest checkout' });
            return;
        }

        try {
            let checkoutUserId: number;
            const shouldSaveDetails = Boolean(saveDetails);

            if (shouldSaveDetails) {
                const existingUser = await findUserByEmail(sql, normalizedEmail);
                if (existingUser) {
                    checkoutUserId = Number(existingUser.id);
                } else {
                    const generatedPassword = `Guest#${Date.now()}!`;
                    const registration = await registerUser(normalizedEmail, generatedPassword, normalizedName, 'customer');
                    if (!registration.success || !registration.user) {
                        res.status(400).json({ error: registration.error || 'Unable to create customer profile' });
                        return;
                    }
                    checkoutUserId = Number(registration.user.id);
                }
            } else {
                // Use an isolated synthetic account per guest order to avoid
                // commingling order history across unrelated visitors.
                const guestAliasEmail = `guest+${Date.now()}-${Math.floor(Math.random() * 100000)}@banana-leaf.store`;
                const registration = await registerUser(guestAliasEmail, `Guest#${Date.now()}!`, normalizedName, 'customer');
                if (!registration.success || !registration.user) {
                    res.status(400).json({ error: registration.error || 'Unable to initialize guest checkout profile' });
                    return;
                }
                checkoutUserId = Number(registration.user.id);
            }

            const orderId = await checkoutOrder(sql, checkoutUserId, items, normalizedShippingAddress);
            const orderInfo = await getOrderWithUser(sql, orderId);
            const orderTotal = orderInfo ? Number(orderInfo.total_amount) : 0;
            await sendOrderConfirmation(normalizedEmail, orderId, orderTotal);

            res.status(201).json({ success: true, orderId, guest: true });
        } catch (err: any) {
            res.status(400).json({ error: err.message || 'Guest checkout failed' });
        }
    });

    // ─── CART API ────────────────────────────────────────────────────────────
    app.get("/api/cart", authMiddleware, async (req, res) => {
        try {
            const items = await getCartItems(sql, req.user!.userId);
            res.json(items);
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to fetch cart');
        }
    });

    app.post("/api/cart", authMiddleware, async (req, res) => {
        const { productId, quantity } = req.body;
        if (!Number.isInteger(productId) || productId <= 0) {
            res.status(400).json({ error: 'Invalid productId' });
            return;
        }
        const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
        try {
            await upsertCartItem(sql, req.user!.userId, productId, qty);
            res.json({ success: true });
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to add to cart');
        }
    });

    app.patch("/api/cart/:productId", authMiddleware, async (req, res) => {
        const productId = Number(req.params.productId);
        const { quantity } = req.body;
        if (!Number.isInteger(productId) || productId <= 0) {
            res.status(400).json({ error: 'Invalid productId' });
            return;
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            res.status(400).json({ error: 'Quantity must be a positive integer' });
            return;
        }
        try {
            await setCartItemQuantity(sql, req.user!.userId, productId, quantity);
            res.json({ success: true });
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to update cart item');
        }
    });

    app.delete("/api/cart/clear", authMiddleware, async (req, res) => {
        try {
            await clearUserCart(sql, req.user!.userId);
            res.json({ success: true });
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to clear cart');
        }
    });

    app.delete("/api/cart/:productId", authMiddleware, async (req, res) => {
        const productId = Number(req.params.productId);
        if (!Number.isInteger(productId) || productId <= 0) {
            res.status(400).json({ error: 'Invalid productId' });
            return;
        }
        try {
            await removeCartItem(sql, req.user!.userId, productId);
            res.json({ success: true });
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to remove cart item');
        }
    });

    // ─── OTP AUTH ─────────────────────────────────────────────────────────────
    app.post("/api/auth/request-otp", async (req, res) => {
        const { email } = req.body;
        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400).json({ error: 'Valid email is required' });
            return;
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        try {
            await createOtp(sql, email.toLowerCase().trim(), code, expiresAt);
            await sendOtpEmail(email.toLowerCase().trim(), code);
            res.json({ success: true });
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to send OTP');
        }
    });

    app.post("/api/auth/register-with-otp", async (req, res) => {
        const { email, code, name, password, isVendor, storeName, storeAddress } = req.body;
        if (!email || !code || !name || !password) {
            res.status(400).json({ error: 'email, code, name, and password are required' });
            return;
        }
        if (typeof password !== 'string' || password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters' });
            return;
        }
        const normalizedEmail = String(email).toLowerCase().trim();
        try {
            const otp = await getValidOtp(sql, normalizedEmail, String(code).trim());
            if (!otp) {
                res.status(400).json({ error: 'Invalid or expired verification code' });
                return;
            }
            await markOtpUsed(sql, otp.id);
            const role = isVendor ? 'store_manager' : 'customer';
            const storeInput = isVendor
                ? { name: storeName || `${name}'s Franchise`, address: storeAddress || '' }
                : undefined;
            const result = await registerUser(normalizedEmail, password, name, role, storeInput);
            if (!result.success) {
                res.status(400).json({ error: result.error });
                return;
            }
            res.status(201).json({ success: true, user: result.user, token: result.token });
        } catch (err: any) {
            res.status(400).json({ error: err.message || 'Registration failed' });
        }
    });

    // ─── AI PROXY (keeps API key server-side) ─────────────────────────────────
    app.post("/api/ai/chat", authMiddleware, aiLimiter, async (req, res) => {
        if (!isDatabaseConnected) {
            res.json({
                text: AI_MAINTENANCE_MESSAGE,
                maintenanceMode: true,
            });
            return;
        }

        const { prompt, systemInstruction } = req.body;
        if (!prompt || !systemInstruction) {
            res.status(400).json({ error: "prompt and systemInstruction are required." });
            return;
        }
        const text = await callGemini(prompt, systemInstruction);
        res.json({ text });
    });

    // ─── ADMIN ROUTES (restricted) ───────────────────────────────────────────
    app.get("/api/admin/stats", authMiddleware, async (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        try {
            res.json(await getAdminStats(sql));
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to fetch admin stats');
        }
    });

    app.get("/api/admin/users", authMiddleware, async (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        try {
            res.json(await listAdminUsers(sql));
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to fetch admin users');
        }
    });

    app.patch("/api/admin/users/:id/verify", authMiddleware, async (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        const { status } = req.body;
        const { id } = req.params;
        if (!['verified', 'rejected', 'unverified'].includes(status)) {
            res.status(400).json({ error: "Invalid verification status" });
            return;
        }
        try {
            await updateUserVerification(sql, Number(id), status);
            res.json({ success: true });
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to update verification status');
        }
    });

    app.patch("/api/admin/users/:id/role", authMiddleware, async (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        const { role } = req.body;
        const { id } = req.params;
        const roleAliasMap: Record<string, string> = {
            store_manager: 'vendor',
            super_admin: 'admin',
        };
        const normalizedRole = roleAliasMap[role] || role;
        if (!['customer', 'vendor', 'admin'].includes(normalizedRole)) {
            res.status(400).json({ error: "Invalid role" });
            return;
        }
        try {
            await updateUserRole(sql, Number(id), normalizedRole);
            res.json({ success: true });
        } catch (err: any) {
            if (err.message === 'User not found') {
                res.status(404).json({ error: err.message });
                return;
            }
            if (err.message.includes('store_manager')) {
                res.status(400).json({ error: err.message });
                return;
            }
            sendSafeError(res, err, 'Failed to update user role');
        }
    });

    app.get("/api/admin/products", authMiddleware, async (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        try {
            const storeIdQuery = parseOptionalStoreId(req.query.storeId);
            if (storeIdQuery !== null && !(await storeExists(sql, storeIdQuery))) {
                res.status(404).json({ error: 'Store not found' });
                return;
            }
            res.json(await listAdminProducts(sql, storeIdQuery));
        } catch (err: any) {
            if (err.message === 'Invalid storeId query parameter') {
                res.status(400).json({ error: err.message });
                return;
            }
            sendSafeError(res, err, 'Failed to fetch admin products');
        }
    });

    app.get("/api/admin/orders", authMiddleware, async (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        try {
            const storeIdQuery = parseOptionalStoreId(req.query.storeId);
            if (storeIdQuery !== null && !(await storeExists(sql, storeIdQuery))) {
                res.status(404).json({ error: 'Store not found' });
                return;
            }
            res.json(await listAdminOrders(sql, storeIdQuery));
        } catch (err: any) {
            if (err.message === 'Invalid storeId query parameter') {
                res.status(400).json({ error: err.message });
                return;
            }
            sendSafeError(res, err, 'Failed to fetch admin orders');
        }
    });

    app.get('/api/admin/stores', authMiddleware, async (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: 'Super admin access required' });
            return;
        }

        try {
            res.json(await listAdminStores(sql));
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to fetch stores');
        }
    });

    // ─── VENDOR ROUTES (protected) ────────────────────────────────────────────
    app.get("/api/vendor/stats", authMiddleware, async (req, res) => {
        const isManager = isStoreManagerRole(req.user?.role);
        const isSuperAdmin = isSuperAdminRole(req.user?.role);

        if (!isManager && !isSuperAdmin) {
            res.status(403).json({ error: "Vendor access required" });
            return;
        }
        const storeId = req.user?.storeId ?? null;
        if (isManager && !storeId) {
            res.status(403).json({ error: 'Store manager is not linked to a store' });
            return;
        }

        try {
            res.json(await getVendorStats(sql, isSuperAdmin ? null : storeId));
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to fetch vendor stats');
        }
    });

    app.get("/api/vendor/orders", authMiddleware, async (req, res) => {
        const isManager = isStoreManagerRole(req.user?.role);
        const isSuperAdmin = isSuperAdminRole(req.user?.role);

        if (!isManager && !isSuperAdmin) {
            res.status(403).json({ error: "Vendor access required" });
            return;
        }
        const storeId = req.user?.storeId ?? null;
        if (isManager && !storeId) {
            res.status(403).json({ error: 'Store manager is not linked to a store' });
            return;
        }

        try {
            res.json(await listVendorOrders(sql, isSuperAdmin ? null : storeId));
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to fetch vendor orders');
        }
    });

    app.patch("/api/vendor/orders/:id/status", authMiddleware, async (req, res) => {
        const isManager = isStoreManagerRole(req.user?.role);
        const isSuperAdmin = isSuperAdminRole(req.user?.role);

        if (!isManager && !isSuperAdmin) {
            res.status(403).json({ error: "Vendor access required" });
            return;
        }
        const { status } = req.body;
        const { id } = req.params;

        if (isManager && !req.user?.storeId) {
            res.status(403).json({ error: 'Store manager is not linked to a store' });
            return;
        }

        if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            res.status(400).json({ error: "Invalid status" });
            return;
        }

        try {
            await updateVendorOrderStatus(sql, Number(id), status, isSuperAdmin ? null : (req.user?.storeId ?? null));
            if (status === 'delivered') {
                const orderInfo = await getOrderWithUser(sql, Number(id));
                if (orderInfo?.email) {
                    await sendDeliveredNotification(orderInfo.email, Number(id));
                }
            }
            res.json({ success: true });
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to update order status');
        }
    });

    app.get("/api/vendor/products", authMiddleware, async (req, res) => {
        const isManager = isStoreManagerRole(req.user?.role);
        const isSuperAdmin = isSuperAdminRole(req.user?.role);

        if (!isManager && !isSuperAdmin) {
            res.status(403).json({ error: "Vendor access required" });
            return;
        }
        const storeId = req.user?.storeId ?? null;
        if (isManager && !storeId) {
            res.status(403).json({ error: 'Store manager is not linked to a store' });
            return;
        }

        try {
            res.json(await listVendorProducts(sql, isSuperAdmin ? null : storeId));
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to fetch vendor products');
        }
    });

    app.post("/api/vendor/products", authMiddleware, async (req, res) => {
        const isManager = isStoreManagerRole(req.user?.role);
        const isSuperAdmin = isSuperAdminRole(req.user?.role);

        if (!isManager && !isSuperAdmin) {
            res.status(403).json({ error: "Vendor access required" });
            return;
        }

        const { name, brand, flavor, nicotine, price, image, category, description, stockQty } = req.body;
        const targetStoreId = isSuperAdmin ? req.body.storeId : req.user?.storeId;

        if (!targetStoreId) {
            res.status(400).json({ error: 'Store linkage is required for product creation' });
            return;
        }

        if (!name || !price || !image || !category || !description) {
            res.status(400).json({ error: "Missing required product fields" });
            return;
        }

        try {
            if (!(await storeExists(sql, Number(targetStoreId)))) {
                res.status(400).json({ error: `Store ID ${targetStoreId} does not exist` });
                return;
            }
            const productId = await createVendorProduct(sql, parseProductInput(req.body, req.user!.userId, Number(targetStoreId)));
            res.status(201).json({ success: true, productId });
        } catch (err: any) {
            if (err.message.includes('Price must') || err.message.includes('Stock quantity')) {
                res.status(400).json({ error: err.message });
                return;
            }
            sendSafeError(res, err, 'Failed to create product');
        }
    });

    app.patch("/api/vendor/products/:id", authMiddleware, async (req, res) => {
        const isManager = isStoreManagerRole(req.user?.role);
        const isSuperAdmin = isSuperAdminRole(req.user?.role);

        if (!isManager && !isSuperAdmin) {
            res.status(403).json({ error: "Vendor access required" });
            return;
        }
        if (isManager && !req.user?.storeId) {
            res.status(403).json({ error: 'Store manager is not linked to a store' });
            return;
        }
        const { name, brand, flavor, nicotine, price, category, description, stockQty } = req.body;
        const { id } = req.params;

        try {
            const validatedNumbers = parseProductNumberFields(price, stockQty);
            await updateVendorProduct(sql, Number(id), {
                name,
                brand,
                flavor,
                nicotine,
                price: validatedNumbers.price,
                category,
                description,
                stockQty: validatedNumbers.stockQty,
            }, isSuperAdmin ? null : (req.user?.storeId ?? null));
            res.json({ success: true });
        } catch (err: any) {
            if (err.message.includes('Price must') || err.message.includes('Stock quantity')) {
                res.status(400).json({ error: err.message });
                return;
            }
            sendSafeError(res, err, 'Failed to update product');
        }
    });

    app.delete("/api/vendor/products/:id", authMiddleware, async (req, res) => {
        const isManager = isStoreManagerRole(req.user?.role);
        const isSuperAdmin = isSuperAdminRole(req.user?.role);

        if (!isManager && !isSuperAdmin) {
            res.status(403).json({ error: "Vendor access required" });
            return;
        }
        if (isManager && !req.user?.storeId) {
            res.status(403).json({ error: 'Store manager is not linked to a store' });
            return;
        }
        const { id } = req.params;
        try {
            await deleteVendorProduct(sql, Number(id), isSuperAdmin ? null : (req.user?.storeId ?? null));
            res.json({ success: true });
        } catch (err: any) {
            sendSafeError(res, err, 'Failed to delete product');
        }
    });

    // ─── Vite Middleware ───────────────────────────────────────────────────────
    if (process.env.NODE_ENV !== "production" && !skipVite) {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        app.use(express.static(path.join(__dirname, "dist")));
        app.get("*", (_req, res) => {
            res.sendFile(path.join(__dirname, "dist", "index.html"));
        });
    }

    return app;
}

export async function startServer() {
    const app = await createApp();
    const parsedPort = Number.parseInt(String(process.env.PORT ?? '3000').trim(), 10);
    const port = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 3000;

    app.listen(port, "0.0.0.0", () => {
        const isDatabaseConnected = Boolean(app.locals.isDatabaseConnected);
        if (!isDatabaseConnected) {
            console.error('Server started in maintenance mode: database offline.');
        }
    });
}

const isDirectExecution = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false;

if (isDirectExecution) {
    startServer();
}
