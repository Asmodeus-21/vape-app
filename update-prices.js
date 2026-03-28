import getDb from './db/index.js';

const db = getDb();

// Update Foger products to 13.99
db.prepare('UPDATE products SET price = 13.99 WHERE brand = "Foger"').run();

// Update Utbar products to 23.99
db.prepare('UPDATE products SET price = 23.99 WHERE brand = "Utbar"').run();

// Update Flum Mello products to 22.99
db.prepare('UPDATE products SET price = 22.99 WHERE brand = "Flum Mello"').run();

// Update Hydroxie products with tiered pricing
db.prepare('UPDATE products SET price = 14.99 WHERE brand = "Hydroxie 7oh" AND nicotine IN ("10-15mg", "5-15mg")').run();
db.prepare('UPDATE products SET price = 24.99 WHERE brand = "Hydroxie 7oh" AND nicotine IN ("10-30mg", "5-30mg")').run();
db.prepare('UPDATE products SET price = 39.99 WHERE brand = "Hydroxie 7oh" AND nicotine = "5-60mg"').run();

// Update Blues products with tiered pricing
db.prepare('UPDATE products SET price = 12 WHERE brand = "Blues" AND nicotine = "35mg"').run();
db.prepare('UPDATE products SET price = 18 WHERE brand = "Blues" AND nicotine = "55mg"').run();
db.prepare('UPDATE products SET price = 22 WHERE brand = "Blues" AND nicotine = "75mg"').run();
db.prepare('UPDATE products SET price = 25 WHERE brand = "Blues" AND nicotine IN ("100mg", "120mg")').run();

// Update Zyns products to 5.99
db.prepare('UPDATE products SET price = 5.99 WHERE brand = "Zyns"').run();

// Update Geekbar Pulse X to 24.90
db.prepare('UPDATE products SET price = 24.90 WHERE brand = "Geekbar Pulse X"').run();

console.log('All product prices updated to Juicy Fly pricing!');