import { test, expect, type Page } from "@playwright/test";
import postExample from "../supabase/examples/community-post.json";
import opportunityExample from "../supabase/examples/opportunity.json";

const user = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  aud: "authenticated",
  role: "authenticated",
  email: "localy-test@example.com",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-03T12:00:00Z",
};
const payload = Buffer.from(
  JSON.stringify({
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 3600,
  }),
).toString("base64url");
const session = {
  access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.test-signature`,
  refresh_token: "test-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  user,
};

async function mockProject(page: Page) {
  const state = {
    member: true,
    posts: [
      {
        id: postExample.id,
        data: {
          ...structuredClone(postExample),
          content: "Private Supabase post from our pipeline.",
        },
      },
    ],
    opportunities: [
      {
        id: opportunityExample.id,
        data: {
          ...structuredClone(opportunityExample),
          originalPost: "Private Supabase opportunity from our pipeline.",
        },
      },
    ],
    feedReads: 0,
  };
  // Every Supabase request is intercepted; these tests never create real users/rows.
  await page.routeWebSocket(/supabase\.co\/realtime\//, (socket) =>
    socket.close(),
  );
  await page.route(/https:\/\/[^/]+\.supabase\.co\//, async (route) => {
    const url = new URL(route.request().url());
    let body: unknown;
    if (url.pathname === "/auth/v1/signup") body = { user, session: null };
    else if (url.pathname === "/auth/v1/token") body = session;
    else if (url.pathname === "/auth/v1/user") body = user;
    else if (url.pathname === "/auth/v1/logout") {
      await route.fulfill({ status: 204 });
      return;
    } else if (url.pathname === "/rest/v1/localy_members")
      body = state.member ? [{ workspace_id: "localy" }] : [];
    else if (url.pathname === "/rest/v1/localy_community_posts") {
      state.feedReads++;
      body = state.posts;
    } else if (url.pathname === "/rest/v1/localy_opportunities") {
      state.feedReads++;
      body = state.opportunities;
    } else throw new Error(`Unexpected Supabase request: ${url.pathname}`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  return state;
}
async function signIn(page: Page, path = "/") {
  await page.goto(path);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("localy-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
async function triggerRefresh(page: Page) {
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
}

test("signed-out deep links expose no dashboard and signup requests confirmation", async ({
  page,
}) => {
  const state = await mockProject(page);
  await page.goto("/community");
  await expect(
    page.getByRole("heading", { name: "Welcome back to Localy" }),
  ).toBeVisible();
  await expect(page.locator(".feed-post")).toHaveCount(0);
  expect(state.feedReads).toBe(0);
  await page
    .getByRole("button", { name: "First time here? Create a Localy account" })
    .click();
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("localy-test-password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  expect(state.feedReads).toBe(0);
});

test("approved member reads the feed, keeps session, cannot send outreach, and signs out", async ({
  page,
}) => {
  await mockProject(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await signIn(page, "/community");
  await expect(page.locator(".feed-post")).toHaveCount(1);
  await expect(page.locator(".feed-post")).toContainText(
    "Private Supabase post",
  );
  await page.reload();
  await expect(page.locator(".feed-post")).toHaveCount(1);
  await page
    .getByRole("link", { name: "View Opportunity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Outreach not connected" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Ignore", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back to Localy" }),
  ).toBeVisible();
  await expect(page.locator(".original-post")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome back to Localy" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("a signed-in nonmember is denied before any feed is requested", async ({
  page,
}) => {
  const state = await mockProject(page);
  state.member = false;
  await signIn(page);
  await expect(page.locator(".error-banner")).toContainText(
    "has not been added",
  );
  await expect(
    page.getByRole("heading", { name: "Workspace unavailable" }),
  ).toBeVisible();
  expect(state.feedReads).toBe(0);
  await expect(page.locator(".opportunity-card")).toHaveCount(0);
});

test("empty feeds stay empty and new records appear on refresh", async ({
  page,
}) => {
  const state = await mockProject(page);
  state.posts = [];
  state.opportunities = [];
  await signIn(page);
  await expect(
    page.getByRole("heading", { name: "No opportunities yet" }),
  ).toBeVisible();
  await expect(
    page.locator(".metric-card").first().locator(".metric-value"),
  ).toHaveText("0");
  await expect(page.locator(".metric-card").nth(2)).toContainText(
    "Sample bookings",
  );
  state.opportunities = [
    {
      id: opportunityExample.id,
      data: {
        ...opportunityExample,
        originalPost: "A newly inserted pipeline opportunity.",
      },
    },
  ];
  await triggerRefresh(page);
  await expect(page.locator(".opportunity-card")).toContainText(
    "newly inserted",
  );
  await expect(
    page.locator(".metric-card").first().locator(".metric-value"),
  ).toHaveText("1");
});

test("malformed records report an error without showing sample opportunities", async ({
  page,
}) => {
  const state = await mockProject(page);
  state.opportunities[0].data.match.score = 96;
  await signIn(page);
  await expect(page.locator(".error-banner")).toContainText(
    "does not match the Localy data contract",
  );
  await expect(page.locator(".opportunity-card")).toHaveCount(0);
});

test("revoked membership clears previously loaded data on refresh", async ({
  page,
}) => {
  const state = await mockProject(page);
  await signIn(page, "/community");
  await expect(page.locator(".feed-post")).toHaveCount(1);
  state.member = false;
  await triggerRefresh(page);
  await expect(page.locator(".error-banner")).toContainText(
    "has not been added",
  );
  await expect(page.locator(".feed-post")).toHaveCount(0);
});

test("the private sign-in form fits mobile screens", async ({ page }) => {
  await mockProject(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});
