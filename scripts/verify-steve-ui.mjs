import { chromium, firefox, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:5293";
const preview = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "5293",
    "--strictPort",
  ],
  { stdio: "pipe" },
);
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  await mkdir("tmp/steve", { recursive: true });
  for (const [engine, browserType] of Object.entries({
    chromium,
    firefox,
    webkit,
  })) {
    const browser = await browserType.launch({ headless: true });
    try {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      let chats = 0,
        sessionCalls = 0,
        confirmations = 0,
        failChat = false;
      await page.route("**/api/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        const body = route.request().postDataJSON();
        const reply = (data) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(data),
          });
        if (path.endsWith("/session")) {
          sessionCalls++;
          return reply({
            ready: true,
            contractVersion: 2,
            capabilities: {
              text: true,
              search: true,
              voice: false,
              booking: true,
            },
          });
        }
        if (path.endsWith("/chat")) {
          chats++;
          if (failChat) {
            failChat = false;
            return route.fulfill({
              status: 503,
              contentType: "application/json",
              body: JSON.stringify({ error: "Temporary test failure" }),
            });
          }
          const message = {
            id: "answer-" + chats,
            role: "assistant",
            content: "Sudheer built the School ERP assistant [rag].",
            evidence: [
              {
                id: "rag",
                title: "School management ERP assistant",
                facts: "Sole developer; PostgreSQL and pgvector.",
                source: "Portfolio",
                url: "/#project-rag",
              },
            ],
            sources: [],
            roleComparison:
              body.mode === "role"
                ? [
                    {
                      category: "Documented match",
                      requirement: "React",
                      detail: "React is documented.",
                      evidenceIds: ["rag"],
                    },
                    {
                      category: "Not documented",
                      requirement: "Kubernetes certification",
                      detail: "Not documented.",
                      evidenceIds: [],
                    },
                  ]
                : [],
          };
          return route.fulfill({
            status: 200,
            contentType: "text/event-stream",
            body: `event: answer_delta\ndata: ${JSON.stringify({ delta: message.content })}\n\nevent: answer_complete\ndata: ${JSON.stringify({ message })}\n\n`,
          });
        }
        if (path.endsWith("/slots"))
          return reply({
            slots: [
              {
                bookingId: "test-booking",
                token: "test-slot",
                start: "2026-10-10T13:00:00Z",
                end: "2026-10-10T13:20:00Z",
                label: "Saturday 10 October, 14:00",
              },
            ],
          });
        if (path.endsWith("/confirm")) {
          confirmations++;
          return reply({
            bookingId: "test-booking",
            status: "pending",
            message: "Checking the outcome.",
          });
        }
        if (path.endsWith("/status"))
          return reply({
            bookingId: "test-booking",
            status: "confirmed",
            start: "2026-10-10T13:00:00Z",
            calendarUrl: "https://calendar.google.com/event",
            meetUrl: "",
            invitation: "Invitation requested from Google.",
          });
        return reply({ ended: true });
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator(".steve-launcher").click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Close Steve" }),
      ).toBeFocused();
      await page
        .getByRole("button", { name: "Experience", exact: true })
        .click();
      await expect(page.locator(".steve-message.assistant")).toContainText(
        "School ERP",
      );
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
      await expect(page.locator(".steve-launcher")).toBeFocused();
      await page.locator(".steve-launcher").click();
      await expect(page.locator(".steve-message.assistant")).toHaveCount(1);
      expect(sessionCalls).toBe(1);
      failChat = true;
      await page
        .getByLabel("Message Steve", { exact: true })
        .fill("Tell me more");
      await page
        .getByRole("button", { name: "Send message", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Retry answer" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Retry answer" }).click();
      await expect(page.locator(".steve-message.assistant")).toHaveCount(2);
      await page
        .getByRole("button", { name: "Discuss a role", exact: true })
        .click();
      await page
        .getByLabel("Job description", { exact: true })
        .fill("React developer with Kubernetes certification (recruiter: sarah@company.com)");
      await page
        .getByRole("button", { name: "Send message", exact: true })
        .click();
      await expect(page.locator(".steve-role-comparison")).toContainText(
        "Not documented",
      );
      await page.getByRole("button", { name: "Expand panel" }).click();
      await expect(page.locator(".steve-panel")).toHaveClass(/is-expanded/);
      await page
        .getByRole("button", { name: "Book a 20-minute call", exact: true })
        .click();
      await page.getByRole("button", { name: /Saturday 10 October/ }).click();
      await page.getByLabel(/Your name/).fill("Test Visitor");
      await page.getByLabel("Email for invitation").fill("test@example.com");
      await page
        .getByRole("button", { name: "Confirm booking", exact: true })
        .click();
      await expect(
        page.getByText("Booking outcome pending", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Confirm booking", exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "Check booking status", exact: true })
        .click();
      await expect(
        page.getByText("Appointment confirmed", { exact: true }),
      ).toBeVisible();
      expect(confirmations).toBe(1);
      await expect(
        page.getByText("Google has not supplied a Meet link yet.", {
          exact: false,
        }),
      ).toBeVisible();
      const axe = await new AxeBuilder({ page })
        .include(".steve-panel")
        .analyze();
      await writeFile(
        `tmp/steve/axe-${engine}.json`,
        JSON.stringify(axe.violations, null, 2),
      );
      expect(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
      await page.screenshot({ path: `tmp/steve/${engine}-desktop.png` });
      await page.setViewportSize({ width: 390, height: 740 });
      await page
        .getByRole("button", { name: "Clear conversation", exact: true })
        .first()
        .click();
      await expect(page.locator(".steve-message")).toHaveCount(0);
      expect(
        await page
          .locator(".steve-panel")
          .evaluate((n) => n.scrollWidth <= n.clientWidth),
      ).toBe(true);
      await page.screenshot({ path: `tmp/steve/${engine}-mobile.png` });
      await page.getByRole("button", { name: "Close Steve" }).click();
      await page.locator(".project-more").first().click();
      const projectButton = page.locator(".ask-project").first();
      await projectButton.click();
      await page.getByRole("button", { name: "Explain this project" }).click();
      await expect(page.locator(".steve-message.assistant")).toHaveCount(1);
      expect(errors).toEqual([]);
      console.log(
        `PASS ${engine}: persistence, retry, role cards, booking recovery, focus, mobile, project action, axe`,
      );
      await context.close();
    } finally {
      await browser.close();
    }
  }
} finally {
  preview.kill();
}
