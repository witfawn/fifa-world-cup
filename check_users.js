const { createClient } = require("@libsql/client");
const fs = require("fs");
const raw = fs.readFileSync(".env.local", "utf8");
const url = raw.split('TURSO_DATABASE_URL="')[1].split('"')[0];
const token = raw.split('TURSO_AUTH_TOKEN="')[1].split('"')[0];
const client = createClient({ url, authToken: token });

(async () => {
  const all = await client.execute("SELECT id, email, name FROM users ORDER BY rowid");
  console.log("Total users: " + all.rows.length);
  for (const r of all.rows) console.log("  " + r.name + " (" + r.email + ")");
  
  const d1 = await client.execute({ sql: "SELECT * FROM users WHERE email = ?", args: ["john.pontefract@gmail.com"] });
  const d2 = await client.execute({ sql: "SELECT * FROM users WHERE email = ?", args: ["joshuaking@gmail.com"] });
  console.log("john.pontefract@gmail.com found: " + d1.rows.length);
  console.log("joshuaking@gmail.com found: " + d2.rows.length);
})();
