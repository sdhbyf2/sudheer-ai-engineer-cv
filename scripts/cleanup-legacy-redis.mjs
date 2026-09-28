#!/usr/bin/env node
/**
 * Scoped Redis Cleanup & Privacy Migration Script
 *
 * Migrates legacy stored data to the new zero-PII storage format:
 * 1. Sanitizes legacy `steve:convo:*` lists to strip raw message content
 *    and enforce strict metadata allowlists (latencyMs, evidenceIds, fromCache).
 * 2. Purges legacy `steve:answer-cache:*` keys.
 * 3. Sanitizes `steve:leads:recent` index to ensure it contains only ID strings
 *    (stripping legacy JSON objects containing names and emails).
 * 4. Shortens retention on legacy lead records (`steve:lead:*`) exceeding 30 days
 *    without extending existing shorter TTLs.
 * 5. Returns exit code 1 if any step encounters an error.
 *
 * Usage:
 *   node scripts/cleanup-legacy-redis.mjs --dry-run
 *   node scripts/cleanup-legacy-redis.mjs --apply
 */

import { redis, configured, PROFILE, RECRUITER_LEAD_TTL } from "../server/assistant.js";

const isApply = process.argv.includes("--apply");
const isDryRun = !isApply;

console.log(`[redis-cleanup] Starting scoped privacy migration in ${isDryRun ? "DRY-RUN" : "APPLY"} mode...`);

if (!configured()) {
  console.log("[redis-cleanup] Redis (UPSTASH_REDIS_REST_URL/TOKEN) is not configured in this environment. Exiting.");
  process.exit(0);
}

const PROFILE_ID_SET = new Set((PROFILE || []).map((p) => p.id));
let errorsEncountered = 0;

async function scanKeys(pattern) {
  const matchingKeys = [];
  let cursor = "0";
  try {
    do {
      const res = await redis(["SCAN", cursor, "MATCH", pattern, "COUNT", "100"]);
      if (!res || !Array.isArray(res)) break;
      cursor = String(res[0]);
      const keys = res[1] || [];
      matchingKeys.push(...keys);
    } while (cursor !== "0");
  } catch (err) {
    errorsEncountered++;
    console.error(`[redis-cleanup] SCAN error for pattern ${pattern}:`, err?.message);
  }
  return [...new Set(matchingKeys)];
}

