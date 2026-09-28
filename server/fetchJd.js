import https from "node:https";
import dns from "node:dns/promises";
import net from "node:net";

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 512 * 1024; // 512 KB stream cap
const ALLOWED_CONTENT_TYPES = /^(?:text\/(?:html|plain)|application\/xhtml\+xml)/i;

/**
 * Checks whether an IP address (IPv4 or IPv6) is private, loopback, link-local,
 * multicast, carrier-grade NAT, cloud metadata, or otherwise not globally routable.
 */
export function parseIpv4Octets(ip) {
  const parts = String(ip || "").trim().split(".");
  if (parts.length !== 4) return null;
  const octets = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    octets.push(n);
  }
  return octets;
}

export function isPrivateOrBlockedIpv4(a, b, c, d) {
  // 0.0.0.0/8 (current network / this host)
  if (a === 0) return true;
  // 10.0.0.0/8 (RFC 1918 private)
  if (a === 10) return true;
  // 100.64.0.0/10 (carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (link-local, cloud metadata API: 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (RFC 1918 private: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 (IETF protocol assignments)
  if (a === 192 && b === 0 && c === 0) return true;
  // 192.0.2.0/24 (TEST-NET-1 documentation)
  if (a === 192 && b === 0 && c === 2) return true;
  // 192.88.99.0/24 (6to4 relay)
  if (a === 192 && b === 88 && c === 99) return true;
  // 192.168.0.0/16 (RFC 1918 private)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (interconnect benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 (TEST-NET-2 documentation)
  if (a === 198 && b === 51 && c === 100) return true;
  // 203.0.113.0/24 (TEST-NET-3 documentation)
  if (a === 203 && b === 0 && c === 113) return true;
  // 224.0.0.0/4 (multicast)
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 (reserved / future use)
  if (a >= 240) return true;
  // 255.255.255.255 (broadcast)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

export function parseIpv6Words(ip) {
  let clean = String(ip || "").trim().toLowerCase();
  if (clean.startsWith("[") && clean.endsWith("]")) {
    clean = clean.slice(1, -1);
  }

  // Handle embedded IPv4 dot-decimal in IPv6 (e.g. ::ffff:127.0.0.1 or 0:0:0:0:0:ffff:127.0.0.1)
  let trailingWords = [];
  const lastColon = clean.lastIndexOf(":");
  if (lastColon !== -1) {
    const possibleIpv4 = clean.slice(lastColon + 1);
    if (possibleIpv4.includes(".")) {
      const octets = parseIpv4Octets(possibleIpv4);
      if (!octets) return null;
      trailingWords = [(octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]];
      clean = clean.slice(0, lastColon);
    }
  }

  // Check double colon compression
  const parts = clean.split("::");
  if (parts.length > 2) return null;

  let leftWords = [];
  let rightWords = [];

  if (parts[0]) {
    const rawLeft = parts[0].split(":").filter(Boolean);
    for (const w of rawLeft) {
      if (!/^[0-9a-f]{1,4}$/i.test(w)) return null;
      leftWords.push(parseInt(w, 16));
    }
  }

  if (parts.length === 2 && parts[1]) {
    const rawRight = parts[1].split(":").filter(Boolean);
    for (const w of rawRight) {
      if (!/^[0-9a-f]{1,4}$/i.test(w)) return null;
      rightWords.push(parseInt(w, 16));
    }
  }

  rightWords.push(...trailingWords);

  const totalExplicit = leftWords.length + rightWords.length;
  if (parts.length === 1) {
    if (totalExplicit !== 8) return null;
    return leftWords;
  }

  if (totalExplicit > 7) return null;
  const missingZeros = 8 - totalExplicit;
  const zeros = new Array(missingZeros).fill(0);
  return [...leftWords, ...zeros, ...rightWords];
}

/**
 * Validates that an IP address is syntactically valid and globally routable.
 * Fails closed on any private, loopback, link-local, carrier-grade NAT,
 * multicast, reserved, documentation, or IPv4-mapped private address.
 */
export function isPrivateOrBlockedIp(ip) {
  if (!ip || typeof ip !== "string") return true;
  const trimmed = ip.trim();

  // Test IPv4
  const v4 = parseIpv4Octets(trimmed);
  if (v4) {
    return isPrivateOrBlockedIpv4(v4[0], v4[1], v4[2], v4[3]);
  }

  // Test IPv6
  const words = parseIpv6Words(trimmed);
  if (!words) {
    // Malformed or invalid IP -> fail closed!
    return true;
  }

  // 1. IPv4-mapped IPv6 (::ffff:0:0/96, e.g. ::ffff:127.0.0.1, 0:0:0:0:0:ffff:7f00:1)
  if (
    words[0] === 0 &&
    words[1] === 0 &&
    words[2] === 0 &&
    words[3] === 0 &&
    words[4] === 0 &&
    words[5] === 0xffff
  ) {
    const a = words[6] >> 8;
    const b = words[6] & 0xff;
    const c = words[7] >> 8;
    const d = words[7] & 0xff;
    return isPrivateOrBlockedIpv4(a, b, c, d);
  }

  // 2. Deprecated IPv4-compatible IPv6 (::/96)
  if (
    words[0] === 0 &&
    words[1] === 0 &&
    words[2] === 0 &&
    words[3] === 0 &&
    words[4] === 0 &&
    words[5] === 0
  ) {
    if (words[6] === 0 && words[7] === 0) return true; // :: (unspecified)
    if (words[6] === 0 && words[7] === 1) return true; // ::1 (loopback)
    const a = words[6] >> 8;
    const b = words[6] & 0xff;
    const c = words[7] >> 8;
    const d = words[7] & 0xff;
    return isPrivateOrBlockedIpv4(a, b, c, d);
  }

  // 3. NAT64 prefix 64:ff9b::/96
  if (
    words[0] === 0x0064 &&
    words[1] === 0xff9b &&
    words[2] === 0 &&
    words[3] === 0 &&
    words[4] === 0 &&
    words[5] === 0
  ) {
    const a = words[6] >> 8;
    const b = words[6] & 0xff;
    const c = words[7] >> 8;
    const d = words[7] & 0xff;
    return isPrivateOrBlockedIpv4(a, b, c, d);
  }

  // 4. Unique local addresses (fc00::/7 -> fc00 to fdff)
  if ((words[0] & 0xfe00) === 0xfc00) return true;

  // 5. Link-local unicast (fe80::/10 -> fe80 to febf)
  if ((words[0] & 0xffc0) === 0xfe80) return true;

  // 6. Multicast (ff00::/8)
  if ((words[0] & 0xff00) === 0xff00) return true;

  // 7. Documentation prefix (2001:db8::/32)
  if (words[0] === 0x2001 && words[1] === 0x0db8) return true;

  // 8. Discard prefix (0100::/64)
  if (words[0] === 0x0100 && words[1] === 0 && words[2] === 0 && words[3] === 0) return true;

  // 9. Benchmarking (2001:2::/48)
  if (words[0] === 0x2001 && words[1] === 0x0002 && words[2] === 0) return true;

  // 10. 6to4 (2002::/16) - words[1..2] are IPv4
  if (words[0] === 0x2002) {
    const a = words[1] >> 8;
    const b = words[1] & 0xff;
    const c = words[2] >> 8;
    const d = words[2] & 0xff;
    if (isPrivateOrBlockedIpv4(a, b, c, d)) return true;
  }

  // 11. Enforce global routability: Under IANA / RFC 4291, all globally routable unicast addresses
  // are currently allocated strictly within 2000::/3 (i.e. 0x2000 to 0x3fff)
  if (words[0] < 0x2000 || words[0] > 0x3fff) {
    return true; // Not globally routable
  }

  return false;
}

/**
 * Validates the syntax, scheme, credentials, port, and hostname of a URL.
 */
export function validateUrlForSsrf(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "Invalid URL string." };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, error: "Malformed URL syntax." };
  }

  // Protocol MUST be HTTPS
  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS job posting URLs are supported." };
  }

  // Reject embedded credentials
  if (parsed.username || parsed.password) {
    return { valid: false, error: "URLs containing credentials are disallowed." };
  }

  // Enforce standard HTTPS port only
  if (parsed.port && parsed.port !== "443") {
    return { valid: false, error: "Non-standard ports are disallowed." };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".home") ||
    hostname.endsWith(".arpa")
  ) {
    return { valid: false, error: "Access to private or local network hosts is blocked." };
  }

  return { valid: true, parsed };
}

