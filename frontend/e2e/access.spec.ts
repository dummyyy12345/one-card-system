import { expect, test, type Page } from "@playwright/test";

test("frontend health endpoint responds without login", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({ status: "ok", service: "frontend" });
});

async function mockLogin(page: Page, roleName: string, roleID: number) {
  await page.route("**/api/v1/user/login", async (route) => {
    await route.fulfill({
      json: {
        data: {
          ID: 7,
          first_name: "Ada",
          role_id: roleID,
          role: { ID: roleID, role_name: roleName },
        },
      },
    });
  });
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("example-password");
  await page.getByRole("button", { name: /log in|login/i }).click();
}

test("admin updates a location policy and grants a temporary exception", async ({
  page,
}) => {
  const policies = ["gate", "cafeteria", "dormitory", "library"].map(
    (location) => ({
      location,
      enabled: true,
      require_assignment: true,
      start_minute: 0,
      end_minute: 1440,
      weekdays: "1111111",
      version: 0,
    })
  );
  const exceptions: {
    id: number;
    student_id: number;
    location: string;
    expires_at: string;
    reason: string;
  }[] = [];
  await page.route("**/api/v1/admin/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (
      path.endsWith("/access/policies") &&
      route.request().method() === "GET"
    ) {
      await route.fulfill({ json: { data: policies } });
    } else if (
      path.includes("/access/policies/") &&
      route.request().method() === "PUT"
    ) {
      const updated = route.request().postDataJSON();
      const index = policies.findIndex(
        (policy) => policy.location === updated.location
      );
      policies[index] = { ...updated, version: 1 };
      await route.fulfill({ json: { data: policies[index] } });
    } else if (
      path.endsWith("/access/exceptions") &&
      route.request().method() === "POST"
    ) {
      const created = { ...route.request().postDataJSON(), id: 1 };
      exceptions.push(created);
      await route.fulfill({ status: 201, json: { data: created } });
    } else if (path.endsWith("/access/exceptions")) {
      await route.fulfill({ json: { data: exceptions } });
    } else if (path.endsWith("/access/operations")) {
      await route.fulfill({
        json: {
          data: {
            device_jobs: [{ status: "failed", count: 2 }],
            device_status: [
              {
                device_id: 1,
                name: "North gate reader",
                location: "gate",
                out_of_sync: 2,
                missing_jobs: 0,
                last_confirmed_at: null,
              },
            ],
            source_sync: { last_success_at: null, last_failure_at: null },
          },
        },
      });
    } else if (path.endsWith("/access/student-views")) {
      await route.fulfill({ json: { data: [] } });
    } else {
      await route.fulfill({ json: { data: {} } });
    }
  });
  await mockLogin(page, "Admin", 1);
  await page.getByText("Access rules", { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Access rules and operations" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Save gate policy" }).click();
  await expect(page.getByText("gate policy saved.")).toBeVisible();
  await page.getByLabel("Student record ID").fill("42");
  await page
    .getByLabel("Exception expiry")
    .fill(
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    );
  await page
    .getByLabel("Exception reason")
    .fill("Temporary residence assignment");
  await page.getByRole("button", { name: "Grant exception" }).click();
  await expect(
    page.getByText(/Student 42.*Temporary residence assignment/)
  ).toBeVisible();
  await expect(page.getByText("failed: 2 device deliveries")).toBeVisible();
  await page.getByRole("button", { name: "Reconcile" }).click();
  await expect(page.getByText("Device 1 reconciliation queued.")).toBeVisible();
});

test("gate operator checks a card and sees the audit result", async ({
  page,
}) => {
  const events: {
    id: number;
    created_at: string;
    station: string;
    decision: string;
    reason: string;
  }[] = [];
  await page.route("**/api/v1/access/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/check")) {
      const body = route.request().postDataJSON();
      events.push({
        id: 1,
        created_at: new Date().toISOString(),
        station: body.station,
        decision: "allowed",
        reason: "eligible",
      });
      await route.fulfill({
        json: {
          decision: "allowed",
          reason: "eligible",
          event_id: 1,
          student: { name: "Ada Example", student_id: "ST1" },
        },
      });
    } else if (path.endsWith("/events")) {
      await route.fulfill({ json: { data: events } });
    } else {
      await route.fulfill({
        json: { data: { allowed: events.length, denied: 0 } },
      });
    }
  });
  await mockLogin(page, "Gate", 3);
  await expect(
    page.getByRole("heading", { name: "Gate access" })
  ).toBeVisible();
  await page.getByLabel("Station").fill("North entrance");
  await page.getByLabel("Card number").fill("12345678");
  await page.getByRole("button", { name: "Check card" }).click();
  await expect(page.locator('p[role="status"]')).toContainText(
    "Access allowed"
  );
  await expect(page.getByText("North entrance", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Card number")).toHaveValue("");
});
