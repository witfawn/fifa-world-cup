import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _client: ReturnType<typeof import("@libsql/client").createClient> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error(
        "TURSO_DATABASE_URL is not set. Set it in your environment variables."
      );
    }
    // Dynamic import to avoid build-time DB initialization
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client") as typeof import("@libsql/client");
    const client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    _client = client;
    _db = drizzle(client, { schema });
  }
  return _db;
}

export function getClient() {
  if (!_client) {
    getDb();
  }
  return _client!;
}
