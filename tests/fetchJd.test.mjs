import { test } from "node:test";
import assert from "node:assert/strict";
import https from "node:https";
import { Readable } from "node:stream";
import { EventEmitter } from "node:events";
import {
  isPrivateOrBlockedIp,
  validateUrlForSsrf,
  resolveAndValidateHost,
  httpTransport,
  fetchJobDescription,
} from "../server/fetchJd.js";

test("isPrivateOrBlockedIp correctly identifies private, loopback, and reserved IPs", () => {
  // IPv4 blocked
  assert.equal(isPrivateOrBlockedIp("127.0.0.1"), true);
  assert.equal(isPrivateOrBlockedIp("127.1.2.3"), true);
  assert.equal(isPrivateOrBlockedIp("0.0.0.0"), true);
  assert.equal(isPrivateOrBlockedIp("10.0.0.1"), true);
  assert.equal(isPrivateOrBlockedIp("10.255.255.255"), true);
  assert.equal(isPrivateOrBlockedIp("172.16.0.1"), true);
  assert.equal(isPrivateOrBlockedIp("172.31.255.255"), true);
  assert.equal(isPrivateOrBlockedIp("192.168.0.1"), true);
  assert.equal(isPrivateOrBlockedIp("192.168.255.255"), true);
  assert.equal(isPrivateOrBlockedIp("169.254.169.254"), true); // AWS/cloud metadata
  assert.equal(isPrivateOrBlockedIp("100.64.0.1"), true); // CGNAT
  assert.equal(isPrivateOrBlockedIp("192.0.2.1"), true); // TEST-NET-1
  assert.equal(isPrivateOrBlockedIp("198.51.100.1"), true); // TEST-NET-2
  assert.equal(isPrivateOrBlockedIp("203.0.113.1"), true); // TEST-NET-3
  assert.equal(isPrivateOrBlockedIp("224.0.0.1"), true); // Multicast
  assert.equal(isPrivateOrBlockedIp("240.0.0.1"), true); // Reserved
  assert.equal(isPrivateOrBlockedIp("255.255.255.255"), true); // Broadcast

  // IPv6 blocked
  assert.equal(isPrivateOrBlockedIp("::1"), true); // Loopback
  assert.equal(isPrivateOrBlockedIp("::"), true); // Unspecified
  assert.equal(isPrivateOrBlockedIp("fe80::1"), true); // Link-local
  assert.equal(isPrivateOrBlockedIp("febf::ffff"), true);
  assert.equal(isPrivateOrBlockedIp("fc00::1"), true); // ULA
  assert.equal(isPrivateOrBlockedIp("fd12:3456::1"), true); // ULA
  assert.equal(isPrivateOrBlockedIp("ff02::1"), true); // Multicast
  assert.equal(isPrivateOrBlockedIp("2001:db8::1"), true); // Documentation
  assert.equal(isPrivateOrBlockedIp("::ffff:127.0.0.1"), true); // IPv4-mapped loopback
  assert.equal(isPrivateOrBlockedIp("::ffff:10.0.0.1"), true); // IPv4-mapped private
  assert.equal(isPrivateOrBlockedIp("::ffff:169.254.169.254"), true); // IPv4-mapped cloud metadata
  // Expanded IPv4-mapped representations (reproduced finding):
  assert.equal(isPrivateOrBlockedIp("0:0:0:0:0:ffff:7f00:1"), true); // Loopback 127.0.0.1
  assert.equal(isPrivateOrBlockedIp("0:0:0:0:0:ffff:127.0.0.1"), true);
  assert.equal(isPrivateOrBlockedIp("0000:0000:0000:0000:0000:ffff:c0a8:0101"), true); // 192.168.1.1
  assert.equal(isPrivateOrBlockedIp("0000:0000:0000:0000:0000:ffff:a00:1"), true); // 10.0.0.1
  assert.equal(isPrivateOrBlockedIp("64:ff9b::127.0.0.1"), true); // NAT64 loopback
  assert.equal(isPrivateOrBlockedIp("64:ff9b::10.0.0.1"), true); // NAT64 private
  assert.equal(isPrivateOrBlockedIp("::/96"), true); // Deprecated IPv4-compatible
  assert.equal(isPrivateOrBlockedIp("::127.0.0.1"), true); // Deprecated loopback

  // Public globally-routable IPs allowed
  assert.equal(isPrivateOrBlockedIp("93.184.216.34"), false);
  assert.equal(isPrivateOrBlockedIp("104.20.23.154"), false);
  assert.equal(isPrivateOrBlockedIp("172.32.0.1"), false);
  assert.equal(isPrivateOrBlockedIp("2606:4700:4700::1111"), false);
  assert.equal(isPrivateOrBlockedIp("2001:4860:4860::8888"), false);
  assert.equal(isPrivateOrBlockedIp("::ffff:93.184.216.34"), false);
});

