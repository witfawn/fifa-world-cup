import { NextResponse } from "next/server";
import https from "https";

export const dynamic = "force-dynamic";

/**
 * GET /api/results — return all match results
 * Uses Node.js https module directly to bypass Vercel's fetch caching layer
 */
export async function GET() {
  const dbUrl = (process.env.TURSO_DATABASE_URL || "").replace("libsql://", "https://");
  const authToken = process.env.TURSO_AUTH_TOKEN!;

  const body = JSON.stringify({
    requests: [
      {
        type: "execute",
        stmt: { sql: "SELECT * FROM match_results" },
      },
    ],
  });

  const result = await new Promise<any>((resolve, reject) => {
    const url = new URL(`${dbUrl}/v2/pipeline`);
    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Parse error: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });

  const rows = result.results?.[0]?.response?.result?.rows || [];

  const results = rows.map((row: { type: string; value: string }[]) => ({
    id: row[0]?.value,
    matchId: Number(row[1]?.value),
    homeScore: Number(row[2]?.value),
    awayScore: Number(row[3]?.value),
    isLocked: Number(row[4]?.value) === 1,
    createdAt: Number(row[5]?.value),
    updatedAt: Number(row[6]?.value),
  }));

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
