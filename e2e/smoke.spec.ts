import { test, expect } from "@playwright/test";

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("demo login redirects to today", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo@advisorflow.ai");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/today/);
  await expect(page.getByRole("heading", { name: "Today's 5" })).toBeVisible();
});
