// Safe configuration checks: never prints values or contacts a calendar to create events.
import { existsSync } from "node:fs";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const groups = {
  text: [
    "OPENAI_API_KEY",
    "STEVE_SESSION_SECRET",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "PORTFOLIO_ORIGIN",
  ],
  voice: [
    "QSTASH_TOKEN",
    "QSTASH_CURRENT_SIGNING_KEY",
    "QSTASH_NEXT_SIGNING_KEY",
  ],
  booking: [
    "STEVE_GOOGLE_CLIENT_ID",
    "STEVE_GOOGLE_CLIENT_SECRET",
    "STEVE_GOOGLE_REFRESH_TOKEN",
    "STEVE_GOOGLE_CALENDAR_ID",
  ],
};
let blocked = false;
for (const [feature, names] of Object.entries(groups)) {
  const missing = names.filter((n) => !process.env[n]);
  console.log(
    `${feature}: ${missing.length ? "BLOCKED; missing " + missing.join(", ") : "configuration present (live acceptance still required)"}`,
  );
  if (missing.length) blocked = true;
}
if (
  process.env.STEVE_SESSION_SECRET &&
  process.env.STEVE_SESSION_SECRET.length < 32
) {
  console.log(
    "BLOCKED: STEVE_SESSION_SECRET must have at least 32 random characters.",
  );
  blocked = true;
}
if (
  process.env.PORTFOLIO_ORIGIN &&
  !/^https:\/\//.test(process.env.PORTFOLIO_ORIGIN)
) {
  console.log("BLOCKED: deployment origin must use HTTPS.");
  blocked = true;
}
console.log(
  "Production gates: real Redis counters; QStash callback delivery and hangup; personal test-calendar booking/recovery; microphone/speaker test; physical mobile test.",
);
if (blocked) process.exitCode = 2;
