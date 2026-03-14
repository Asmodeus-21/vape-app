/**
 * Utility script to promote a user to admin role.
 * Usage: node promote_admin.js <email>
 */
import getDb from "./db/index.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node promote_admin.js <email>");
  process.exit(1);
}

const db = getDb();

try {
  const user = db.prepare("SELECT id, name, role FROM users WHERE email = ?").get(email);
  
  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
  
  console.log(`\n✅ SUCCESS: User '${user.name}' (${email}) promoted to 'admin'.`);
  console.log(`\nNow log in as this user to access the Admin OS tab.\n`);

} catch (err) {
  console.error("Failed to promote user:", err);
  process.exit(1);
}
