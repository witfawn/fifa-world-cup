const { createClient } = require("@libsql/client");
const fs = require("fs");
const raw = fs.readFileSync(".env.local", "utf8");
const url = raw.match(/TURSO_DATABASE_URL="([^"]+)"/)[1];
const token = raw.match(/TURSO_AUTH_TOKEN="([^"]+)"/)[1];
const client = createClient({ url, authToken: token });

(async () => {
  const count = await client.execute("SELECT COUNT(*) as cnt FROM users");
  console.log("User count:", count.rows[0].cnt);

  const check = await client.execute(
    "SELECT id, email, name FROM users WHERE email LIKE '%pontefract%' OR email LIKE '%joshuaking%'"
  );
  console.log("Deleted emails found:", check.rows.length);
  for (const r of check.rows) console.log("  FOUND:", r.id, r.email, r.name);

  const allEmails = await client.execute("SELECT email, name FROM users ORDER BY rowid");
  for (const r of allEmails.rows) console.log(" ", r.email, "-", r.name);
})();
