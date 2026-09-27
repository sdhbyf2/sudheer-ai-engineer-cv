export const CONTRACT_VERSION = 2;
export function enabled(feature) {
  if (process.env.STEVE_ENABLED === "false") return false;
  return process.env[`STEVE_${feature.toUpperCase()}_ENABLED`] === "true";
}
export function modelFor(kind) {
  const defaults = {
    text: "gpt-6-luna",
    search: "gpt-6-luna",
    realtime: "gpt-realtime-2.1-mini",
  };
  const allowed =
    kind === "realtime"
      ? ["gpt-realtime-2.1-mini", "gpt-realtime-2.1"]
      : ["gpt-6-luna", "gpt-6-sol", "gpt-4.1-mini"];
  const model =
    process.env[`OPENAI_${kind.toUpperCase()}_MODEL`] || defaults[kind];
  if (!allowed.includes(model))
    throw new Error("Unsupported server model configuration.");
  return model;
}
export function reasoningFor(model) {
  return model.startsWith("gpt-6-") ? { reasoning: { effort: "low" } } : {};
}
export function voiceConfigured() {
  return (
    enabled("voice") &&
    Boolean(
      process.env.QSTASH_TOKEN &&
      process.env.QSTASH_CURRENT_SIGNING_KEY &&
      process.env.QSTASH_NEXT_SIGNING_KEY &&
      /^https:\/\//.test(process.env.PORTFOLIO_ORIGIN || ""),
    )
  );
}
export function safeUrl(value, portfolio = false) {
  if (portfolio && /^\/#[-a-z0-9]+$/i.test(value || "")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}
