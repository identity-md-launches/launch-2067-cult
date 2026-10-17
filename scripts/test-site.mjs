import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";
import { serve } from "./server.mjs";

const toolsRoot = process.env.CULT_TOOLS || "/tmp/cult-toolchain";
const { chromium, webkit } = await import(
  pathToFileURL(join(toolsRoot, "node_modules/playwright/index.mjs")).href
);
const { default: AxeBuilder } = await import(
  pathToFileURL(
    join(toolsRoot, "node_modules/@axe-core/playwright/dist/index.mjs"),
  ).href
);
const output = "test/scratch/site-checks";
await mkdir(output, { recursive: true });
const { server, url } = await serve();
const results = [],
  limitations = [];
let failure;
async function check(name, fn) {
  await fn();
  results.push(name);
  console.log(`PASS ${name}`);
}
const expectText = async (page, selector, text) => {
  await page.locator(selector).filter({ hasText: text }).waitFor();
};

try {
  for (const [name, engine] of [
    ["Chromium", chromium],
    ["WebKit", webkit],
  ]) {
    let browser;
    try {
      browser = await engine.launch({ headless: true });
    } catch (error) {
      if (name === "Chromium") throw error;
      limitations.push(
        `${name} could not launch: ${String(error).split("\n").slice(0, 6).join(" ")}`,
      );
      console.log("LIMITATION WebKit runtime dependencies unavailable.");
      continue;
    }
    try {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        acceptDownloads: true,
      });
      await context.addInitScript(() => {
        window.__copied = "";
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (text) => {
              window.__copied = text;
            },
          },
        });
      });
      const page = await context.newPage();
      await page.clock.install();
      const errors = [],
        resources = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (response.status() >= 400)
          resources.push(`${response.status()} ${response.url()}`);
      });
      let mode = "launching",
        refreshCalls = 0;
      // Test-only synthetic feed. No test address or market figure enters the static export.
      const address = "0x" + randomBytes(20).toString("hex");
      await page.route("**/simd-coin.json", async (route) => {
        refreshCalls++;
        if (mode === "error")
          return route.fulfill({ status: 503, body: "Unavailable" });
        if (mode === "malformed")
          return route.fulfill({
            contentType: "application/json",
            body: "null",
          });
        if (mode === "numeric")
          return route.fulfill({ contentType: "application/json", body: JSON.stringify({market:{marketCap:"12500.50",priceUsd:"0.000000000001",volume24h:null}}) });
        const data =
          mode === "live"
            ? {
                name: "Cult",
                symbol: "CULT",
                token: address,
                status: "live",
                chainName: "Ethereum",
                coinUrl: "https://example.org/test-coin",
                chartUrl: "https://example.org/test-chart",
                logo: `${url}/assets/logos/logo.svg`,
                market: { marketCap: 250000, priceUsd: 0.00025, volume24h: 0 },
              }
            : mode === "unsafe"
              ? {
                  token: "not-an-address",
                  coinUrl: "javascript:alert(1)",
                  chartUrl: "data:text/html,test",
                  market: {
                    marketCap: "invalid",
                    priceUsd: -1,
                    volume24h: null,
                  },
                }
              : { name: "Cult", symbol: "CULT", status: "launching" };
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(data),
        });
      });
      await page.goto(`${url}/preview/`);
      await page.evaluate(() => document.fonts.ready);
      await page.locator(".meme-card").first().waitFor();
      await check(
        `${name}: first screen, section order and honest prelaunch`,
        async () => {
          assert.equal(
            await page.title(),
            "Cult ($CULT) · Only two must believe.",
          );
          assert.equal(
            await page.locator("#contract-address").textContent(),
            "launching…",
          );
          assert(await page.locator("#copy-contract").isDisabled());
          assert(await page.locator("#stats-grid").isHidden());
          const box = await page.locator("[data-buy]").boundingBox();
          assert(box.y + box.height < 844);
          assert.deepEqual(
            await page
              .locator("main > section")
              .evaluateAll((elements) => elements.map((el) => el.id)),
            [
              "cult-summons",
              "cult-credential",
              "how-to-buy",
              "tokenomics",
              "the-legends",
              "cultifacts",
              "share-the-seance",
            ],
          );
          assert.equal(await page.locator(".meme-card").count(), 8);
          assert.equal(await page.locator("canvas").count(), 0);
          for (const selector of [
            'meta[name="description"]',
            'meta[property="og:title"]',
            'meta[property="og:image"]',
            'meta[name="twitter:card"]',
            'link[rel="canonical"]',
            'link[rel="icon"]',
          ])
            assert.equal(await page.locator(selector).count(), 1);
        },
      );
      await check(
        `${name}: navigation, keyboard council, guide and invite`,
        async () => {
          await page.locator("#menu-toggle").click();
          assert.equal(
            await page.locator("#menu-toggle").getAttribute("aria-expanded"),
            "true",
          );
          await page.keyboard.press("Escape");
          assert.equal(
            await page.locator("#menu-toggle").getAttribute("aria-expanded"),
            "false",
          );
          assert.equal(
            await page.evaluate(() => document.activeElement.id),
            "menu-toggle",
          );
          await page.locator("#admission").focus();
          await page.keyboard.press("Enter");
          await page.keyboard.press("Space");
          assert.equal(await page.locator("#knocks").textContent(), "2");
          assert(await page.locator("#admission-note").isVisible());
          assert(
            (await page.locator("#admission-note").textContent()).includes(
              "49,783 rounds",
            ),
          );
          await page.locator('[data-step="1"]').click();
          await expectText(page, "#step-detail", "Get ETH for the journey");
          await page.locator('[data-step="2"]').click();
          await expectText(page, "#step-detail", "Swap on the live coin page");
          assert.equal(
            await page.locator('[data-step="2"]').getAttribute("aria-pressed"),
            "true",
          );
          await page.locator("#open-invite").click();
          assert(await page.locator("#invite-card").isVisible());
          await page.locator("#open-invite").click();
          assert(await page.locator("#invite-card").isHidden());
        },
      );
      await check(`${name}: live feed, links, logo and clipboard`, async () => {
        mode = "live";
        await page.locator("#refresh-stats").click();
        await expectText(page, "#contract-address", address);
        assert.equal(
          await page.locator("[data-buy]").getAttribute("href"),
          "https://example.org/test-coin",
        );
        assert.equal(
          await page.locator("[data-chart]").getAttribute("href"),
          "https://example.org/test-chart",
        );
        await expectText(page, "#volume", "$0");
        assert(await page.locator("#market-cap").isVisible());
        await page.waitForFunction(() =>
          document
            .querySelector(".wordmark img")
            .src.endsWith("/assets/logos/logo.svg"),
        );
        await page.locator("#copy-contract").click();
        assert.equal(await page.evaluate(() => window.__copied), address);
        await page.locator("#copy-link").click();
        assert.equal(
          await page.evaluate(() => window.__copied),
          "https://cult.si-md.xyz/",
        );
        for (let i = 0; i < 3; i++) {
          await page.locator(`[data-share="${i}"]`).click();
          const href = new URL(
            await page.locator("#share-x").getAttribute("href"),
          );
          assert.equal(href.hostname, "x.com");
          assert.equal(
            href.searchParams.get("text"),
            await page.locator("#share-preview").textContent(),
          );
          assert.equal(href.searchParams.get("url"), "https://cult.si-md.xyz/");
        }
        await page.locator("#dismiss-toast").click();
      });
      await check(`${name}: Buy opens supplied destination and bursts confetti`, async () => {
        await context.route("https://example.org/**", route => route.fulfill({contentType:"text/html",body:"<title>Test destination</title>"}));
        const opened=page.waitForEvent("popup");
        await page.locator('[data-buy]').click();
        const popup=await opened;
        await popup.waitForLoadState();
        assert.equal(popup.url(),"https://example.org/test-coin");
        await popup.close();
        // A separate click with navigation suppressed inspects just the visual response.
        await page.locator('[data-buy]').evaluate(el=>el.addEventListener('click',e=>e.preventDefault(),{once:true}));
        await page.locator('[data-buy]').click();
        assert(await page.locator('.confetti').count()>0);
      });
      await check(
        `${name}: refresh failure, recovery, invalid feed and unsafe URLs`,
        async () => {
          mode="numeric";
          await page.locator("#refresh-stats").click();
          await expectText(page,"#price","$1.0000e-12");
          assert(await page.locator('[data-stat="volume24h"]').isHidden());
          mode="live";
          await page.locator("#refresh-stats").click();
          await expectText(page,"#contract-address",address);
          mode = "error";
          await page.locator("#refresh-stats").click();
          await expectText(
            page,
            "#market-status",
            "showing last received data",
          );
          assert.equal(
            await page.locator("#contract-address").textContent(),
            address,
          );
          mode = "malformed";
          await page.locator("#refresh-stats").click();
          await expectText(page, "#market-status", "Update unavailable");
          mode = "unsafe";
          await page.locator("#refresh-stats").click();
          await expectText(page, "#contract-address", "launching…");
          assert.equal(
            await page.locator("[data-buy]").getAttribute("href"),
            "#how-to-buy",
          );
          assert.equal(
            await page.locator("[data-chart]").getAttribute("href"),
            "#cultifacts",
          );
          assert(await page.locator("#stats-grid").isHidden());
          mode = "live";
          await page.locator("#refresh-stats").click();
          await expectText(page, "#contract-address", address);
          // Exercise the real 30-second timer using Playwright's clock, without waiting in real time.
          const before = refreshCalls;
          const poll = page.waitForResponse("**/simd-coin.json");
          await page.clock.fastForward(30050);
          await poll;
          assert(refreshCalls > before);
          await page.clock.resume();
        },
      );
      await check(
        `${name}: eight PNG relic downloads and custom SVG generator`,
        async () => {
          for (let i = 0; i < 8; i++) {
            const promise = page.waitForEvent("download");
            await page.locator(".meme-download").nth(i).click();
            const download = await promise;
            assert.equal(
              download.suggestedFilename(),
              `cult-relic-${i + 1}.png`,
            );
            const file = join(
              output,
              `${name.toLowerCase()}-relic-${i + 1}.png`,
            );
            await download.saveAs(file);
            const bytes = await readFile(file);
            assert.equal(bytes.subarray(1, 4).toString(), "PNG");
            assert.equal(bytes.readUInt32BE(16), 1200);
            assert.equal(bytes.readUInt32BE(20), 1200);
          }
          await page.locator("#dismiss-toast").click();
          await page.locator("#meme-template").selectOption("6");
          await page
            .locator("#meme-top")
            .fill('<script>alert("cult")</script>');
          await page.locator("#meme-bottom").fill("W".repeat(70));
          assert.equal(await page.locator("#meme-preview script").count(), 0);
          assert(
            (await page.locator("#meme-preview").textContent()).includes(
              "<script>",
            ),
          );
          const promise = page.waitForEvent("download");
          await page.locator("#download-meme").click();
          const download = await promise;
          assert.equal(download.suggestedFilename(), "cult-my-evidence.png");
          await download.saveAs(
            join(output, `${name.toLowerCase()}-custom.png`),
          );
          await expectText(page, "#download-feedback", "PNG downloaded");
          await page.locator("#meme-top").fill("ONLY TWO MUST BELIEVE");
          await page.locator("#meme-bottom").fill("I BROUGHT MY ALT");
        },
      );
      await check(
        `${name}: pointer and keyboard sticker; motion pause`,
        async () => {
          const sticker = page.locator("#logo-sticker");
          await sticker.scrollIntoViewIfNeeded();
          await sticker.focus();
          await page.keyboard.press("ArrowLeft");
          assert.notEqual(
            await sticker.evaluate((el) => parseFloat(el.style.translate) || 0),
            0,
          );
          await page.keyboard.press("Home");
          assert.equal(
            await sticker.evaluate((el) => parseFloat(el.style.translate) || 0),
            0,
          );
          const box = await sticker.boundingBox();
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(
            box.x + box.width / 2 - 30,
            box.y + box.height / 2 - 20,
            { steps: 5 },
          );
          await page.mouse.up();
          assert.notEqual(
            await sticker.evaluate((el) => parseFloat(el.style.translate) || 0),
            0,
          );
          await page.locator("#motion-toggle").click();
          assert.equal(
            await page.locator("#motion-toggle").getAttribute("aria-pressed"),
            "true",
          );
          assert(
            await page.evaluate(
              () =>
                document
                  .getAnimations()
                  .filter((a) => a.playState === "running").length === 0,
            ),
          );
          await page.locator("#motion-toggle").click();
        },
      );
      await check(`${name}: responsive export and local assets`, async () => {
        for (const width of [320, 360, 375, 390, 768, 1024, 1440, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          await page.evaluate(() => window.scrollTo(0, 0));
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `${width}px overflows horizontally`,
          );
          assert.equal(
            await page
              .locator("img")
              .evaluateAll(
                (images) =>
                  images.filter(
                    (img) => !img.complete || img.naturalWidth === 0,
                  ).length,
              ),
            0,
          );
          if ([390, 1440].includes(width))
            await page.screenshot({
              path: join(output, `${name.toLowerCase()}-${width}.png`),
            });
        }
        const invalidAnchors = await page
          .locator('a[href^="#"]')
          .evaluateAll((links) =>
            links
              .map((a) => a.getAttribute("href"))
              .filter(
                (href) =>
                  href !== "#" && !document.getElementById(href.slice(1)),
              ),
          );
        assert.deepEqual(invalidAnchors, []);
        await page.emulateMedia({ reducedMotion: "reduce" });
        assert.equal(
          await page.evaluate(
            () =>
              document.getAnimations().filter((a) => a.playState === "running")
                .length,
          ),
          0,
        );
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(
          () => (document.documentElement.style.fontSize = "200%"),
        );
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "200% text-size overflow",
        );
        await page.evaluate(
          () => (document.documentElement.style.fontSize = ""),
        );
        await page.emulateMedia({ reducedMotion: "no-preference" });
      });
      if (name === "Chromium")
        await check("Chromium: axe WCAG 2.2 AA scan", async () => {
          const scan = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          await writeFile(
            join(output, "axe.json"),
            JSON.stringify(
              { violations: scan.violations, incomplete: scan.incomplete },
              null,
              2,
            ),
          );
          assert.equal(
            scan.violations.length,
            0,
            scan.violations
              .map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)
              .join("\n"),
          );
        });
      await check(
        `${name}: 404 at 375 and 1440; no unexpected resource or script failures`,
        async () => {
          for (const width of [375, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(`${url}/preview/404.html`);
            assert(await page.locator("h1").isVisible());
            assert(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
            );
            const home = page.getByRole("link", { name: "Return to Cult" });
            assert.equal(await home.getAttribute("href"), "./index.html");
            await home.click();
            assert.equal(
              await page.title(),
              "Cult ($CULT) · Only two must believe.",
            );
          }
          assert.deepEqual(errors, []);
          assert(
            resources.every(
              (r) => r.includes("/simd-coin.json") && r.startsWith("503"),
            ),
            resources.join("\n"),
          );
        },
      );
      await context.close();
    } finally {
      await browser.close();
    }
  }
} catch (error) {
  failure = error;
  console.error(error);
} finally {
  await new Promise((resolve) => server.close(resolve));
  await writeFile(
    join(output, "results.json"),
    JSON.stringify(
      {
        passed: results.length,
        checks: results,
        limitations,
        failure: failure ? String(failure) : null,
      },
      null,
      2,
    ),
  );
}
if (failure) process.exitCode = 1;
else
  console.log(
    `${results.length} interaction groups passed. ${limitations.length} environment limitations.`,
  );
