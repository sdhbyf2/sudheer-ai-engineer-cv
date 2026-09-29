import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Parse .env.local for Redis credentials (same as export_storage_records.mjs)
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}


const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error("❌  UPSTASH_REDIS_REST_URL / TOKEN not set in .env.local");
  process.exit(1);
}

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

async function main() {
  console.log("🔍  Fetching visitor index from Redis…");

  // Get all SIDs from the index list
  const sids = await redis(["LRANGE", "steve:visitor:index", "0", "-1"]);
  const unique = [...new Set(sids || [])];
  console.log(`   Found ${unique.length} session IDs`);

  const records = [];
  for (const sid of unique) {
    try {
      const raw = await redis(["GET", `steve:visitor:${sid}`]);
      if (!raw) continue;
      const v = typeof raw === "string" ? JSON.parse(raw) : raw;
      records.push({ sid: sid.slice(0, 20) + "…", ...v });
    } catch {
      // skip bad entries
    }
  }

  // Sort newest first
  records.sort(
    (a, b) => new Date(b.firstSeen || 0) - new Date(a.firstSeen || 0),
  );

  const now = new Date().toISOString();
  const lines = [
    `# Steve Visitor Telemetry`,
    `> Exported: ${now}  |  Total sessions: ${records.length}`,
    "",
    "---",
    "",
  ];

  for (const v of records) {
    const durationMs =
      v.lastSeen && v.firstSeen
        ? new Date(v.lastSeen) - new Date(v.firstSeen)
        : 0;
    const duration =
      durationMs > 0
        ? durationMs < 60000
          ? `${Math.round(durationMs / 1000)}s`
          : `${Math.round(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`
        : "< 1s";

    lines.push(
      `## Session: \`${v.sid}\``,
      "",
      `| Field        | Value |`,
      `|---|---|`,
      `| First Seen   | ${v.firstSeen || "—"} |`,
      `| Last Seen    | ${v.lastSeen || "—"} |`,
      `| Duration     | ${duration} |`,
      `| Turns        | ${v.turnCount ?? 0} |`,
      `| IP Address   | \`${v.ip || "—"}\` |`,
      `| Country      | ${v.country || "—"} |`,
      `| Region       | ${v.region || "—"} |`,
      `| City         | ${v.city || "—"} |`,
      `| Organisation | ${v.org || "—"} |`,
      `| Referrer     | ${v.ref || "—"} |`,
      `| User Agent   | ${v.ua ? v.ua.slice(0, 120) : "—"} |`,
      "",
    );
  }

  if (records.length === 0) {
    lines.push("_No visitor records found yet. Tracking activates on next session._");
  }

  const outDir = path.join(ROOT, "local_storage_records");
  await fsp.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "visitors.md");
  await fsp.writeFile(outFile, lines.join("\n"), "utf8");
  console.log(`✅  Saved ${records.length} visitor records → ${outFile}`);}

main().catch((err) => {
  console.error("❌ ", err.message);
  process.exit(1);
});