/**
 * Resolves a hostname via DNS and verifies that EVERY returned address is globally routable.
 * Returns the pinned address for connection use to defeat DNS rebinding.
 */
export async function resolveAndValidateHost(hostname, dnsResolver = dns.lookup, signal = null) {
  if (signal?.aborted) {
    throw Object.assign(new Error("Job URL request timed out or was cancelled."), { name: "TimeoutError" });
  }

  const cleanHost = String(hostname || "").trim().replace(/^\[|\]$/g, "");

  if (net.isIP(cleanHost)) {
    if (isPrivateOrBlockedIp(cleanHost)) {
      throw new Error("Access to private or local network hosts is blocked.");
    }
    return { address: cleanHost, family: net.isIP(cleanHost) };
  }

  let addresses;
  try {
    const dnsPromise = Promise.resolve().then(() => dnsResolver(cleanHost, { all: true }));
    addresses = await (signal
      ? Promise.race([
          dnsPromise,
          new Promise((_, reject) => {
            if (signal.aborted) {
              reject(Object.assign(new Error("Job URL request timed out."), { name: "TimeoutError" }));
            } else {
              signal.addEventListener(
                "abort",
                () => reject(Object.assign(new Error("Job URL request timed out."), { name: "TimeoutError" })),
                { once: true },
              );
            }
          }),
        ])
      : dnsPromise);
  } catch (err) {
    if (signal?.aborted || err.name === "TimeoutError") {
      throw Object.assign(new Error("Job URL request timed out."), { name: "TimeoutError" });
    }
    throw new Error(`DNS resolution failed for ${hostname}: ${err.message || err.code}`);
  }

  if (signal?.aborted) {
    throw Object.assign(new Error("Job URL request timed out."), { name: "TimeoutError" });
  }

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error(`No DNS records found for ${hostname}.`);
  }

  for (const entry of addresses) {
    const addr = typeof entry === "string" ? entry : entry.address;
    if (isPrivateOrBlockedIp(addr)) {
      throw new Error("Access to private or local network hosts is blocked.");
    }
  }

  const pinned = addresses.find((a) => a.family === 4) || addresses[0];
  const pinnedAddr = typeof pinned === "string" ? pinned : pinned.address;
  return {
    address: pinnedAddr,
    family: typeof pinned === "object" && pinned.family ? pinned.family : (parseIpv4Octets(pinnedAddr) ? 4 : 6),
  };
}

