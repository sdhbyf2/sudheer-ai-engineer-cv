import {
  getSession,
  json,
  originAllowed,
  saveRecruiterLead,
  logConversationTurn,
} from "../../server/assistant.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed." }, { Allow: "POST" });
  }
  if (!originAllowed(req)) {
    return json(res, 403, { error: "Request origin is not allowed." });
  }
  const sid = getSession(req);
  if (!sid) {
    return json(res, 401, { error: "Session expired." });
  }

  const { name, company, email, phone = "", roleText = "", jdSnippet = "" } = req.body || {};
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof company !== "string" ||
    !company.trim() ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return json(res, 400, {
      error: "Name, company name or recruitment agency, and a valid email are required.",
    });
  }

  try {
    const lead = await saveRecruiterLead({
      sid,
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: typeof phone === "string" ? phone.trim() : "",
      roleText: (roleText || jdSnippet || "").trim(),
    });

    await logConversationTurn({
      sid,
      role: "user",
      content: `Recruiter inquiry: ${name.trim()} from ${company.trim()} (${email.trim()}${phone ? `, ${phone.trim()}` : ""})`,
      mode: "role",
      metadata: { lead: true },
    });

    return json(res, 200, { success: true, lead });
  } catch {
    return json(res, 500, { error: "Unable to record recruiter inquiry." });
  }
}
