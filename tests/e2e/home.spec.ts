import { test, expect } from "@playwright/test";

const imageData = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

test.beforeEach(async ({ page }) => {
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

test("browse from home to group to breed", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "AKC Dog Breeds" })).toBeVisible();

  await page.getByRole("link", { name: "Herding Group" }).click();
  await expect(page.getByRole("heading", { name: "Herding Group" })).toBeVisible();

  await page.locator(".breed-card").first().click();
  await page.getByRole("link", { name: "View details →" }).click();
  await expect(page.getByRole("heading", { name: "Australian Cattle Dog" })).toBeVisible();
});
