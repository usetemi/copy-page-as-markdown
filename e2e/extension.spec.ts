import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";
import { chromium, expect, test, type BrowserContext, type CDPSession, type Page } from "@playwright/test";

const dist = resolve("dist");

const PAGE = `<!doctype html>
<title>Fixture page</title>
<h1>Hello</h1>
<details><summary>More</summary><p>Collapsed text</p></details>
<a href="/docs">Docs</a>
<table class="wide"><tr><td>Cell</td></tr></table>
<img alt="Chart" src="data:image/png;base64,AAAA">
<iframe src="about:blank"></iframe>
<script>document.body.append(Object.assign(document.createElement("p"), { textContent: "Rendered by JavaScript" }));</script>`;

let server: Server;
let origin: string;
let context: BrowserContext;
let browserSession: CDPSession;

test.beforeAll(async () => {
  server = createServer((request, response) => {
    if (request.url === "/blocked") {
      response.setHeader("Permissions-Policy", "clipboard-write=()");
    }
    response.setHeader("Content-Type", "text/html");
    response.end(PAGE);
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    args: [
      `--disable-extensions-except=${dist}`,
      `--load-extension=${dist}`,
      "--enable-unsafe-extension-debugging",
      "--host-resolver-rules=MAP insecure.test 127.0.0.1",
    ],
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  browserSession = await context.browser()!.newBrowserCDPSession();
});

test.afterAll(async () => {
  await context.close();
  await new Promise((done) => server.close(done));
});

async function extensionId(): Promise<string> {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  return new URL(worker.url()).host;
}

// Extensions.triggerAction is the toolbar click, so it grants activeTab the way a person does.
async function clickToolbarIcon(page: Page): Promise<void> {
  const { targetInfos } = await browserSession.send("Target.getTargets", {
    filter: [{ type: "tab" }],
  });
  const target = targetInfos.find((info) => info.url === page.url());
  await browserSession.send("Extensions.triggerAction", {
    id: await extensionId(),
    targetId: target!.targetId,
  });
}

async function copyFrom(url: string): Promise<string> {
  const reader = await context.newPage();
  await reader.goto(`${origin}/reader`);
  await reader.evaluate(() => navigator.clipboard.writeText("sentinel"));

  const page = await context.newPage();
  await page.goto(url);
  await clickToolbarIcon(page);

  const read = () => reader.evaluate(() => navigator.clipboard.readText());
  await expect.poll(read).not.toBe("sentinel");
  const markdown = await read();
  await reader.close();
  await page.close();
  return markdown;
}

test("copies the rendered page as Markdown", async () => {
  const markdown = await copyFrom(`${origin}/page`);

  expect(markdown.startsWith(`# Fixture page\n\nSource: ${origin}/page\n\n`)).toBe(true);
  expect(markdown).toContain("# Hello");
  expect(markdown).toContain("Collapsed text");
  expect(markdown).toContain(`[Docs](${origin}/docs)`);
  expect(markdown).toContain("<table><tbody><tr><td>Cell</td></tr></tbody></table>");
  expect(markdown).toContain("Chart");
  expect(markdown).toContain("Rendered by JavaScript");
  expect(markdown).not.toContain("base64");
  expect(markdown.endsWith("> Note: omitted 1 iframe, 1 embedded image.")).toBe(true);
});

test("copies from a page whose policy blocks the clipboard", async () => {
  expect(await copyFrom(`${origin}/blocked`)).toContain(`Source: ${origin}/blocked`);
});

test("copies from an insecure page, which has no clipboard API", async () => {
  const url = `http://insecure.test:${new URL(origin).port}/page`;
  expect(await copyFrom(url)).toContain(`Source: ${url}`);
});

test("copies again after a repeat press", async () => {
  const page = await context.newPage();
  await page.goto(`${origin}/page`);
  await page.evaluate(() => navigator.clipboard.writeText("sentinel"));
  await Promise.all([clickToolbarIcon(page), clickToolbarIcon(page)]);
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("/page");
  await page.close();
  expect(await copyFrom(`${origin}/blocked`)).toContain("/blocked");
});