async function run() {
  const stats = {
    convoKeysExamined: 0,
    convoKeysSanitized: 0,
    rawMessagesPurged: 0,
    legacyCacheKeysFound: 0,
    legacyCacheKeysDeleted: 0,
    leadsIndexEntriesExamined: 0,
    leadsIndexEntriesSanitized: 0,
    leadKeysExamined: 0,
    leadKeysRetentionShortened: 0,
  };

  // 1. Sanitize steve:convo:* keys with strict metadata allowlist
  const convoKeys = await scanKeys("steve:convo:*");
  stats.convoKeysExamined = convoKeys.length;

  for (const key of convoKeys) {
    if (key === "steve:convo:recent" || key === "steve:convo:total" || key.startsWith("steve:convo:last:")) continue;
    try {
      const items = await redis(["LRANGE", key, "0", "-1"]);
      if (!Array.isArray(items) || items.length === 0) continue;

      let needsSanitization = false;
      const sanitizedEntries = items.map((raw) => {
        try {
          const entry = JSON.parse(raw);
          if (!entry || typeof entry !== "object") return raw;

          const hasRawContent = "content" in entry;
          const hasArbitraryMetadata = "metadata" in entry && typeof entry.metadata === "object" && entry.metadata !== null;

          if (hasRawContent || hasArbitraryMetadata) {
            needsSanitization = true;
            if (hasRawContent) stats.rawMessagesPurged++;

            const cleanLatency =
              typeof entry.metadata?.latencyMs === "number" &&
              Number.isFinite(entry.metadata.latencyMs) &&
              entry.metadata.latencyMs >= 0 &&
              entry.metadata.latencyMs <= 120000
                ? Math.round(entry.metadata.latencyMs)
                : typeof entry.latencyMs === "number" &&
                  Number.isFinite(entry.latencyMs) &&
                  entry.latencyMs >= 0 &&
                  entry.latencyMs <= 120000
                  ? Math.round(entry.latencyMs)
                  : undefined;

            const cleanEvidenceIds = Array.isArray(entry.metadata?.evidenceIds || entry.evidenceIds)
              ? (entry.metadata?.evidenceIds || entry.evidenceIds)
                  .filter((id) => typeof id === "string" && PROFILE_ID_SET.has(id))
                  .slice(0, 10)
              : [];

            const cleanFromCache = Boolean(entry.metadata?.fromCache ?? entry.fromCache);

            return JSON.stringify({
              at: entry.at || new Date().toISOString(),
              role: entry.role,
              mode: entry.mode || "chat",
              length: entry.length ?? (entry.content ? String(entry.content).length : 0),
              fromCache: cleanFromCache,
              latencyMs: cleanLatency,
              evidenceIds: cleanEvidenceIds,
            });
          }
          return raw;
        } catch {
          return raw;
        }
      });

      if (needsSanitization) {
        stats.convoKeysSanitized++;
        if (isApply) {
          await redis(["DEL", key]);
          for (const item of sanitizedEntries) {
            await redis(["RPUSH", key, item]);
          }
          await redis(["EXPIRE", key, "604800"]); // 7 days retention
        }
      }
    } catch (err) {
      errorsEncountered++;
      console.error(`[redis-cleanup] Error inspecting conversation key ${key}:`, err?.message);
    }
  }

  // 2. Purge legacy unsafe answer cache keys
  const cacheKeys = await scanKeys("steve:answer-cache:*");
  stats.legacyCacheKeysFound = cacheKeys.length;
  if (cacheKeys.length > 0 && isApply) {
    for (const key of cacheKeys) {
      try {
        await redis(["DEL", key]);
        stats.legacyCacheKeysDeleted++;
      } catch (err) {
        errorsEncountered++;
        console.error(`[redis-cleanup] Failed to delete cache key ${key}:`, err?.message);
      }
    }
  }

  // 3. Sanitize recent leads index (steve:leads:recent) to strip legacy JSON entries containing PII
  try {
    const rawLeads = await redis(["LRANGE", "steve:leads:recent", "0", "-1"]);
    if (Array.isArray(rawLeads) && rawLeads.length > 0) {
      stats.leadsIndexEntriesExamined = rawLeads.length;
      let hasLegacyPiiEntries = false;

      const sanitizedLeadIds = rawLeads.map((item) => {
        if (typeof item === "string" && item.trim().startsWith("{")) {
          hasLegacyPiiEntries = true;
          try {
            const parsed = JSON.parse(item);
            const sid = parsed.sid || "legacy";
            const leadId = parsed.id || parsed.leadId || "id";
            return `${sid}:${leadId}`;
          } catch {
            return "legacy:unknown";
          }
        }
        return item;
      });

      if (hasLegacyPiiEntries) {
        stats.leadsIndexEntriesSanitized = sanitizedLeadIds.length;
        if (isApply) {
          await redis(["DEL", "steve:leads:recent"]);
          for (const cleanId of sanitizedLeadIds.slice(0, 100)) {
            await redis(["RPUSH", "steve:leads:recent", cleanId]);
          }
        }
      }
    }

    if (isApply) {
      await redis(["EXPIRE", "steve:leads:recent", String(RECRUITER_LEAD_TTL)]);
    }
  } catch (err) {
    errorsEncountered++;
    console.error("[redis-cleanup] Error inspecting leads index:", err?.message);
  }

  // 4. Shorten retention on existing lead records without extending shorter TTLs
  const leadKeys = await scanKeys("steve:lead:*");
  for (const key of leadKeys) {
    if (key === "steve:leads:recent" || key === "steve:leads:total" || key.startsWith("steve:lead:req:")) continue;
    stats.leadKeysExamined++;
    try {
      const ttl = Number(await redis(["TTL", key]));
      // Shorten retention if key has no expiry (-1) or retention exceeds 30 days (2,592,000s)
      if (ttl === -1 || ttl > RECRUITER_LEAD_TTL) {
        stats.leadKeysRetentionShortened++;
        if (isApply) {
          await redis(["EXPIRE", key, String(RECRUITER_LEAD_TTL)]);
        }
      }
    } catch (err) {
      errorsEncountered++;
      console.error(`[redis-cleanup] Error checking TTL for lead key ${key}:`, err?.message);
    }
  }

  console.log(`[redis-cleanup] Migration Summary (${isApply ? "CHANGES APPLIED" : "DRY-RUN ONLY"}):`);
  console.log(`  - Conversation keys examined: ${stats.convoKeysExamined}`);
  console.log(`  - Conversation keys sanitized: ${stats.convoKeysSanitized}`);
  console.log(`  - Raw conversation messages purged: ${stats.rawMessagesPurged}`);
  console.log(`  - Legacy answer cache keys found: ${stats.legacyCacheKeysFound}`);
  if (isApply) {
    console.log(`  - Legacy answer cache keys deleted: ${stats.legacyCacheKeysDeleted}`);
  }
  console.log(`  - Leads index entries examined: ${stats.leadsIndexEntriesExamined}`);
  console.log(`  - Leads index entries sanitized: ${stats.leadsIndexEntriesSanitized}`);
  console.log(`  - Lead records examined: ${stats.leadKeysExamined}`);
  console.log(`  - Lead records retention shortened: ${stats.leadKeysRetentionShortened}`);

  if (errorsEncountered > 0) {
    console.error(`[redis-cleanup] Privacy migration finished with ${errorsEncountered} errors.`);
    process.exit(1);
  }

  console.log(`[redis-cleanup] Privacy migration completed successfully without exposing visitor PII.`);
}

run().catch((err) => {
  console.error("[redis-cleanup] Fatal error:", err?.message);
  process.exit(1);
});
