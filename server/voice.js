import { Client } from "@upstash/qstash";
import { redis } from "./assistant.js";
export const voiceKey = (sid) => `steve:voice:${sid}`;
export async function hangup(callId) {
  if (!/^rtc_[a-zA-Z0-9_-]+$/.test(callId || "")) return;
  const response = await fetch(
    `https://api.openai.com/v1/realtime/calls/${callId}/hangup`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok && ![404, 410].includes(response.status))
    throw new Error("Voice termination pending.");
}
export async function scheduleVoice(record, delay, force = false) {
  if (!process.env.QSTASH_TOKEN || !process.env.PORTFOLIO_ORIGIN)
    throw new Error("Durable voice control is unavailable.");
  const client = new Client({ token: process.env.QSTASH_TOKEN });
  await client.publishJSON({
    url: `${process.env.PORTFOLIO_ORIGIN.replace(/\/$/, "")}/api/assistant/voice-watchdog`,
    body: { ...record, force },
    delay,
    retries: 5,
    deduplicationId: `${record.callId}_${force ? (record.terminationPending ? "terminate" : "end") : Math.floor(Date.now() / 30000)}`.replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    ),
  });
}
export async function releaseVoice(sid, value) {
  await redis([
    "EVAL",
    "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0",
    "1",
    voiceKey(sid),
    value,
  ]);
}