test("validateUrlForSsrf blocks insecure schemes, credentials, non-standard ports, and local hosts", () => {
  assert.equal(validateUrlForSsrf("http://example.com/job").valid, false);
  assert.equal(validateUrlForSsrf("ftp://example.com/job").valid, false);
  assert.equal(validateUrlForSsrf("javascript:alert(1)").valid, false);
  assert.equal(validateUrlForSsrf("https://user:pass@example.com/job").valid, false);
  assert.equal(validateUrlForSsrf("https://example.com:8080/job").valid, false);
  assert.equal(validateUrlForSsrf("https://example.com:22/job").valid, false);
  assert.equal(validateUrlForSsrf("https://localhost/job").valid, false);
  assert.equal(validateUrlForSsrf("https://service.internal/job").valid, false);
  assert.equal(validateUrlForSsrf("https://api.local/job").valid, false);

  const valid = validateUrlForSsrf("https://careers.example.com/job/senior-engineer");
  assert.equal(valid.valid, true);
  assert.equal(valid.parsed.hostname, "careers.example.com");
});

test("resolveAndValidateHost fails if any resolved address is private or blocked", async () => {
  // Mock DNS resolver returning private IP
  const mockDnsPrivate = async () => [{ address: "10.0.0.5", family: 4 }];
  await assert.rejects(
    () => resolveAndValidateHost("evil.example", mockDnsPrivate),
    /Access to private or local network hosts is blocked/
  );

  // Mock DNS resolver returning mix of public and private
  const mockDnsMixed = async () => [
    { address: "93.184.216.34", family: 4 },
    { address: "127.0.0.1", family: 4 },
  ];
  await assert.rejects(
    () => resolveAndValidateHost("mixed.example", mockDnsMixed),
    /Access to private or local network hosts is blocked/
  );

  // Mock DNS resolver returning valid public IP
  const mockDnsPublic = async () => [{ address: "93.184.216.34", family: 4 }];
  const pinned = await resolveAndValidateHost("careers.example", mockDnsPublic);
  assert.equal(pinned.address, "93.184.216.34");
});

test("fetchJobDescription blocks direct private/loopback IP targets", async () => {
  const result = await fetchJobDescription("https://127.0.0.1/admin");
  assert.equal(result.success, false);
  assert.match(result.error, /Access to private or local network hosts is blocked/);

  const resultV6 = await fetchJobDescription("https://[::1]/admin");
  assert.equal(resultV6.success, false);
  assert.match(resultV6.error, /Access to private or local network hosts is blocked/);
});

test("fetchJobDescription blocks redirect to private IP", async () => {
  const mockDns = async (h) => [{ address: "93.184.216.34", family: 4 }];

  // Mock transport where hop 1 redirects to private 169.254.169.254
  const mockTransport = async (url) => {
    if (url.hostname === "public.example") {
      return {
        isRedirect: true,
        statusCode: 302,
        location: "https://169.254.169.254/latest/meta-data/",
      };
    }
    return { success: true, html: "secret", contentType: "text/html" };
  };

  const result = await fetchJobDescription("https://public.example/job", undefined, {
    dnsResolver: mockDns,
    transport: mockTransport,
  });

  assert.equal(result.success, false);
  assert.match(result.error, /Access to private or local network hosts is blocked/);
});

