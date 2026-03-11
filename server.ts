import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Mock Database / API Routes ---
  
  // Products API
  app.get("/api/products", (req, res) => {
    res.json([
      { 
        id: 1, 
        name: "VaporMax Elite Pro Mod - Carbon Fiber Edition", 
        brand: "TitanVape", 
        flavor: "N/A (Hardware)", 
        nicotine: "N/A", 
        price: 149.99, 
        rating: 4.9,
        reviews: 2450,
        image: "https://picsum.photos/seed/vape-mod-1/600/600", 
        category: "Mods",
        isExpressDelivery: true,
        isBestSeller: true,
        description: "The ultimate power for professional vapers. Featuring a dual-21700 battery configuration and the advanced Titan-X chipset."
      },
      { 
        id: 2, 
        name: "Lush Ice Premium Disposable (8000 Puffs) - Smart Display", 
        brand: "CloudBar", 
        flavor: "Watermelon Menthol", 
        nicotine: "5%", 
        price: 24.50, 
        rating: 4.6,
        reviews: 5102,
        image: "https://picsum.photos/seed/vape-disp-1/600/600", 
        category: "Disposables",
        isExpressDelivery: true,
        isBestSeller: true,
        description: "The longest lasting disposable with a built-in LED screen for e-liquid and battery monitoring."
      },
      { 
        id: 3, 
        name: "Artisan Reserve E-Liquid - Midnight Oak (60ml)", 
        brand: "Heritage Juices", 
        flavor: "Toasted Tobacco & Vanilla Bean", 
        nicotine: "3mg, 6mg, 12mg", 
        price: 29.99, 
        rating: 4.9,
        reviews: 1240,
        image: "https://picsum.photos/seed/vape-juice-1/600/600", 
        category: "E-Liquids",
        isExpressDelivery: true,
        isNewArrival: true,
        description: "Small-batch e-liquid aged in oak barrels for a sophisticated, smooth tobacco experience."
      },
      { 
        id: 4, 
        name: "Zenith Pod System V2 - Ultra Compact", 
        brand: "Zenith", 
        flavor: "N/A (Hardware)", 
        nicotine: "N/A", 
        price: 49.00, 
        rating: 4.8,
        reviews: 3100,
        image: "https://picsum.photos/seed/vape-pod-1/600/600", 
        category: "Pod Systems",
        isExpressDelivery: true,
        isNewArrival: true,
        description: "Sleek, pocket-friendly, and powerful. The V2 features improved leak resistance and faster charging."
      },
      { 
        id: 5, 
        name: "Ceramic Coil Replacement Pack (5pcs) - Mesh Tech", 
        brand: "VaporMax", 
        flavor: "N/A", 
        nicotine: "N/A", 
        price: 18.99, 
        rating: 4.7,
        reviews: 890,
        image: "https://picsum.photos/seed/vape-coil-1/600/600", 
        category: "Accessories",
        isExpressDelivery: true,
        description: "High-performance mesh coils designed for maximum flavor clarity and longevity."
      },
      { 
        id: 6, 
        name: "Strawberry Dream Salt Nic - Premium Series", 
        brand: "SweetCloud", 
        flavor: "Strawberry Cream & Custard", 
        nicotine: "25mg, 50mg", 
        price: 22.99, 
        rating: 4.5,
        reviews: 1820,
        image: "https://picsum.photos/seed/vape-salt-1/600/600", 
        category: "Nic Salts",
        isExpressDelivery: true,
        description: "A smooth, creamy strawberry experience perfectly balanced for high-nicotine pod systems."
      },
      { 
        id: 7, 
        name: "Arctic Breeze Menthol - Sub-Ohm Edition", 
        brand: "FrostBite", 
        flavor: "Pure Menthol & Peppermint", 
        nicotine: "0mg, 3mg, 6mg", 
        price: 19.50, 
        rating: 4.7,
        reviews: 945,
        image: "https://picsum.photos/seed/vape-menthol/600/600", 
        category: "E-Liquids",
        isExpressDelivery: true,
        description: "The cleanest, coldest menthol on the market. Perfect for cloud chasing."
      },
      { 
        id: 8, 
        name: "Titanium Drip Tip - Heat Resistant", 
        brand: "CustomVape", 
        flavor: "N/A", 
        nicotine: "N/A", 
        price: 12.00, 
        rating: 4.9,
        reviews: 320,
        image: "https://picsum.photos/seed/vape-tip/600/600", 
        category: "Accessories",
        isExpressDelivery: false,
        description: "Grade 5 titanium drip tip for superior heat dissipation and style."
      }
    ]);
  });

  // AI Agent Endpoint (Mock for now, will integrate Gemini in frontend)
  app.post("/api/ai/analyze", (req, res) => {
    const { type, data } = req.body;
    res.json({ message: `VAPEOS AI ${type} analysis complete.`, recommendation: "Increase stock of Strawberry flavors in Ukiah area." });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VapesHub Server running on http://localhost:${PORT}`);
  });
}

startServer();
