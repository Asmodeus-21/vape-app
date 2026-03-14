const Database = require('better-sqlite3');
const db = new Database('d:/vape-app/vapeshub.db');
const users = db.prepare('SELECT id, email, name, role FROM users').all();
console.log(JSON.stringify(users, null, 2));
db.close();
