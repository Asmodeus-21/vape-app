import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import 'dotenv/config';
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import getDb from "./db/index.js";
import { seed } from "./db/seed.js";
import { authMiddleware, loginUser, registerUser, verifyToken, type AuthPayload } from "./server/auth.js";

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

function isStoreManagerRole(role?: string): boolean {
    return role === 'vendor' || role === 'store_manager';
}

function isSuperAdminRole(role?: string): boolean {
    return role === 'admin' || role === 'super_admin';
}

async function startServer() {
    if (process.env.NODE_ENV === "production") {
        if (!process.env.JWT_SECRET?.trim()) {
            throw new Error("JWT_SECRET is required in production.");
        }
        if (!process.env.CORS_ORIGIN?.trim()) {
            throw new Error("CORS_ORIGIN is required in production.");
        }
    }

    // ─── Init DB ───────────────────────────────────────────────────────────────
    const db = getDb();
    seed();

    const app = express();
    const PORT = Number(process.env.PORT || 3000);

    app.use(express.json());

    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === "production"
            ? undefined
            : false,
    }));
    app.use(cors({
        origin: corsOrigin || false,
        credentials: Boolean(corsOrigin),
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
    app.use("/api", apiLimiter);

    // ─── PRODUCTS API ─────────────────────────────────────────────────────────
    app.get("/api/products", (req, res) => {
        const { search = "", filter = "all", category = "" } = req.query as Record<string, string>;

        let sql = "SELECT * FROM products WHERE 1=1";
        const params: (string | number)[] = [];

        if (search) {
            sql += " AND (name LIKE ? OR brand LIKE ? OR flavor LIKE ?)";
            const like = `%${search}%`;
            params.push(like, like, like);
        }

        if (category) {
            sql += " AND category = ?";
            params.push(category);
        }

        if (filter === "bestsellers") {
            sql += " AND is_bestseller = 1";
        } else if (filter === "newarrivals") {
            sql += " AND is_new_arrival = 1";
        } else if (filter === "express") {
            sql += " AND is_express_delivery = 1";
        }

        sql += " ORDER BY is_bestseller DESC, rating DESC, reviews DESC";

        const rows = db.prepare(sql).all(...params) as any[];
        // Map DB snake_case to frontend camelCase
        const products = rows.map(r => ({
            id: r.id,
            name: r.name,
            brand: r.brand,
            flavor: r.flavor,
            nicotine: r.nicotine,
            price: r.price,
            rating: r.rating,
            reviews: r.reviews,
            image: r.image,
            category: r.category,
            description: r.description,
            stockQty: r.stock_qty,
            isExpressDelivery: r.is_express_delivery === 1,
            isBestSeller: r.is_bestseller === 1,
            isNewArrival: r.is_new_arrival === 1,
        }));

        res.json(products);
    });

    app.get("/api/products/:id", (req, res) => {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id) as any;
        if (!product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }
        res.json({
            id: product.id,
            name: product.name,
            brand: product.brand,
            flavor: product.flavor,
            nicotine: product.nicotine,
            price: product.price,
            rating: product.rating,
            reviews: product.reviews,
            image: product.image,
            category: product.category,
            description: product.description,
            stockQty: product.stock_qty,
            isExpressDelivery: product.is_express_delivery === 1,
            isBestSeller: product.is_bestseller === 1,
            isNewArrival: product.is_new_arrival === 1,
        });
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

    app.get("/api/auth/me", (req, res) => {
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
        const user = db.prepare("SELECT id, email, name, role, store_id, age_verified, verification_status FROM users WHERE id = ?").get(payload.userId) as any;
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
    app.post("/api/orders/checkout", authMiddleware, (req, res) => {
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
            const processCheckout = db.transaction((cartItems: any[]) => {
                let total = 0;
                const processedItems: any[] = [];
                let orderStoreId: number | null = null;

                for (const item of cartItems) {
                    const product = db.prepare("SELECT id, price, stock_qty, store_id FROM products WHERE id = ?").get(item.productId) as any;
                    if (!product) throw new Error(`Product ${item.productId} not found`);
                    if (product.stock_qty < item.quantity) throw new Error(`Insufficient stock for product ${item.productId}`);
                    if (!product.store_id) throw new Error(`Product ${item.productId} is not linked to a store`);

                    if (orderStoreId === null) {
                        orderStoreId = product.store_id;
                    } else if (orderStoreId !== product.store_id) {
                        throw new Error('Checkout across multiple stores is not supported in one order');
                    }

                    db.prepare("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?").run(item.quantity, item.productId);

                    total += product.price * item.quantity;
                    processedItems.push({ productId: product.id, quantity: item.quantity, price: product.price });
                }

                if (!orderStoreId) throw new Error('Order store could not be determined');

                const insertOrderResult = db
                    .prepare("INSERT INTO orders (user_id, store_id, status, total_amount, shipping_address) VALUES (?, ?, 'processing', ?, ?)")
                    .run(userId, orderStoreId, total, normalizedShippingAddress);
                const newOrderId = insertOrderResult.lastInsertRowid as number;

                const insertItemStmt = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)");
                for (const pi of processedItems) {
                    insertItemStmt.run(newOrderId, pi.productId, pi.quantity, pi.price);
                }

                return newOrderId;
            });

            const orderId = processCheckout(items);
            res.status(201).json({ success: true, orderId });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    });

    // ─── AI PROXY (keeps API key server-side) ─────────────────────────────────
    app.post("/api/ai/chat", authMiddleware, aiLimiter, async (req, res) => {
        const { prompt, systemInstruction } = req.body;
        if (!prompt || !systemInstruction) {
            res.status(400).json({ error: "prompt and systemInstruction are required." });
            return;
        }
        const text = await callGemini(prompt, systemInstruction);
        res.json({ text });
    });

    // ─── ADMIN ROUTES (restricted) ───────────────────────────────────────────
    app.get("/api/admin/stats", authMiddleware, (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        const db = getDb();
        try {
            const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
            const totalVendors = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'vendor'").get() as any;
            const totalSales = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status != 'cancelled'").get() as any;
            const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
            const pendingVerifications = db.prepare("SELECT COUNT(*) as count FROM users WHERE verification_status = 'pending'").get() as any;

            res.json({
                totalUsers: totalUsers.count,
                totalVendors: totalVendors.count,
                totalSales: totalSales.total || 0,
                totalProducts: totalProducts.count,
                pendingVerifications: pendingVerifications.count
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get("/api/admin/users", authMiddleware, (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        const db = getDb();
        const users = db.prepare("SELECT id, email, name, role, store_id, verification_status, created_at FROM users ORDER BY created_at DESC").all();
        res.json(users.map((user: any) => ({
            ...user,
            role: user.role === 'vendor' && user.store_id ? 'store_manager' : user.role,
            storeId: user.store_id ?? null,
        })));
    });

    app.patch("/api/admin/users/:id/verify", authMiddleware, (req, res) => {
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
            db.prepare("UPDATE users SET verification_status = ? WHERE id = ?").run(status, id);
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    app.patch("/api/admin/users/:id/role", authMiddleware, (req, res) => {
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
            if (normalizedRole === 'vendor') {
                const user = db.prepare('SELECT store_id FROM users WHERE id = ?').get(id) as { store_id?: number | null } | undefined;
                if (!user) {
                    res.status(404).json({ error: 'User not found' });
                    return;
                }
                if (!user.store_id) {
                    res.status(400).json({ error: 'Cannot promote to store_manager without assigning a store.' });
                    return;
                }
            }

            db.prepare("UPDATE users SET role = ? WHERE id = ?").run(normalizedRole, id);
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get("/api/admin/products", authMiddleware, (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        const db = getDb();
        const storeIdQuery = typeof req.query.storeId === 'string' ? Number(req.query.storeId) : null;
        if (storeIdQuery !== null && (!Number.isInteger(storeIdQuery) || storeIdQuery <= 0)) {
            res.status(400).json({ error: 'Invalid storeId query parameter' });
            return;
        }

        if (storeIdQuery !== null) {
            const store = db.prepare('SELECT id FROM stores WHERE id = ?').get(storeIdQuery);
            if (!store) {
                res.status(404).json({ error: 'Store not found' });
                return;
            }
        }

        const products = db.prepare(
            `SELECT * FROM products ${storeIdQuery !== null ? 'WHERE store_id = ?' : ''} ORDER BY created_at DESC`
        ).all(...(storeIdQuery !== null ? [storeIdQuery] : []));
        res.json(products.map((p: any) => ({
            ...p,
            stockQty: p.stock_qty,
            storeId: p.store_id ?? null,
            isExpressDelivery: p.is_express_delivery === 1
        })));
    });

    app.get("/api/admin/orders", authMiddleware, (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        const db = getDb();
        const storeIdQuery = typeof req.query.storeId === 'string' ? Number(req.query.storeId) : null;
        if (storeIdQuery !== null && (!Number.isInteger(storeIdQuery) || storeIdQuery <= 0)) {
            res.status(400).json({ error: 'Invalid storeId query parameter' });
            return;
        }

        if (storeIdQuery !== null) {
            const store = db.prepare('SELECT id FROM stores WHERE id = ?').get(storeIdQuery);
            if (!store) {
                res.status(404).json({ error: 'Store not found' });
                return;
            }
        }

        const orders = db.prepare(`
      SELECT o.*, u.name as customer_name 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ${storeIdQuery !== null ? 'WHERE o.store_id = ?' : ''}
      ORDER BY o.created_at DESC
    `).all(...(storeIdQuery !== null ? [storeIdQuery] : []));
        res.json(orders.map((order: any) => ({
            ...order,
            storeId: order.store_id ?? null,
        })));
    });

    app.get('/api/admin/stores', authMiddleware, (req, res) => {
        if (!isSuperAdminRole(req.user?.role)) {
            res.status(403).json({ error: 'Super admin access required' });
            return;
        }

        try {
            const stores = db.prepare(`
              SELECT
                s.id,
                s.name,
                s.address,
                s.owner_id,
                u.name AS owner_name,
                u.email AS owner_email,
                COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_sales,
                COUNT(DISTINCT o.id) AS total_orders
              FROM stores s
              LEFT JOIN users u ON u.id = s.owner_id
              LEFT JOIN orders o ON o.store_id = s.id
              GROUP BY s.id, s.name, s.address, s.owner_id, u.name, u.email
              ORDER BY s.created_at DESC
            `).all();

            res.json(stores);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // ─── VENDOR ROUTES (protected) ────────────────────────────────────────────
    app.get("/api/vendor/stats", authMiddleware, (req, res) => {
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
        const db = getDb();

        try {
            const scopedArg = isSuperAdmin ? [] : [storeId];

            // 1. Today's Sales (Total amount for orders created today)
            const todaySales = db.prepare(`
        SELECT SUM(total_amount) as total 
        FROM orders 
                WHERE date(created_at) = date('now') AND status != 'cancelled' ${isSuperAdmin ? '' : 'AND store_id = ?'}
            `).get(...scopedArg) as any;

            // 2. Open Orders (Pending or Processing)
            const openOrders = db.prepare(`
        SELECT COUNT(*) as count 
        FROM orders 
                WHERE status IN ('pending', 'processing') ${isSuperAdmin ? '' : 'AND store_id = ?'}
            `).get(...scopedArg) as any;

            // 3. Low Stock Items (Products with < 10 items)
            const lowStock = db.prepare(`
        SELECT COUNT(*) as count 
        FROM products 
                WHERE stock_qty < 10 ${isSuperAdmin ? '' : 'AND store_id = ?'}
            `).get(...scopedArg) as any;

            // 4. Lifetime Earnings (Total for all non-cancelled orders)
            const earnings = db.prepare(`
        SELECT SUM(total_amount) as total 
        FROM orders 
                WHERE status != 'cancelled' ${isSuperAdmin ? '' : 'AND store_id = ?'}
            `).get(...scopedArg) as any;

            // 5. Customer Satisfaction (Average Rating of vendor's products)
            const rating = db.prepare(`
        SELECT AVG(rating) as avg 
        FROM products 
                WHERE 1=1 ${isSuperAdmin ? '' : 'AND store_id = ?'}
            `).get(...scopedArg) as any;

            res.json({
                todaySales: todaySales?.total || 0,
                openOrders: openOrders?.count || 0,
                lowStockItems: lowStock?.count || 0,
                totalEarnings: earnings?.total || 0,
                avgRating: parseFloat(rating?.avg?.toFixed(1)) || 4.5,
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get("/api/vendor/orders", authMiddleware, (req, res) => {
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

        const orders = db.prepare(`
            SELECT o.id, o.status, o.total_amount, o.created_at, o.store_id, u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
            ${isSuperAdmin ? '' : 'WHERE o.store_id = ?'}
      ORDER BY o.created_at DESC
      LIMIT 50
        `).all(...(isSuperAdmin ? [] : [storeId]));
        res.json(orders);
    });

    app.patch("/api/vendor/orders/:id/status", authMiddleware, (req, res) => {
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
            if (isSuperAdmin) {
                db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
            } else {
                db.prepare("UPDATE orders SET status = ? WHERE id = ? AND store_id = ?").run(status, id, req.user?.storeId ?? null);
            }
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get("/api/vendor/products", authMiddleware, (req, res) => {
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

        const db = getDb();
        const vendorProducts = db
            .prepare(`SELECT * FROM products ${isSuperAdmin ? '' : 'WHERE store_id = ?'}`)
            .all(...(isSuperAdmin ? [] : [storeId]));

        // Convert to camelCase
        res.json(vendorProducts.map((p: any) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            flavor: p.flavor,
            nicotine: p.nicotine,
            price: p.price,
            rating: p.rating,
            reviews: p.reviews,
            image: p.image,
            category: p.category,
            description: p.description,
            stockQty: p.stock_qty,
            isExpressDelivery: p.is_express_delivery === 1,
            isBestSeller: p.is_bestseller === 1,
            isNewArrival: p.is_new_arrival === 1,
            vendorId: p.vendor_id,
            storeId: p.store_id ?? null,
        })));
    });

    app.post("/api/vendor/products", authMiddleware, (req, res) => {
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
            const db = getDb();
            const store = db.prepare('SELECT id FROM stores WHERE id = ?').get(targetStoreId);
            if (!store) {
                res.status(400).json({ error: `Store ID ${targetStoreId} does not exist` });
                return;
            }
            const stmt = db.prepare(`
        INSERT INTO products (
                    name, brand, flavor, nicotine, price, image, category, description, stock_qty, vendor_id, store_id,
          rating, reviews, is_express_delivery, is_bestseller, is_new_arrival
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0)
      `);

            const result = stmt.run(
                name, brand || 'VapesHub Retailer', flavor || 'N/A', nicotine || 'N/A', price,
                image, category, description, stockQty || 100, req.user!.userId, targetStoreId
            );

            res.status(201).json({ success: true, productId: result.lastInsertRowid });
        } catch (err: any) {
            res.status(500).json({ error: err.message || "Failed to create product" });
        }
    });

    app.patch("/api/vendor/products/:id", authMiddleware, (req, res) => {
        const isManager = isStoreManagerRole(req.user?.role);
        const isSuperAdmin = isSuperAdminRole(req.user?.role);

        if (!isManager && !isSuperAdmin) {
            res.status(403).json({ error: "Vendor access required" });
            return;
        }
        const { name, brand, flavor, nicotine, price, category, description, stockQty } = req.body;
        const { id } = req.params;

        try {
            const scopeSql = isSuperAdmin ? '' : ' AND store_id = ?';
            const params = [
                name,
                brand,
                flavor,
                nicotine,
                price,
                category,
                description,
                stockQty,
                id,
            ];
            const scopedParams = isSuperAdmin ? params : [...params, req.user?.storeId ?? null];

            db.prepare(`
        UPDATE products SET 
          name = ?, brand = ?, flavor = ?, nicotine = ?, price = ?, 
          category = ?, description = ?, stock_qty = ?
        WHERE id = ?${scopeSql}
      `).run(...scopedParams);
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    app.delete("/api/vendor/products/:id", authMiddleware, (req, res) => {
        const isManager = isStoreManagerRole(req.user?.role);
        const isSuperAdmin = isSuperAdminRole(req.user?.role);

        if (!isManager && !isSuperAdmin) {
            res.status(403).json({ error: "Vendor access required" });
            return;
        }
        const { id } = req.params;
        try {
            if (isSuperAdmin) {
                db.prepare('DELETE FROM products WHERE id = ?').run(id);
            } else {
                db.prepare('DELETE FROM products WHERE id = ? AND store_id = ?').run(id, req.user?.storeId ?? null);
            }
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // ─── Vite Middleware ───────────────────────────────────────────────────────
    if (process.env.NODE_ENV !== "production") {
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

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`\n🚀 VapesHub Server running on http://localhost:${PORT}`);
        console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Key loaded' : '⚠️  No API key found'}`);
        console.log(`   Database: ✅ SQLite ready\n`);
    });
}

startServer();
