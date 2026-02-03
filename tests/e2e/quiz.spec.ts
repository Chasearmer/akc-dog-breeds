import { test, expect } from "@playwright/test";

const imageData = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    Math.random = () => 0;
  });

  await page.route("https://dog.ceo/api/**", async route => {
    const url = route.request().url();
    const payload = url.includes("/images/random/")
      ? { status: "success", message: [imageData, imageData] }
      : url.includes("/images/random")
        ? { status: "success", message: imageData }
        : { status: "success", message: [imageData, imageData] };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });

  await page.route("https://en.wikipedia.org/api/rest_v1/page/summary/**", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ thumbnail: { source: imageData } }),
    });
  });
});

test("submit a correct guess", async ({ page }) => {
  await page.goto("/quiz");

  await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  await page.getByPlaceholder("Select breed...").fill("Australian Cattle Dog");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("button", { name: "Next Dog →" })).toBeVisible();
  await expect(page.getByText("1/1")).toBeVisible();
});
