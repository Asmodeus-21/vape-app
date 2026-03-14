const Database = require('better-sqlite3');
const db = new Database('d:/vape-app/vapeshub.db');
db.prepare("UPDATE users SET role = 'vendor' WHERE email LIKE 'retailer%'").run();
console.log("Updated retailer accounts to vendor role.");
const users = db.prepare('SELECT id, email, name, role FROM users').all();
console.log(JSON.stringify(users, null, 2));
db.close();
