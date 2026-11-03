import {
  chromium,
  expect,
} from "../../relay/web/node_modules/@playwright/test/index.mjs";
const base = process.env.PORTFOLIO_URL ?? "http://127.0.0.1:5181";
const browser = await chromium.launch();
const date = new Date();
date.setDate(date.getDate() + 3);
const future = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/demo/eateasy/`);
    await expect(page.locator(".card")).toHaveCount(6);
    await page
      .getByRole("searchbox", { name: "Pesquisar restaurantes" })
      .fill("Porto");
    await page.getByRole("button", { name: "Pesquisar", exact: true }).click();
    await expect(page.locator(".card")).toHaveCount(1);
    await page
      .getByRole("searchbox", { name: "Pesquisar restaurantes" })
      .fill("");
    await page.getByRole("button", { name: "Pesquisar", exact: true }).click();
    await page.getByRole("button", { name: "Italiana", exact: true }).click();
    await expect(page.locator(".card")).toHaveCount(2);
    await page
      .getByRole("link", { name: "Reservar", exact: true })
      .first()
      .click();
    await page.getByLabel("Dia", { exact: true }).fill(future);
    await page.getByLabel("Hora", { exact: true }).selectOption("19:30");
    await page.getByLabel("Pessoas", { exact: true }).fill("3");
    await page
      .getByRole("button", { name: "Confirmar reserva", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Reserva confirmada");
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await page.reload();
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await page
      .getByRole("button", {
        name: "Cancelar reserva em Forno & Farinha",
        exact: true,
      })
      .click();
    await expect(page.locator("tbody tr")).toHaveCount(2);
    await page.getByRole("button", { name: "Desfazer", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await page.getByRole("link", { name: "Restaurantes", exact: true }).click();
    await page
      .getByRole("link", { name: "Reservar", exact: true })
      .last()
      .click();
    await page.getByLabel("Dia", { exact: true }).fill(future);
    await page.getByLabel("Hora", { exact: true }).selectOption("20:00");
    await page
      .getByRole("button", { name: "Confirmar reserva", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("Já tem uma reserva");
    await page.getByLabel("Papel na demonstração").selectOption("admin");
    await page
      .getByRole("link", { name: "Novo restaurante", exact: true })
      .click();
    await page
      .getByLabel("Nome", { exact: true })
      .fill("Mesa <Teste> & Amigos");
    await page.getByLabel("Localização", { exact: true }).fill("Aveiro");
    await page.getByLabel("Cozinha", { exact: true }).fill("Portuguesa");
    await page.getByLabel("Preço médio (€)", { exact: true }).fill("17.5");
    await page.getByRole("button", { name: "Guardar restaurante" }).click();
    await expect(
      page.getByRole("heading", { name: "Mesa <Teste> & Amigos", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Mesa <Teste> & Amigos", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight + 1,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    console.log(
      `PASS EatEasy ${width}px: search, cuisine, booking, conflict checks, cancel/undo, persistence and admin creation.`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}
