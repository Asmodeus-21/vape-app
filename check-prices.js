import getDb from './db/index.js';

const db = getDb();

// Check current prices by brand
const brands = ['Geek Bar Pulse X', 'Fogger Pods', 'Fogger Kit', 'Float/Flum Mellow', 'UT Bar', 'Numbz'];

brands.forEach(brand => {
    const products = db.prepare('SELECT name, price FROM products WHERE brand = ? LIMIT 2').all(brand);
    console.log(`\n${brand}:`);
    products.forEach(product => {
        console.log(`  ${product.name}: $${product.price}`);
    });
});