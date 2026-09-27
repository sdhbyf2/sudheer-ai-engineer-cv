// Google Gemini fallback provider for Steve Assistant
import { recordOperation } from "./assistant.js";

const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
];

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function geminiModel() {
  return process.env.GEMINI_MODEL || CANDIDATE_MODELS[0];
}

export function geminiVoice() {
  return process.env.GEMINI_VOICE || "Charon";
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

  const models = [
    process.env.GEMINI_MODEL,
    ...CANDIDATE_MODELS,
  ].filter(Boolean).filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError = null;
  for (const model of models) {
    try {
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
        throw new Error(
          data.error?.message ||
            `Gemini generation failed on ${model} (status ${response.status}).`,
        );
      }

      await recordOperation({
        operation: "gemini_text",
        status: response.status,
        latencyMs: Date.now() - started,
        inputTokens: data.usageMetadata?.promptTokenCount,
        outputTokens: data.usageMetadata?.candidatesTokenCount,
      });

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return { text, raw: data, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (signal?.aborted) throw err;
      console.warn(`[Gemini] ${model} unavailable, trying fallback:`, err.message);
    }
  }

  throw lastError || new Error("All Gemini models failed.");
}

export async function geminiStream({ instructions, input, signal, onDelta }) {
  const started = Date.now();
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key is not configured.");

  const models = [
    process.env.GEMINI_MODEL,
    ...CANDIDATE_MODELS,
  ].filter(Boolean).filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError = null;
  for (const model of models) {
    try {
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
        throw new Error(
          err.error?.message ||
            `Gemini stream failed on ${model} (status ${response.status}).`,
        );
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
          let match;
          while ((match = buffer.match(/\r?\n\r?\n/))) {
            const block = buffer.slice(0, match.index);
            buffer = buffer.slice(match.index + match[0].length);
            const lines = block.split(/\r?\n/);
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const dataStr = trimmed.replace(/^data:\s*/, "");
              if (!dataStr || dataStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr);
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
        }
      } finally {
        await reader.cancel().catch(() => {});
      }

      if (!fullText) {
        throw new Error(`Empty response from Gemini stream on ${model}.`);
      }

      await recordOperation({
        operation: "gemini_stream",
        status: 200,
        latencyMs: Date.now() - started,
      });

      return fullText;
    } catch (err) {
      lastError = err;
      if (signal?.aborted) throw err;
      console.warn(`[Gemini] ${model} stream unavailable, trying fallback:`, err.message);
    }
  }

  throw lastError || new Error("All Gemini streaming models failed.");
}