export function extractUrlFromText(text) {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/https?:\/\/[^\s)\]>"'`]+/i);
  return match ? match[0] : null;
}

/**
 * Performs a single HTTP GET request with DNS address pinning, TLS SNI verification,
 * content-type checking, and a stream byte cap.
 */
export async function defaultTransport(urlObj, pinned, signal) {
  return new Promise((resolve, reject) => {
    let finished = false;

    const req = https.request(
      {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Host: urlObj.hostname,
        },
        lookup: (h, opt, cb) => {
          if (typeof opt === "function") {
            cb = opt;
            opt = {};
          }
          if (opt && opt.all) {
            return cb(null, [pinned]);
          }
          return cb(null, pinned.address, pinned.family);
        },
        servername: urlObj.hostname, // Preserves TLS certificate validation against the hostname
        signal,
      },
      (res) => {
        const statusCode = res.statusCode || 0;
        const location = res.headers.location;

        if ([301, 302, 303, 307, 308].includes(statusCode)) {
          res.destroy();
          finished = true;
          return resolve({ isRedirect: true, statusCode, location });
        }

        if (statusCode < 200 || statusCode >= 300) {
          res.destroy();
          finished = true;
          return resolve({
            success: false,
            error: `Job posting returned HTTP ${statusCode} ${res.statusMessage || ""}`.trim(),
          });
        }

        const contentType = res.headers["content-type"] || "";
        if (!ALLOWED_CONTENT_TYPES.test(contentType)) {
          res.destroy();
          finished = true;
          return resolve({
            success: false,
            error: `Unsupported content type "${contentType}". Only HTML and plain text are supported.`,
          });
        }

        let bytesRead = 0;
        const chunks = [];

        res.on("data", (chunk) => {
          bytesRead += chunk.length;
          if (bytesRead > MAX_RESPONSE_BYTES) {
            finished = true;
            res.destroy();
            resolve({
              success: false,
              error: `Response body exceeds allowed size limit (512 KB).`,
            });
          } else {
            chunks.push(chunk);
          }
        });

        res.on("end", () => {
          if (finished) return;
          finished = true;
          const buffer = Buffer.concat(chunks);
          const html = buffer.toString("utf-8");
          resolve({ success: true, html, contentType });
        });

        res.on("error", (err) => {
          if (finished) return;
          finished = true;
          reject(err);
        });
      },
    );

    req.on("error", (err) => {
      if (finished) return;
      finished = true;
      reject(err);
    });

    req.end();
  });
}

export const httpTransport = defaultTransport;

/**
 * Fetches and parses a job posting description with full SSRF mitigation:
 * - Scheme, credentials, and port validation
 * - DNS resolution with private IP rejection
 * - DNS address pinning (no DNS rebinding)
 * - Manual redirect handling (max 3 hops, re-validating each target)
 * - Content-Type validation
 * - Streaming byte cap (512 KB)
 * - Unified strict deadline across all DNS queries and hops
 */
