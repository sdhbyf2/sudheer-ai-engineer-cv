import { createHash } from "node:crypto";
import {
  requireSessionRequest,
  json,
  saveRecruiterLead,
  logConversationTurn,
  redis,
  RECRUITER_LEAD_TTL,
} from "../../server/assistant.js";

export default async function handler(req, res) {
  // Fail-closed distributed rate limiting and signed session validation
  const sid = await requireSessionRequest(req, res, "lead", 10, 3600);
  if (!sid) return;

  const {
    name,
    company,
    email,
    phone = "",
    roleText = "",
    jdSnippet = "",
    clientRequestId,
  } = req.body || {};

  const cleanName = typeof name === "string"
    ? name.trim().replace(/[<>\r\n]/g, " ").slice(0, 100)
    : "";
  const cleanCompany = typeof company === "string"
    ? company.trim().replace(/[<>\r\n]/g, " ").slice(0, 120)
    : "";
  const cleanEmail = typeof email === "string"
    ? email.trim().toLowerCase().slice(0, 254)
    : "";
  const cleanPhone = typeof phone === "string"
    ? phone.trim().replace(/[^0-9+()\-\s.ext]/gi, "").slice(0, 40)
    : "";
  const cleanJd = typeof (roleText || jdSnippet) === "string"
    ? String(roleText || jdSnippet).trim().replace(/[<>]/g, "").slice(0, 8000)
    : "";

  // 1. Mandatory field and syntax validation MUST occur BEFORE any idempotency reservation!
  if (!cleanName || !cleanCompany || !cleanEmail) {
    return json(res, 400, {
      error: "Name, company name or recruitment agency, and email are mandatory.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return json(res, 400, {
      error: "Please provide a valid work email address.",
    });
  }

  // 2. Safe, atomic idempotency handling with payload hash and pending/completed states
  const payloadHash = createHash("sha256")
    .update(`${cleanName}|${cleanCompany}|${cleanEmail}|${cleanPhone}|${cleanJd}`)
    .digest("hex")
    .slice(0, 16);

  const cleanRequestId = typeof clientRequestId === "string" && clientRequestId.trim()
    ? clientRequestId.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64)
    : null;

  let reqKey = null;
  if (cleanRequestId) {
    reqKey = `steve:lead:req:${sid}:${cleanRequestId}`;
    try {
      const existingState = await redis(["GET", reqKey]);
      if (existingState) {
        if (existingState.startsWith("completed:")) {
          const [, completedHash] = existingState.split(":");
          if (completedHash === payloadHash) {
            return json(res, 200, { success: true, saved: true, idempotent: true });
          }
          return json(res, 409, {
            error: "A lead submission with this request ID already exists with different details.",
          });
        }
        if (existingState.startsWith("pending:")) {
          const [, pendingHash] = existingState.split(":");
          if (pendingHash && pendingHash !== payloadHash) {
            return json(res, 409, {
              error: "A lead submission with this request ID already exists with different details.",
            });
          }
          // Explicit recovery: check if lead was already saved in Redis despite pending lock
          const existingLead = await redis(["GET", `steve:lead:${sid}:${cleanRequestId}`]).catch(() => null);
          if (existingLead) {
            await redis(["SET", reqKey, `completed:${payloadHash}`, "EX", String(RECRUITER_LEAD_TTL)]).catch(() => {});
            return json(res, 200, { success: true, saved: true, idempotent: true, recovered: true });
          }
          return json(res, 409, {
            error: "A submission with this request ID is currently being processed. Please retry shortly.",
          });
        }
      }

      // Atomically reserve the request ID with pending state (60-second processing lock)
      const reserved = await redis(["SET", reqKey, `pending:${payloadHash}`, "NX", "EX", "60"]);
      if (!reserved) {
        return json(res, 409, {
          error: "A submission with this request ID is currently being processed.",
        });
      }
    } catch (err) {
      console.warn("[lead] Failed to check/reserve idempotency key:", err?.message);
      // If Redis cannot verify or reserve state, fail closed to avoid data inconsistency
      return json(res, 503, { error: "Unable to verify submission state. Please retry." });
    }
  }

  // 3. Durable persistence with atomic commitment and failure propagation
  try {
    const lead = await saveRecruiterLead({
      sid,
      leadId: cleanRequestId,
      name: cleanName,
      company: cleanCompany,
      email: cleanEmail,
      phone: cleanPhone,
      roleText: cleanJd,
      reqKey: reqKey || "",
      payloadHash,
    });

    if (lead?.idempotent) {
      return json(res, 200, { success: true, saved: true, idempotent: true });
    }

    await logConversationTurn({
      sid,
      role: "user",
      content: "Recruiter contact details submitted via role form.",
      mode: "role",
      metadata: { lead: true },
    });

    return json(res, 200, { success: true, saved: true, lead });
  } catch (err) {
    console.error("[lead] saveRecruiterLead failed:", err?.message);
    // Release pending reservation on failure so client retry is unblocked
    if (reqKey) {
      try {
        await redis(["DEL", reqKey]);
      } catch {}
    }
    return json(res, 503, { error: "Unable to record recruiter inquiry. Please try again." });
  }
}
