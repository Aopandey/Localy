import { test, expect } from "@playwright/test";

test("customer discovery becomes a booking and persists without duplicate revenue", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByTestId("booking-count")).toHaveText("2");
  await expect(page.getByTestId("revenue-total")).toHaveText("$170");
  await page.getByRole("link", { name: "Explore your community" }).click();
  await page
    .locator(".feed-post")
    .first()
    .getByRole("link", { name: "View Opportunity" })
    .click();
  await expect(
    page.getByRole("heading", { name: "AI Intent Analysis" }),
  ).toBeVisible();
  await expect(page.locator(".match-score-ring")).toContainText("96%");
  await expect(page.locator(".analysis-fields")).toContainText(
    "Golden Retriever",
  );
  await expect(page.locator(".matched-service")).toContainText("$85");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const response = page.getByRole("textbox", { name: "Edit your response" });
  await response.fill((await response.inputValue()) + " Happy to help!");
  await page.getByRole("button", { name: "Done editing" }).click();
  await page.getByRole("button", { name: "Approve & Send" }).click();
  await expect(page.locator(".chat-messages")).toContainText("Happy to help!");
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Simulate next reply" }).click();
    await expect(page.locator(".message-customer")).toHaveCount(i + 2);
  }
  await expect(
    page.getByRole("heading", { name: "Booking Ready" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm Booking" }).click();
  await expect(
    page.getByRole("heading", { name: "Booking Confirmed" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View Bookings", exact: true }).click();
  await expect(
    page.locator("tbody tr").filter({ hasText: "Alex" }),
  ).toContainText("3:00 PM");
  await expect(
    page.locator("tbody tr").filter({ hasText: "Alex" }),
  ).toContainText("Confirmed");
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.getByTestId("booking-count")).toHaveText("3");
  await expect(page.getByTestId("revenue-total")).toHaveText("$255");
  await page.reload();
  await expect(page.getByTestId("revenue-total")).toHaveText("$255");
  await page.goto("/business");
  await expect(page.locator(".availability-preview")).not.toContainText(
    "3:00 PM",
  );
  await page.goto("/opportunities/opp_001");
  await page.getByRole("link", { name: "Open conversation" }).click();
  await expect(
    page.getByRole("button", { name: "Confirm Booking" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("guided demo advances all seven steps", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Demo Mode" }).click();
  const guide = page.getByRole("region", { name: "Guided demo" });
  await expect(guide).toContainText("STEP 1 OF 7");
  for (const label of [
    "View opportunity",
    "See business match",
    "Review response",
    "Approve & send",
  ]) {
    await guide.getByRole("button", { name: label, exact: true }).click();
  }
  for (let i = 0; i < 3; i++) {
    await guide
      .getByRole("button", { name: "Simulate next reply", exact: true })
      .click();
    await expect(page.locator(".message-customer")).toHaveCount(i + 2);
  }
  await guide
    .getByRole("button", { name: "Confirm booking", exact: true })
    .click();
  await expect(page.getByTestId("revenue-total")).toHaveText("$255");
  await guide.getByRole("button", { name: "Finish demo", exact: true }).click();
  await expect(guide).toHaveCount(0);
});

test("filters, ignore/restore, business editing and reset work", async ({
  page,
}) => {
  await page.goto("/opportunities/opp_001");
  await page.getByRole("button", { name: "Ignore", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Restore opportunity" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restore opportunity" }).click();
  await expect(
    page.getByRole("button", { name: "Approve & Send" }),
  ).toBeVisible();
  await page.goto("/opportunities");
  await page
    .getByRole("textbox", { name: "Search opportunities" })
    .fill("golden");
  await expect(page.locator(".opportunity-card")).toHaveCount(2);
  await page.goto("/business");
  await page
    .getByRole("textbox", { name: "Business name", exact: true })
    .fill("Cambridge Groom Studio");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Business name", exact: true }),
  ).toHaveValue("Cambridge Groom Studio");
  await page.goto("/settings");
  await page.getByRole("switch", { name: "Enable Reddit" }).click();
  await page.goto("/community");
  await expect(
    page.locator(".feed-post").filter({ hasText: "Jamie Chen" }),
  ).toHaveCount(0);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Reset sample workspace" }).click();
  await page.getByRole("button", { name: "Restore sample workspace" }).click();
  await page.goto("/");
  await expect(page.getByTestId("revenue-total")).toHaveText("$170");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Cambridge Pet Groomers",
  );
});

test("mobile navigation and every page fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByTestId("revenue-total")).toHaveText("$170");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Community Feed", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Community Feed" }),
  ).toBeVisible();
  for (const route of [
    "/",
    "/opportunities",
    "/opportunities/opp_001",
    "/community",
    "/conversations",
    "/bookings",
    "/business",
    "/settings",
  ]) {
    await page.goto(route);
    await expect(page.locator(".loading-state")).toHaveCount(0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, route).toBe(false);
  }
});
