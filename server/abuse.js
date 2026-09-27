import { clientKey, rateLimit } from "./assistant.js";
export async function bookingChallenge(req) {
  const lowRisk = await rateLimit(`booking-risk:${clientKey(req)}`, 2, 86400);
  if (lowRisk) return null;
  const siteKey = process.env.STEVE_TURNSTILE_SITE_KEY,
    secret = process.env.STEVE_TURNSTILE_SECRET;
  if (!siteKey || !secret)
    return {
      status: 429,
      error:
        "Booking protection has paused further attempts. Contact Sudheer directly.",
    };
  const token = req.body?.challengeToken;
  const rejected = {
    status: 403,
    error: "Complete the verification before confirming.",
    code: "challenge_required",
    siteKey,
  };
  if (typeof token !== "string" || token.length > 2048 || !token)
    return rejected;
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
        signal: AbortSignal.timeout(8000),
      },
    );
    const result = await response.json();
    if (
      !response.ok ||
      !result.success ||
      result.action !== "steve-booking" ||
      result.hostname !== new URL(process.env.PORTFOLIO_ORIGIN).hostname
    )
      return rejected;
    return null;
  } catch {
    return {
      status: 503,
      error: "Booking verification is unavailable. Please contact Sudheer.",
    };
  }
}
