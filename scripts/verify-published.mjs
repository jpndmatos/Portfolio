// Verify independent demo pages and source downloads after deployment.
import {
  chromium,
  expect,
} from "../../relay/web/node_modules/@playwright/test/index.mjs";
const base = (
  process.env.SITE_URL ?? "https://jpndmatos.github.io/Portfolio"
).replace(/\/$/, "");
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/#projects`);
  await expect(page.getByRole("link", { name: "Try demo" })).toHaveCount(5);
  const source = await page.request.get(
    `${base}/assets/downloads/relay-source.zip`,
  );
  expect(source.status()).toBe(200);
  expect((await source.body()).subarray(0, 2).toString()).toBe("PK");
  for (const app of ["split", "image-desk", "overlap", "relay", "eateasy"]) {
    const response = await page.goto(`${base}/demo/${app}/`);
    expect(response.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    if (app === "split")
      await expect(
        page.getByRole("heading", { name: "Birthday dinner" }),
      ).toBeVisible();
    if (app === "relay") {
      await page.getByRole("button", { name: "Explore as commander" }).click();
      await expect(page.getByRole("table").first()).toBeVisible();
      await expect(
        page.getByRole("combobox", { name: "Color theme" }),
      ).toHaveCount(0);
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await expect(page.getByRole("link", { name: /portfolio/i })).toHaveCount(0);
    console.log(
      `PASS published ${app}: loads, fits mobile and has no portfolio return link.`,
    );
  }
  expect(errors).toEqual([]);
  await context.close();
} finally {
  await browser.close();
}
