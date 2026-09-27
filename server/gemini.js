// Google Gemini fallback provider for Steve Assistant
import { recordOperation } from "./assistant.js";

const CANDIDATE_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function geminiModel() {
  return process.env.GEMINI_MODEL || CANDIDATE_MODELS[0];
}

function formatContents(instructions, input) {
  const contents = (input || []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  return {
    systemInstruction: { parts: [{ text: instructions }] },
    contents,
  };
}

export async function geminiGenerate({ instructions, input, schema, signal }) {
  const started = Date.now();
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key is not configured.");

  const model = geminiModel();
  const body = {
    ...formatContents(instructions, input),
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2400,
      ...(schema
        ? {
            responseMimeType: "application/json",
            responseSchema: schema,
          }
        : {}),
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal || AbortSignal.timeout(30000),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini generation failed.");
  }

  await recordOperation({
    operation: "gemini_text",
    status: response.status,
    latencyMs: Date.now() - started,
    inputTokens: data.usageMetadata?.promptTokenCount,
    outputTokens: data.usageMetadata?.candidatesTokenCount,
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text, raw: data };
}

export async function geminiStream({ instructions, input, signal, onDelta }) {
  const started = Date.now();
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key is not configured.");

  const model = geminiModel();
  const body = {
    ...formatContents(instructions, input),
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2400,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal || AbortSignal.timeout(45000),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "Gemini stream unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "",
    buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index;
      while ((index = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        const dataLine = block
          .split("\n")
          .filter((l) => l.startsWith("data: "))
          .map((l) => l.slice(6))
          .join("\n");
        if (!dataLine) continue;
        try {
          const parsed = JSON.parse(dataLine);
          const chunk =
            parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (chunk) {
            fullText += chunk;
            if (onDelta) onDelta(chunk);
          }
        } catch {
          // ignore chunk parse errors
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  await recordOperation({
    operation: "gemini_stream",
    status: 200,
    latencyMs: Date.now() - started,
  });

  return fullText;
}
