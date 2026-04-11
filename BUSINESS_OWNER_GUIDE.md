# 📦 VapesHub Business Owner Review Guide

Welcome to the finalized VapesHub platform. This guide provides everything you need to audit the application, verify its features, and proceed with the production launch on Vercel.

## 🔗 Project Assets
*   **GitHub Repository**: [Asmodeus-21/vape-app](https://github.com/Asmodeus-21/vape-app)
*   **Live Preview (Vercel)**: `https://vape-app-asmodeus.vercel.app` *(Note: Replace with your actual Vercel URL once the build finishes)*

---

## 🔑 Demo Access Credentials
Use these seeded credentials to test the three operational layers of the platform. They are recreated by the normal PostgreSQL seed on startup.

### 1. Consumer / Buyer Layer
*   **Email**: `customer@bananaleaf.com`
*   **Password**: `BananaLeafDemo!2026`
*   **Features to check**:
    *   Browse **Master Inventory** and **Peak Performance**.
    *   Use the **Flavor DNA Engine** (AI-powered recommendations).
    *   Add items to cart and complete the **Secure Protocol Checkout** (Simulation).

### 2. Retailer / Vendor OS
*   **Email**: `vendor@bananaleaf.com`
*   **Password**: `BananaLeafDemo!2026`
*   **Features to check**:
    *   **Intelligence Nexus**: View AI-driven business insights (Inventory Pulse, Sentiment Engine).
    *   **Inventory Ledger**: Add, edit, or remove your hardware/liquid listings.
    *   **Market Stream**: Track and fulfill incoming orders in real-time.

### 3. Platform Admin Layer
*   **Email**: `admin@bananaleaf.com`
*   **Password**: `BananaLeafDemo!2026`
*   **Features to check**:
    *   **Global Volume**: Monitor platform-wide sales and user counts.
    *   **Compliance Control**: Verify or reject pending vendor applications.
    *   **Supply Moderation**: Remove non-compliant products from the global marketplace.

---

## 🚀 How to Launch on Vercel (100% Logic)

To ensure the AI and Database features work in the live environment, follow these 3 steps:

### Step 1: Connect GitHub
1.  Log in to [Vercel](https://vercel.com).
2.  Click **"Add New Project"** and select the `vape-app` repository.

### Step 2: Environment Protocol (AI Integration)
Add this variable in the **Environment Variables** section:
*   **Key**: `GEMINI_API_KEY`
*   **Value**: `(Your Gemini Pro API Key)`

### Step 3: Database Initialization
The canonical app now uses PostgreSQL for runtime data and deterministic demo-user seeding.
*   **For production**: Provide a working PostgreSQL `DATABASE_URL` and `JWT_SECRET`.
*   **For local verification**: Copy `.env.local.example` to `.env.local`, start a local PostgreSQL server on port `54329`, and launch the app.

---

## 🧪 Feature Audit Checklist
- [ ] **PWA Support**: Open the site on mobile (iOS/Android) and check the "Add to Home Screen" prompt.
- [ ] **AI Assistant**: Click the floating emerald bubble and ask: "I like sweet fruits, what do you recommend?"
- [ ] **Real-time Stats**: Log in as a Vendor, add a product, and see the "Critical Assets" stock count update.
- [ ] **Offline Mode**: Turn off your Wi-Fi; notice the PWA still loads the core interface and cached data.

---
**Technical Support**: The codebase includes a `DEPLOYMENT.md` for your engineering team to handle deep-scale server migrations.
