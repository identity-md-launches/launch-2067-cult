import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { serve } from "./server.mjs";

const toolsRoot = process.env.CULT_TOOLS || "/tmp/cult-toolchain";
const { chromium } = await import(
  pathToFileURL(join(toolsRoot, "node_modules/playwright/index.mjs")).href
);
await mkdir("artifacts", { recursive: true });
const { server, url } = await serve();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: "reduce" });
  for (const [width, height, file] of [
    [1440, 1000, "artifacts/desktop.png"],
    [390, 844, "artifacts/mobile.png"],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${url}/preview/`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".meme-card").first().waitFor();
    await page.screenshot({ path: file });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${url}/preview/`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".meme-card").first().waitFor();
  await page.screenshot({ path: "artifacts/site-full.jpg", fullPage: true, quality: 80 });
  console.log("Captured the real prelaunch export at 1440px, 390px and full-page. No live-data fixtures used.");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
