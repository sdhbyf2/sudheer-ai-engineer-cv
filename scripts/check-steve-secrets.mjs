import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
const tracked = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
async function walk(dir) {
  let files = [];
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const path = `${dir}/${e.name}`;
    files.push(...(e.isDirectory() ? await walk(path) : [path]));
  }
  return files;
}
const paths = [...new Set([...tracked, ...(await walk("dist"))])];
const patterns = [
  /sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{30,}/,
  /AIza[A-Za-z0-9_-]{30,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
const known = [];
if (process.env.STEVE_TEST_ENV_FILE) {
  const raw = await readFile(process.env.STEVE_TEST_ENV_FILE, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(
      /^(OPENAI_API_KEY|GOOGLE_CLIENT_SECRET|GOOGLE_REFRESH_TOKEN)\s*=\s*(.+)$/,
    );
    if (m) {
      const value = m[2].trim().replace(/^(['"])(.*)\1$/, "$2");
      if (value.length > 15) known.push(value);
    }
  }
}
const findings = [];
for (const path of paths) {
  const raw = await readFile(path).catch(() => null);
  if (!raw) continue;
  const text = raw.toString("utf8");
  if (
    patterns.some((p) => p.test(text)) ||
    known.some((key) => text.includes(key))
  )
    findings.push(path);
}
console.log(
  `Scanned ${paths.length} tracked/unignored files and built assets. Secret findings: ${findings.length}.`,
);
for (const path of findings) console.log("REVIEW FILE:", path);
if (findings.length) process.exitCode = 1;