test("fetchJobDescription rejects redirect loops", async () => {
  const mockDns = async () => [{ address: "93.184.216.34", family: 4 }];
  const mockTransport = async (url) => {
    if (url.pathname === "/a") {
      return { isRedirect: true, statusCode: 302, location: "https://public.example/b" };
    }
    return { isRedirect: true, statusCode: 302, location: "https://public.example/a" };
  };

  const result = await fetchJobDescription("https://public.example/a", undefined, {
    dnsResolver: mockDns,
    transport: mockTransport,
  });

  assert.equal(result.success, false);
  assert.match(result.error, /Redirect loop detected/);
});

test("fetchJobDescription rejects oversized response (> 512 KB)", async () => {
  const mockDns = async () => [{ address: "93.184.216.34", family: 4 }];
  const mockTransport = async () => ({
    success: false,
    error: "Response body exceeds allowed size limit (512 KB).",
  });

  const result = await fetchJobDescription("https://public.example/giant-job", undefined, {
    dnsResolver: mockDns,
    transport: mockTransport,
  });

  assert.equal(result.success, false);
  assert.match(result.error, /Response body exceeds allowed size limit/);
});

test("fetchJobDescription rejects unsupported content types", async () => {
  const mockDns = async () => [{ address: "93.184.216.34", family: 4 }];
  const mockTransport = async () => ({
    success: false,
    error: 'Unsupported content type "application/pdf". Only HTML and plain text are supported.',
  });

  const result = await fetchJobDescription("https://public.example/resume.pdf", undefined, {
    dnsResolver: mockDns,
    transport: mockTransport,
  });

  assert.equal(result.success, false);
  assert.match(result.error, /Unsupported content type/);
});

