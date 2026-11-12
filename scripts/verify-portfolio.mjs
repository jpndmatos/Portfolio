import {
  chromium,
  expect,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const screenshotRoot = new URL('../assets/projects/screenshots/', import.meta.url);
const screenshots = JSON.parse(await readFile(new URL('manifest.json', screenshotRoot), 'utf8'));
for (const screenshot of Object.values(screenshots)) {
  const original = await readFile(new URL(screenshot.original, screenshotRoot));
  expect(createHash('sha256').update(original).digest('hex')).toBe(screenshot.sha256);
}
const base = (process.env.PORTFOLIO_URL ?? "http://127.0.0.1:5181").replace(
  /\/$/,
  "",
);
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
try {
  for (const width of [320, 390, 768, 1440]) {
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
    const projects = page.locator('.project-card__title');
    expect((await projects.allTextContents()).slice(0, 6).map(value => value.trim())).toEqual(['Extra Time', 'Split', 'Overlap', 'Image Desk', 'EatEasy', 'Relay']);
    expect(await page.locator('a[href^="demo/"]').count()).toBe(0);
    expect(await page.locator('a[href$="relay-source.zip"]').count()).toBe(0);
    const more = page.getByRole('link', { name: 'More projects on GitHub', exact: true });
    await expect(more).toHaveAttribute('href', 'https://github.com/jpndmatos?tab=repositories');
    await expect(page.locator('.projects-grid > :last-child')).toHaveClass(/project-card--more/);
    await expect(more).toHaveCSS('border-top-style', 'dashed');
    await expect(more.locator('.fluid-frame')).toHaveCount(1);
    await expect(more.locator('.fluid-frame path')).toHaveCSS('stroke-dasharray', '3px, 3px');
    await expect(page.locator('.project-image-link')).toHaveCount(10);
    for (const card of await page.locator('article.project-card').all()) {
      await expect(card.locator('.project-image-link')).toHaveAttribute('href', await card.locator('.project-card__title a').getAttribute('href'));
      await expect(card.locator('.project-image-link')).toHaveAttribute('target', '_blank');
    }
    await expect(page.getByRole('link', {name:'View source: Relay',exact:true})).toHaveAttribute('href','https://github.com/jpndmatos/relay');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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
    await page.getByRole('link', {name:'View projects',exact:false}).click();
    await expect(page.getByRole('heading', {name:'Projects',exact:true})).toBeInViewport();
    await expect(page.locator('.header__link[data-section="projects"]')).toHaveAttribute('aria-current','location');
    await page.goto(`${base}/#projects`);
    await expect(page.getByRole('heading',{name:'Extra Time',exact:true})).toBeInViewport();
    await expect(page.locator('.project-image-link').first()).toHaveAttribute('href', 'https://jpndmatos.github.io/extra-time/');
    await expect(page.locator('.project-viewer')).toHaveCount(0);
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
