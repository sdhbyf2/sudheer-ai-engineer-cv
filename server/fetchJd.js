import { safeUrl } from "./config.js";

// SSRF Protection: Block private, local, and metadata IP spaces
function isBlockedHost(hostname) {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  // IPv4 checks
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [_, a, b, c, d] = ipv4Match.map(Number);
    if (a === 127 || a === 0) return true; // 127.0.0.0/8, 0.0.0.0
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 (AWS/cloud metadata)
  }

  // IPv6 checks
  if (host === "::1" || host === "[::1]" || host.startsWith("fe80:")) {
    return true;
  }

  return false;
}

export function extractUrlFromText(text) {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/https?:\/\/[^\s)\]>"'`]+/i);
  return match ? match[0] : null;
}

export async function fetchJobDescription(rawUrl, signal = AbortSignal.timeout(6000)) {
  const validUrl = safeUrl(rawUrl);
  if (!validUrl) {
    return { success: false, error: "Invalid or unsupported URL scheme." };
  }

  try {
    const parsed = new URL(validUrl);
    if (isBlockedHost(parsed.hostname)) {
      return { success: false, error: "Access to private or local network hosts is blocked." };
    }

    const response = await fetch(validUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Job posting returned HTTP ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    const html = await response.text();
    if (!html || !html.trim()) {
      return { success: false, error: "Empty response received from job URL." };
    }

    // 1. Check for Next.js __NEXT_DATA__ SSR hydration payload (common across modern career pages like throxy, Ashby, etc.)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const job = nextData.props?.pageProps?.job || nextData.props?.pageProps?.posting;
        if (job) {
          const parts = [];
          if (job.title) parts.push(`Title: ${job.title} ${job.title_em || ""}`.trim());
          if (job.meta?.location || job.location) {
            parts.push(`Location: ${job.meta?.location || job.location}`);
          }
          if (job.meta?.type || job.type) {
            parts.push(`Type: ${job.meta?.type || job.type}`);
          }
          if (job.about?.heading || job.about?.paragraphs) {
            parts.push(`About Role: ${job.about.heading || ""} ${(job.about.paragraphs || []).join(" ")}`);
          }
          if (job.tools?.body || job.techStack) {
            parts.push(`Tech Stack: ${cleanHtml(job.tools?.body || job.techStack)}`);
          }
          if (job.requirements?.items) {
            parts.push(`Must-Haves & Requirements:\n• ${job.requirements.items.join("\n• ")}`);
          }
          if (job.skills?.cards) {
            parts.push(
              `Signals & Preferences:\n• ${job.skills.cards.map((c) => `${c.label || c.title}: ${c.body || ""}`).join("\n• ")}`,
            );
          }
          if (job.ownership?.items) {
            parts.push(
              `What You'll Build / Responsibilities:\n• ${job.ownership.items.map((i) => `${i.title}: ${i.body}`).join("\n• ")}`,
            );
          }

          if (parts.length > 0) {
            return {
              success: true,
              title: job.title || "Software Engineering Role",
              hostname: parsed.hostname,
              url: validUrl,
              text: parts.join("\n\n").slice(0, 7000),
            };
          }
        }
      } catch {
        // Fallback to HTML text parsing below
      }
    }

    // 2. Fallback: Clean HTML text extraction
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<h[1-6][^>]*>/gi, "\n\n### ")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<[^>]+>/g, " ");

    // Decode HTML entities
    clean = clean
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\r\n|\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim();

    // Extract title from <title> tag if available
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "Job Description";

    return {
      success: true,
      title,
      hostname: parsed.hostname,
      url: validUrl,
      text: clean.slice(0, 7000),
    };
  } catch (err) {
    return {
      success: false,
      error: err.name === "TimeoutError" ? "Job URL request timed out." : (err.message || "Failed to fetch job URL."),
    };
  }
}

function cleanHtml(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