test("fetchJobDescription successfully parses valid public job posting", async () => {
  const mockDns = async () => [{ address: "93.184.216.34", family: 4 }];
  const mockHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Senior Full-Stack AI Engineer - Acme Labs</title></head>
      <body>
        <main>
          <h1>Senior Full-Stack AI Engineer</h1>
          <p>We are looking for an engineer with React, TypeScript, and RAG architectures.</p>
          <h3>Requirements</h3>
          <ul>
            <li>8+ years commercial development</li>
            <li>Production vector search with PostgreSQL or pgvector</li>
          </ul>
        </main>
      </body>
    </html>
  `;
  const mockTransport = async () => ({
    success: true,
    html: mockHtml,
    contentType: "text/html; charset=utf-8",
  });

  const result = await fetchJobDescription("https://careers.acme.example/jobs/ai-eng", undefined, {
    dnsResolver: mockDns,
    transport: mockTransport,
  });

  assert.equal(result.success, true);
  assert.equal(result.title, "Senior Full-Stack AI Engineer - Acme Labs");
  assert.match(result.text, /Senior Full-Stack AI Engineer/);
  assert.match(result.text, /React, TypeScript, and RAG architectures/);
});

test("httpTransport destroys stream and caps memory when response exceeds 512 KB", async () => {
  const origRequest = https.request;
  try {
    let destroyedCalled = false;
    https.request = (opts, callback) => {
      const reqEmitter = new EventEmitter();
      reqEmitter.end = () => {
        const resStream = new Readable({ read() {} });
        resStream.statusCode = 200;
        resStream.headers = { "content-type": "text/html; charset=utf-8" };
        resStream.destroy = () => {
          destroyedCalled = true;
          resStream.destroyed = true;
          return resStream;
        };
        callback(resStream);
        // Push 300 KB chunk
        resStream.push(Buffer.alloc(300 * 1024, "a"));
        // Push another 300 KB chunk (total 600 KB > 512 KB limit)
        resStream.push(Buffer.alloc(300 * 1024, "b"));
      };
      return reqEmitter;
    };

    const result = await httpTransport(
      new URL("https://careers.example/giant"),
      { address: "93.184.216.34", family: 4 }
    );
    assert.equal(result.success, false);
    assert.match(result.error, /Response body exceeds allowed size limit \(512 KB\)/);
    assert.equal(destroyedCalled, true);
  } finally {
    https.request = origRequest;
  }
});

test("httpTransport destroys stream immediately upon unsupported content-type", async () => {
  const origRequest = https.request;
  try {
    let destroyedCalled = false;
    https.request = (opts, callback) => {
      const reqEmitter = new EventEmitter();
      reqEmitter.end = () => {
        const resStream = new Readable({ read() {} });
        resStream.statusCode = 200;
        resStream.headers = { "content-type": "application/pdf" };
        resStream.destroy = () => {
          destroyedCalled = true;
          resStream.destroyed = true;
          return resStream;
        };
        callback(resStream);
      };
      return reqEmitter;
    };

    const result = await httpTransport(
      new URL("https://careers.example/doc.pdf"),
      { address: "93.184.216.34", family: 4 }
    );
    assert.equal(result.success, false);
    assert.match(result.error, /Unsupported content type "application\/pdf"/);
    assert.equal(destroyedCalled, true);
  } finally {
    https.request = origRequest;
  }
});

test("httpTransport destroys stream on HTTP redirects", async () => {
  const origRequest = https.request;
  try {
    let destroyedCount = 0;
    https.request = (opts, callback) => {
      const reqEmitter = new EventEmitter();
      reqEmitter.end = () => {
        const resStream = new Readable({ read() {} });
        resStream.statusCode = 302;
        resStream.headers = { location: "https://careers.example/target" };
        resStream.destroy = () => {
          destroyedCount++;
          resStream.destroyed = true;
          return resStream;
        };
        callback(resStream);
      };
      return reqEmitter;
    };

    const result = await httpTransport(
      new URL("https://careers.example/redirect"),
      { address: "93.184.216.34", family: 4 }
    );
    assert.equal(result.isRedirect, true);
    assert.equal(destroyedCount, 1);
  } finally {
    https.request = origRequest;
  }
});

test("fetchJobDescription enforces strict unified deadline across stalled response", async () => {
  const mockDns = async () => [{ address: "93.184.216.34", family: 4 }];
  const stalledTransport = () =>
    new Promise((resolve) => setTimeout(() => resolve({ success: true, html: "done" }), 800));

  const started = Date.now();
  const result = await fetchJobDescription("https://public.example/stalled", { timeoutMs: 100 }, {
    dnsResolver: mockDns,
    transport: stalledTransport,
  });
  const elapsed = Date.now() - started;

  assert.equal(result.success, false);
  assert.match(result.error, /timed out/);
  assert.ok(elapsed < 600);
});

test("fetchJobDescription races DNS resolution against deadline and aborts before transport", async () => {
  let transportCalled = false;
  const delayedDns = () =>
    new Promise((resolve) =>
      setTimeout(() => resolve([{ address: "93.184.216.34", family: 4 }]), 250)
    );
  const fastTransport = async () => {
    transportCalled = true;
    return { success: true, html: "<body>Should not be called</body>" };
  };

  const started = Date.now();
  const result = await fetchJobDescription(
    "https://public.example/slow-dns",
    { timeoutMs: 30 },
    { dnsResolver: delayedDns, transport: fastTransport }
  );
  const elapsed = Date.now() - started;

  assert.equal(result.success, false);
  assert.match(result.error, /timed out/);
  assert.equal(transportCalled, false);
  assert.ok(elapsed < 200, `Expected elapsed < 200ms, got ${elapsed}ms`);
});


