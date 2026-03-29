#!/usr/bin/env node

/**
 * Sitemap Generator for VapesHub
 * Generates XML sitemap for SEO and QA testing
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://vapeshub.vercel.app';
const BUILD_DIR = path.join(__dirname, 'dist');

// Static routes that should be included in sitemap
const STATIC_ROUTES = [
    '/',
    '/legal',
    '/profile',
    '/vendor',
    '/admin'
];

// Dynamic routes that need to be generated
const DYNAMIC_ROUTES = [
    // Product pages will be added when we have product data
    // '/product/1', '/product/2', etc.
];

function generateSitemap() {
    const routes = [...STATIC_ROUTES, ...DYNAMIC_ROUTES];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${routes.map(route => `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}

</urlset>`;

    // Ensure dist directory exists
    if (!fs.existsSync(BUILD_DIR)) {
        fs.mkdirSync(BUILD_DIR, { recursive: true });
    }

    // Write sitemap to dist directory
    fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), sitemap);
    console.log('✅ Sitemap generated successfully at dist/sitemap.xml');

    // Also generate a simple HTML sitemap for QA testing
    const htmlSitemap = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VapesHub - Site Map</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2563eb; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .route { font-family: monospace; background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>VapesHub Site Map</h1>
    <p>This is an automatically generated site map for QA testing and SEO purposes.</p>
    <ul>
${routes.map(route => `        <li><a href="${BASE_URL}${route}" target="_blank"><span class="route">${route}</span></a></li>`).join('\n')}
    </ul>
    <p><em>Generated on ${new Date().toLocaleString()}</em></p>
</body>
</html>`;

    fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.html'), htmlSitemap);
    console.log('✅ HTML sitemap generated successfully at dist/sitemap.html');
}

if (require.main === module) {
    generateSitemap();
}

module.exports = { generateSitemap };