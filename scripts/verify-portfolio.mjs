import {
  chromium,
  expect,
} from "../../relay/web/node_modules/@playwright/test/index.mjs";
import AxeBuilder from "../../relay/web/node_modules/@axe-core/playwright/dist/index.mjs";
const base = (process.env.PORTFOLIO_URL ?? "http://127.0.0.1:5181").replace(
  /\/$/,
  "",
);
const browser = await chromium.launch();
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const thirdParty = [];
    page.on("request", (r) => {
      if (new URL(r.url()).origin !== new URL(base).origin)
        thirdParty.push(r.url());
    });
    await page.goto(`${base}/`);
    await page.evaluate(() => document.fonts.ready);
    const initial = await page.locator("#blob-path").getAttribute("d");
    await page.waitForTimeout(250);
    expect(await page.locator("#blob-path").getAttribute("d")).toBe(initial);
    expect(initial.length).toBeGreaterThan(0);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    console.log(
      `PASS portfolio ${width}px: accessibility, static portrait and local fonts.`,
    );
    expect(thirdParty).toEqual([]);
    await context.close();
  }
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`${base}/`);
  await expect(page.locator(".hero__image")).toBeVisible();
  expect(await page.locator("#blob-path").getAttribute("d")).not.toBe("");
  await context.close();
} finally {
  await browser.close();
}
