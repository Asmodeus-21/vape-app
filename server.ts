import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import getDb from "./db/index.js";
import { seed } from "./db/seed.js";
import { registerUser, loginUser, authMiddleware, verifyToken, type AuthPayload } from "./server/auth.js";

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

async function startServer() {
  // ─── Init DB ───────────────────────────────────────────────────────────────
  const db = getDb();
  seed();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required." });
      return;
    }
    const result = await registerUser(email, password, name, role || "customer");
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
    const user = db.prepare("SELECT id, email, name, role, age_verified, verification_status FROM users WHERE id = ?").get(payload.userId) as any;
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  });
  // ─── ORDERS API ─────────────────────────────────────────────────────────
  app.post("/api/orders/checkout", authMiddleware, (req, res) => {
    const { items, shippingAddress } = req.body;
    if (!items || !items.length || !shippingAddress) {
      res.status(400).json({ error: "Invalid checkout data" });
      return;
    }
    const userId = req.user!.userId;

    try {
      const processCheckout = db.transaction((cartItems: any[]) => {
        let total = 0;
        const processedItems: any[] = [];
        
        for (const item of cartItems) {
          const product = db.prepare("SELECT id, price, stock_qty FROM products WHERE id = ?").get(item.productId) as any;
          if (!product) throw new Error(`Product ${item.productId} not found`);
          if (product.stock_qty < item.quantity) throw new Error(`Insufficient stock for product ${item.productId}`);
          
          db.prepare("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?").run(item.quantity, item.productId);
          
          total += product.price * item.quantity;
          processedItems.push({ productId: product.id, quantity: item.quantity, price: product.price });
        }
        
        const insertOrderResult = db.prepare("INSERT INTO orders (user_id, status, total_amount, shipping_address) VALUES (?, 'processing', ?, ?)").run(userId, total, shippingAddress);
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
  app.post("/api/ai/chat", async (req, res) => {
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
    if (req.user?.role !== 'admin') {
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
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    const db = getDb();
    const users = db.prepare("SELECT id, email, name, role, verification_status, created_at FROM users ORDER BY created_at DESC").all();
    res.json(users);
  });

  app.patch("/api/admin/users/:id/verify", authMiddleware, (req, res) => {
    if (req.user?.role !== 'admin') {
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
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    const { role } = req.body;
    const { id } = req.params;
    if (!['customer', 'vendor', 'admin'].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    try {
      db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/products", authMiddleware, (req, res) => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    const db = getDb();
    const products = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    res.json(products.map((p: any) => ({
      ...p,
      stockQty: p.stock_qty,
      isExpressDelivery: p.is_express_delivery === 1
    })));
  });

  app.get("/api/admin/orders", authMiddleware, (req, res) => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    const db = getDb();
    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `).all();
    res.json(orders);
  });

  // ─── VENDOR ROUTES (protected) ────────────────────────────────────────────
  app.get("/api/vendor/stats", authMiddleware, (req, res) => {
    if (req.user?.role !== 'vendor' && req.user?.role !== 'admin') {
      res.status(403).json({ error: "Vendor access required" });
      return;
    }
    const userId = req.user.userId;
    const db = getDb();

    try {
      // 1. Today's Sales (Total amount for orders created today)
      const todaySales = db.prepare(`
        SELECT SUM(total_amount) as total 
        FROM orders 
        WHERE date(created_at) = date('now') AND status != 'cancelled'
      `).get() as any;

      // 2. Open Orders (Pending or Processing)
      const openOrders = db.prepare(`
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE status IN ('pending', 'processing')
      `).get() as any;

      // 3. Low Stock Items (Products with < 10 items)
      const lowStock = db.prepare(`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE stock_qty < 10 AND (vendor_id = ? OR ?)
      `).get(userId, req.user.role === 'admin' ? 1 : 0) as any;

      // 4. Lifetime Earnings (Total for all non-cancelled orders)
      const earnings = db.prepare(`
        SELECT SUM(total_amount) as total 
        FROM orders 
        WHERE status != 'cancelled'
      `).get() as any;

      // 5. Customer Satisfaction (Average Rating of vendor's products)
      const rating = db.prepare(`
        SELECT AVG(rating) as avg 
        FROM products 
        WHERE (vendor_id = ? OR ?)
      `).get(userId, req.user.role === 'admin' ? 1 : 0) as any;

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
    if (req.user?.role !== 'vendor' && req.user?.role !== 'admin') {
      res.status(403).json({ error: "Vendor access required" });
      return;
    }
    const orders = db.prepare(`
      SELECT o.id, o.status, o.total_amount, o.created_at, u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `).all();
    res.json(orders);
  });

  app.patch("/api/vendor/orders/:id/status", authMiddleware, (req, res) => {
    if (req.user?.role !== 'vendor' && req.user?.role !== 'admin') {
      res.status(403).json({ error: "Vendor access required" });
      return;
    }
    const { status } = req.body;
    const { id } = req.params;
    
    if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    try {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/vendor/products", authMiddleware, (req, res) => {
    if (req.user?.role !== 'vendor' && req.user?.role !== 'admin') {
      res.status(403).json({ error: "Vendor access required" });
      return;
    }
    const db = getDb();
    const vendorProducts = db.prepare("SELECT * FROM products WHERE vendor_id = ?").all(req.user.userId);
    
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
      vendorId: p.vendor_id
    })));
  });

  app.post("/api/vendor/products", authMiddleware, (req, res) => {
    if (req.user?.role !== 'vendor' && req.user?.role !== 'admin') {
      res.status(403).json({ error: "Vendor access required" });
      return;
    }
    
    const { name, brand, flavor, nicotine, price, image, category, description, stockQty } = req.body;
    
    if (!name || !price || !image || !category || !description) {
      res.status(400).json({ error: "Missing required product fields" });
      return;
    }

    try {
      const db = getDb();
      const stmt = db.prepare(`
        INSERT INTO products (
          name, brand, flavor, nicotine, price, image, category, description, stock_qty, vendor_id,
          rating, reviews, is_express_delivery, is_bestseller, is_new_arrival
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0)
      `);
      
      const result = stmt.run(
        name, brand || 'VapesHub Retailer', flavor || 'N/A', nicotine || 'N/A', price, 
        image, category, description, stockQty || 100, req.user.userId
      );
      
      res.status(201).json({ success: true, productId: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create product" });
    }
  });

  app.patch("/api/vendor/products/:id", authMiddleware, (req, res) => {
    if (req.user?.role !== 'vendor' && req.user?.role !== 'admin') {
      res.status(403).json({ error: "Vendor access required" });
      return;
    }
    const { name, brand, flavor, nicotine, price, category, description, stockQty } = req.body;
    const { id } = req.params;

    try {
      db.prepare(`
        UPDATE products SET 
          name = ?, brand = ?, flavor = ?, nicotine = ?, price = ?, 
          category = ?, description = ?, stock_qty = ?
        WHERE id = ? AND (vendor_id = ? OR ?)
      `).run(name, brand, flavor, nicotine, price, category, description, stockQty, id, req.user.userId, req.user.role === 'admin' ? 1 : 0);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/vendor/products/:id", authMiddleware, (req, res) => {
    if (req.user?.role !== 'vendor' && req.user?.role !== 'admin') {
      res.status(403).json({ error: "Vendor access required" });
      return;
    }
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM products WHERE id = ? AND (vendor_id = ? OR ?)").run(id, req.user.userId, req.user.role === 'admin' ? 1 : 0);
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
