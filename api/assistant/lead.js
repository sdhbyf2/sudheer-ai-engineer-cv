import {
  requireSessionRequest,
  json,
  saveRecruiterLead,
  logConversationTurn,
} from "../../server/assistant.js";

export default async function handler(req, res) {
  // Fail-closed distributed rate limiting and signed session validation
  const sid = await requireSessionRequest(req, res, "lead", 10, 3600);
  if (!sid) return;

  const { name, company, email, phone = "", roleText = "", jdSnippet = "" } = req.body || {};

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

  try {
    const lead = await saveRecruiterLead({
      sid,
      name: cleanName,
      company: cleanCompany,
      email: cleanEmail,
      phone: cleanPhone,
      roleText: cleanJd,
    });

    await logConversationTurn({
      sid,
      role: "user",
      content: `Recruiter inquiry: ${cleanName} from ${cleanCompany} (${cleanEmail}${cleanPhone ? `, ${cleanPhone}` : ""})`,
      mode: "role",
      metadata: { lead: true },
    });

    return json(res, 200, { success: true, saved: true, lead });
  } catch {
    return json(res, 500, { error: "Unable to record recruiter inquiry." });
  }
}
