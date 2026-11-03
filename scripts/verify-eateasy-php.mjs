import {
  chromium,
  expect,
} from "../../relay/web/node_modules/@playwright/test/index.mjs";
const base = process.env.EATEASY_PHP_URL ?? "http://127.0.0.1:5190";
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(base);
  await page.getByLabel("Email", { exact: true }).fill("alex@example.test");
  await page.getByLabel("Password", { exact: true }).fill("EatEasy-demo-2026");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Restaurantes", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "Reservar", exact: true })
    .first()
    .click();
  const date = new Date();
  date.setDate(date.getDate() + 3);
  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  await page.getByLabel("Dia", { exact: true }).fill(value);
  await page.getByLabel("Hora", { exact: true }).selectOption("19:30");
  await page.getByLabel("Pessoas", { exact: true }).selectOption("3");
  await expect(
    page.getByRole("button", { name: "Confirmar Reserva", exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await page
    .getByRole("button", { name: "Confirmar Reserva", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "As Minhas Reservas", exact: true }),
  ).toBeVisible();
  await expect(page.locator("tbody")).toContainText("Mesa da Vila");
  await page
    .getByRole("link", { name: "Cancelar", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Reserva cancelada com sucesso.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Terminar Sessão", exact: true })
    .click();
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill("EatEasy-demo-2026");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Painel de Controlo", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Reservas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Gestão de Reservas", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
  console.log(
    "PASS actual PHP app: isolated SQLite sign-in, booking, cancellation, admin access and viewport layout.",
  );
  await context.close();
} finally {
  await browser.close();
}
