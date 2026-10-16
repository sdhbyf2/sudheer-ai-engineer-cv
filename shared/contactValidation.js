// Strict contact validation, input sanitization, and junk detection
// Shared between client forms and server API routes

export function sanitizePhone(val) {
  if (typeof val !== "string") return "";
  return val.replace(/[^0-9+\s\-()]/g, "").slice(0, 30);
}

export function validatePhone(phone) {
  if (!phone || !phone.trim()) return { valid: true };
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < 8) {
    return { valid: false, error: "Phone number must have at least 8 digits with country/area code." };
  }
  if (digits.length > 15) {
    return { valid: false, error: "Phone number is too long (maximum 15 digits)." };
  }
  // Reject dummy sequences (e.g., 00000000, 12345678, 11111111)
  if (/^(\d)\1+$/.test(digits) || digits === "12345678" || digits === "123456789" || digits === "987654321") {
    return { valid: false, error: "Please enter a genuine phone number." };
  }
  return { valid: true };
}

export const JUNK_DOMAINS = new Set([
  "haha.com",
  "fake.com",
  "test.com",
  "asdf.com",
  "sample.com",
  "invalid.com",
  "tempmail.com",
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "sharklasers.com",
  "dispostable.com",
  "getairmail.com",
]);

export function validateEmail(email, allowTestDomains = false) {
  if (!email || typeof email !== "string" || !email.trim()) {
    return { valid: false, error: "Please provide a valid work email address." };
  }
  const clean = email.trim().toLowerCase();

  // RFC syntax check: local@domain.tld where tld is >= 2 letters
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: "Please provide a valid work email address." };
  }

  const parts = clean.split("@");
  if (parts.length !== 2) {
    return { valid: false, error: "Please provide a valid email address." };
  }
  const [user, domain] = parts;

  // Check known junk / disposable domains
  if (JUNK_DOMAINS.has(domain)) {
    return { valid: false, error: "Please provide a genuine company or personal email address." };
  }

  if (domain.endsWith(".invalid")) {
    return { valid: false, error: "Please provide a real active email domain." };
  }

  // Check laughter / troll patterns
  if (/(?:ha){2,}|(?:he){2,}|(?:lol){2,}|(?:lmao){2,}/i.test(user) || /(?:ha){2,}/i.test(domain)) {
    return { valid: false, error: "Please provide a genuine email address." };
  }

  if (/^(test|fake|asdf|qwerty|none|nobody|null|undefined)$/i.test(user)) {
    return { valid: false, error: "Please provide a genuine email address." };
  }

  // Check 4+ repeated characters in local part
  if (/(.)\1{4,}/.test(user)) {
    return { valid: false, error: "Please check your email address for repeated characters." };
  }

  return { valid: true, clean };
}

export function validateName(name) {
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return { valid: false, error: "Please enter your full name." };
  }
  const clean = name.trim();
  // Check laughter / troll names (e.g. hahaha, hehehe, lolol)
  if (/(?:ha){2,}|(?:he){2,}|(?:lol){2,}|(?:lmao){2,}/i.test(clean)) {
    return { valid: false, error: "Please enter your genuine name." };
  }
  // Check dummy single-words
  if (/^(test|asdf|qwerty|fake|none|nobody|user|admin)$/i.test(clean)) {
    return { valid: false, error: "Please enter your genuine name." };
  }
  if (/(.)\1{3,}/.test(clean)) {
    return { valid: false, error: "Please enter your genuine name." };
  }
  return { valid: true, clean };
}
