import { test, expect } from "@playwright/test";

test.describe("Causal inference dashboard", () => {
  test("loads and shows the headline and summary cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Did the feature actually drive GMV",
    );
    await expect(page.getByTestId("summary-cards")).toBeVisible();
    await expect(page.getByTestId("summary-cards").getByText("Naive pooled TWFE")).toBeVisible();
  });

  test("shows all three cohort-specific event study panels", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/early cohort/i).first()).toBeVisible();
    await expect(page.getByText(/mid cohort/i).first()).toBeVisible();
    await expect(page.getByText(/late cohort/i).first()).toBeVisible();
  });

  test("renders the propensity score matching balance table", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Propensity score matching/i })).toBeVisible();
    await expect(page.getByRole("cell", { name: "pre_gmv_mean" })).toBeVisible();
  });

  test("health check endpoint responds ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  test("results API returns the expected shape", async ({ request }) => {
    const res = await request.get("/api/results");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("cohortAtt");
    expect(body.cohortAtt.length).toBe(3);
  });
});
