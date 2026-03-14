# VapesHub Deployment Guide

This document provides instructions for deploying the VapesHub platform to production environments like Vercel or Cloudflare Pages.

## 🚀 Environment Configuration

VapesHub requires the following environment variables to be set in your production host:

| Variable | Description | Example |
|---|---|---|
| `GEMINI_API_KEY` | Your Google Gemini AI API key for the Intelligence Center. | `AIzaSy...` |
| `NODE_ENV` | Environment mode. Set to `production`. | `production` |
| `VITE_API_URL` (optional) | The base URL for API calls if hosted on a different domain. | `https://api.vapeshub.com` |

## 📦 Build & Deploy

### Vercel (Recommended)

VapesHub is optimized for Vercel's zero-config deployment.

1.  Connect your GitHub repository to Vercel.
2.  Set the **Environment Variables** listed above.
3.  Vercel will automatically detect the Vite project and use the following settings:
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
    *   **Install Command**: `npm install`

### Cloudflare Pages

1.  Create a new project in Cloudflare Pages.
2.  Connect your repository.
3.  Configure Build Settings:
    *   **Framework preset**: `Vite`
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
4.  Add the `GEMINI_API_KEY` in the **Environment variables** section of the project settings.

## 🛠️ Performance & Maintenance

### 1. Database Persistence
By default, the project uses `better-sqlite3` with a local file. For serverless environments like Vercel (which have ephemeral filesystems), you should:
*   Use a managed SQLite service like **Turso** or **Neon**.
*   Update `db/index.ts` to connect to your remote database URI.

### 2. Service Worker & PWA
The PWA service worker (`public/sw.js`) is automatically registered in production. ensure you are serving over **HTTPS** for the service worker to activate correctly.

### 3. Image Optimization
Ensure all images in `public/images/` are optimized. The current build process does not minify images automatically.

## 🔒 Security Checklist
*   [ ] Ensure `GEMINI_API_KEY` is never exposed in the client-side bundle (Vites sub-folder).
*   [ ] Verify `authMiddleware` is active on all `/api/vendor/*` and `/api/admin/*` routes.
*   [ ] Use high-entropy salts for password hashing (handled by `bcryptjs` in `server/auth.ts`).