export async function fetchJobDescription(
  rawUrl,
  options = {},
  deps = {},
) {
  let parentSignal = null;
  let timeoutMs = 6000;
  if (options instanceof AbortSignal) {
    parentSignal = options;
  } else if (options && typeof options === "object") {
    if (options.signal) parentSignal = options.signal;
    if (typeof options.timeoutMs === "number") timeoutMs = Math.min(options.timeoutMs, 8000);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(Object.assign(new Error("Job URL request timed out."), { name: "TimeoutError" }));
  }, timeoutMs);

  if (parentSignal) {
    if (parentSignal.aborted) {
      clearTimeout(timer);
      return { success: false, error: "Job URL request was cancelled." };
    }
    parentSignal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        controller.abort(parentSignal.reason);
      },
      { once: true },
    );
  }

  const signal = controller.signal;
  const dnsResolver = deps.dnsResolver || dns.lookup;
  const transport = deps.transport || defaultTransport;

  try {
    let currentUrl = rawUrl;
    const visited = new Set();

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      if (signal.aborted) {
        throw Object.assign(new Error("Job URL request timed out."), { name: "TimeoutError" });
      }

      const urlValidation = validateUrlForSsrf(currentUrl);
      if (!urlValidation.valid) {
        return { success: false, error: urlValidation.error };
      }
      const parsed = urlValidation.parsed;
      const urlString = parsed.toString();

      if (visited.has(urlString)) {
        return { success: false, error: "Redirect loop detected." };
      }
      visited.add(urlString);

      let pinned;
      try {
        pinned = await resolveAndValidateHost(parsed.hostname, dnsResolver, signal);
      } catch (err) {
        if (err.name === "TimeoutError" || signal.aborted) {
          return { success: false, error: `Fetching job posting timed out after ${timeoutMs}ms.` };
        }
        return { success: false, error: err.message || "DNS validation failed." };
      }

      if (signal.aborted) {
        return { success: false, error: `Fetching job posting timed out after ${timeoutMs}ms.` };
      }

      let hopResult;
      try {
        hopResult = await Promise.race([
          transport(parsed, pinned, signal),
          new Promise((_, reject) => {
            if (signal.aborted) {
              reject(signal.reason || Object.assign(new Error("Job URL request timed out."), { name: "TimeoutError" }));
            } else {
              signal.addEventListener(
                "abort",
                () => reject(signal.reason || Object.assign(new Error("Job URL request timed out."), { name: "TimeoutError" })),
                { once: true },
              );
            }
          }),
        ]);
      } catch (err) {
        if (err.name === "TimeoutError" || signal.aborted) {
          return { success: false, error: `Fetching job posting timed out after ${timeoutMs}ms.` };
        }
        return { success: false, error: err.message || "Failed to fetch job description." };
      }

      if (hopResult.isRedirect) {
        if (redirectCount >= MAX_REDIRECTS) {
          return { success: false, error: "Too many redirects (max 3)." };
        }
        if (!hopResult.location) {
          return { success: false, error: "Redirect missing Location header." };
        }
        try {
          const nextUrl = new URL(hopResult.location, parsed).toString();
          currentUrl = nextUrl;
          continue;
        } catch {
          return { success: false, error: "Invalid redirect Location header." };
        }
      }

      if (!hopResult.success) {
        return { success: false, error: hopResult.error };
      }

      const html = hopResult.html;
      if (!html || !html.trim()) {
        return { success: false, error: "Empty response received from job URL." };
      }

      return extractJobContentFromHtml(html, parsed.hostname, urlString);
    }

    return { success: false, error: "Exceeded maximum redirects." };
  } catch (err) {
    return {
      success: false,
      error:
        err.name === "TimeoutError" || signal?.aborted
          ? "Job URL request timed out."
          : err.message || "Failed to fetch job URL.",
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractJobContentFromHtml(html, hostname, url) {
  // 1. Check for Next.js __NEXT_DATA__ SSR hydration payload
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
            hostname,
            url,
            text: parts.join("\n\n").slice(0, 7000),
          };
        }
      }
    } catch {
      // Fall through to HTML text parsing
    }
  }

  // 2. Clean HTML text extraction
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
    .replace(/<[^>]+>/g, " ")
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

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "Job Description";

  return {
    success: true,
    title,
    hostname,
    url,
    text: clean.slice(0, 7000),
  };
}

function cleanHtml(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
