import {
  chromium,
  devices,
  expect,
} from "../../relay/web/node_modules/@playwright/test/index.mjs";
import AxeBuilder from "../../relay/web/node_modules/@axe-core/playwright/dist/index.mjs";
const base = (process.env.PORTFOLIO_URL ?? "http://127.0.0.1:5181").replace(
  /\/$/,
  "",
);
const browser = await chromium.launch();
const sizes = [
  [1440, 900],
  [1366, 768],
  [1024, 768],
  [390, 844],
  [390, 664],
  [320, 568],
];
async function fits(page, label) {
  const size = await page.evaluate(() => ({
    height: innerHeight,
    width: innerWidth,
    scrollHeight: document.scrollingElement.scrollHeight,
    scrollWidth: document.scrollingElement.scrollWidth,
  }));
  expect(
    size.scrollHeight,
    `${label}: page height ${JSON.stringify(size)}`,
  ).toBeLessThanOrEqual(size.height + 1);
  expect(size.scrollWidth, `${label}: page width`).toBeLessThanOrEqual(
    size.width + 1,
  );
}
async function pressIfVisible(page, name) {
  const button = page.getByRole("button", { name, exact: true });
  if (await button.isVisible()) await button.click();
}
try {
  for (const [width, height] of sizes) {
    const context = await browser.newContext({
      ...(width <= 390 ? devices["iPhone 13"] : {}),
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const app of ["split", "image-desk", "overlap", "relay", "eateasy"]) {
      await page.goto(`${base}/demo/${app}/`);
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
      if (app === "split") {
        await expect(
          page.getByRole("heading", { name: "Birthday dinner" }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "New event" }),
        ).toBeInViewport({ ratio: 1 });
        await expect(
          page.getByRole("button", { name: "Add expense", exact: true }),
        ).toBeInViewport({ ratio: 1 });
        await pressIfVisible(page, "Repayments");
        await expect(
          page.getByRole("button", { name: "Mark paid" }).first(),
        ).toBeInViewport({ ratio: 1 });
        await fits(page, `${app} repayments ${width}x${height}`);
        await pressIfVisible(page, "Ledger");
      }
      if (app === "image-desk") {
        await expect(
          page.getByRole("button", { name: "Choose images", exact: true }),
        ).toBeInViewport({ ratio: 1 });
        await page.getByRole("button", { name: "Load sample" }).click();
        await expect(page.locator(".studio-stage img")).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Process images" }),
        ).toBeInViewport({ ratio: 1 });
        await pressIfVisible(page, "Export settings");
        await expect(
          page.getByRole("button", { name: "Transform", exact: true }),
        ).toBeInViewport({ ratio: 1 });
        await fits(page, `${app} inspector ${width}x${height}`);
        await pressIfVisible(page, "Preview");
      }
      if (app === "overlap") {
        await expect(
          page.getByRole("button", { name: /Add a city/ }),
        ).toBeInViewport({ ratio: 1 });
        await expect(page.getByLabel("Meeting start time")).toBeInViewport({
          ratio: 1,
        });
        await pressIfVisible(page, "Meeting options");
        await expect(
          page.getByRole("button", { name: "Calendar file" }),
        ).toBeInViewport({ ratio: 1 });
        await fits(page, `${app} options ${width}x${height}`);
        await pressIfVisible(page, "Timeline");
      }
      if (app === "relay") {
        await page
          .getByRole("button", { name: "Explore as commander" })
          .click();
        await expect(page.getByRole("table").first()).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Declare incident", exact: true }),
        ).toBeInViewport({ ratio: 1 });
        await expect(
          page.getByRole("button", { name: "Next page", exact: true }),
        ).toBeInViewport({ ratio: 1 });
        expect(
          (await page.locator(".queue-panel .table-wrap").boundingBox()).height,
        ).toBeGreaterThan(40);
        await page.locator(".incident-link").first().click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).not.toBeVisible();
      }
      if (app === "eateasy") {
        await expect(
          page.getByRole("heading", { name: /Restaurantes/ }).first(),
        ).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Reservar", exact: true }).first(),
        ).toBeInViewport({ ratio: 1 });
        await page
          .getByRole("link", { name: "Reservar", exact: true })
          .first()
          .click();
        await expect(
          page.getByRole("button", { name: "Confirmar reserva", exact: true }),
        ).toBeInViewport({ ratio: 1 });
      }
      await fits(page, `${app} ${width}x${height}`);
      if (width === 1440 || width === 390) {
        const results = await new AxeBuilder({ page })
          .withTags([
            "wcag2a",
            "wcag2aa",
            "wcag21aa",
            "wcag22aa",
            "best-practice",
          ])
          .analyze();
        expect(
          results.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
          `${app} accessibility ${width}`,
        ).toEqual([]);
      }
      console.log(
        `PASS ${app}: ${width}x${height}, no page scroll, primary actions visible.`,
      );
    }
    expect(errors).toEqual([]);
    await context.close();
  }
} finally {
  await browser.close();
}
