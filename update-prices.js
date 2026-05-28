import getDb from './db/index.js';

const db = getDb();

// Update Geek Bar Pulse X to $24.90
db.prepare('UPDATE products SET price = 24.90 WHERE brand = "Geek Bar Pulse X"').run();

// Update Fogger Pods to $19.90
db.prepare('UPDATE products SET price = 19.90 WHERE brand = "Fogger Pods"').run();

// Update Fogger Kit to $23.99
db.prepare('UPDATE products SET price = 23.99 WHERE brand = "Fogger Kit"').run();

// Update Float/Flum Mellow to $22.99
db.prepare('UPDATE products SET price = 22.99 WHERE brand = "Float/Flum Mellow"').run();

// Update UT Bar to $19.19
db.prepare('UPDATE products SET price = 19.19 WHERE brand = "UT Bar"').run();

// Update Numbz with mg-tiered pricing
db.prepare('UPDATE products SET price = 59.99 WHERE brand = "Numbz" AND nicotine = "300mg"').run();
db.prepare('UPDATE products SET price = 79.99 WHERE brand = "Numbz" AND nicotine = "500mg"').run();

// Update ZYN Nicotine Pouches with strength-tiered pricing
db.prepare('UPDATE products SET price = 8.99 WHERE brand = "ZYN" AND nicotine = "3mg"').run();
db.prepare('UPDATE products SET price = 14.99 WHERE brand = "ZYN" AND nicotine = "6mg"').run();

console.log('All product prices updated to current Banana Leaf pricing!');