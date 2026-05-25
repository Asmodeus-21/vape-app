import fs from 'fs';
import { getPostgresClient } from './db/index.js';
import { seedProducts } from './db/seed.js';

async function main() {
    let products = [];
    try {
        const sql = getPostgresClient();
        products = await sql`SELECT * FROM products ORDER BY name ASC`;
        await sql.end({ timeout: 2 });
        console.log(`Fetched ${products.length} products from database.`);
    } catch (e) {
        console.log("DB fetch failed, using seed data instead.", (e as Error).message);
        products = seedProducts;
    }
    
    const rowHeight = 30;
    const width = 800;
    const headerHeight = 40;
    const height = headerHeight + products.length * rowHeight + 20;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <style>
            .header { font-weight: bold; font-family: sans-serif; font-size: 16px; fill: #333; }
            .row { font-family: sans-serif; font-size: 14px; fill: #666; }
            .bg { fill: #f9f9f9; }
            .alt-bg { fill: #ffffff; }
            .border { stroke: #e0e0e0; stroke-width: 1; }
        </style>
        <rect width="${width}" height="${height}" fill="#fff"/>
        <text x="20" y="25" class="header">Name</text>
        <text x="400" y="25" class="header">Brand</text>
        <text x="600" y="25" class="header">Price</text>
        <text x="700" y="25" class="header">Stock</text>
        <line x1="10" y1="35" x2="790" y2="35" class="border"/>
    `;
    
    products.forEach((p, i) => {
        const y = headerHeight + i * rowHeight;
        const bgClass = i % 2 === 0 ? 'bg' : 'alt-bg';
        const name = (p.name || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;');
        const brand = (p.brand || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;');
        const price = Number(p.price).toFixed(2);
        const stock = p.stock_qty ?? 0;
        
        svg += `<rect x="10" y="${y}" width="780" height="${rowHeight}" class="${bgClass}"/>`;
        svg += `<text x="20" y="${y + 20}" class="row">${name}</text>`;
        svg += `<text x="400" y="${y + 20}" class="row">${brand}</text>`;
        svg += `<text x="600" y="${y + 20}" class="row">$${price}</text>`;
        svg += `<text x="700" y="${y + 20}" class="row">${stock}</text>`;
    });
    
    svg += `</svg>`;
    
    fs.writeFileSync('inventory.svg', svg);
    console.log("Successfully wrote inventory.svg");
}

main().catch(console.error);
