import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import AccessRulesPage from "../page";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock("@/lib/errorReporter", () => ({ reportError: jest.fn() }));

const policy = {
  location: "gate",
  enabled: true,
  require_assignment: true,
  start_minute: 0,
  end_minute: 1440,
  weekdays: "1111111",
  version: 2,
};
const exception = {
  id: 4,
  student_id: 12,
  location: "gate",
  expires_at: "2026-11-01T12:00:00Z",
  reason: "Temporary assignment",
};
const operations = {
  device_jobs: [{ status: "pending", count: 2 }],
  device_status: [
    {
      device_id: 9,
      name: "North gate",
      location: "gate",
      out_of_sync: 1,
      missing_jobs: 0,
      last_confirmed_at: null,
    },
  ],
  source_sync: { last_success_at: null, last_failure_at: null },
};

function mockLoad() {
  (apiClient.get as jest.Mock).mockImplementation((url: string) => {
    const data = url.endsWith("/policies")
      ? [policy]
      : url.endsWith("/exceptions")
        ? [exception]
        : url.endsWith("/operations")
          ? operations
          : [{ id: 1, student_id: 12, actor_id: 3, viewed_at: "2026-10-01" }];
    return Promise.resolve({ data: { data } });
  });
  (apiClient.put as jest.Mock).mockResolvedValue({ data: {} });
  (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });
  (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockLoad();
});

it("saves changed hours and weekdays, then grants, revokes and reconciles", async () => {
  render(<AccessRulesPage />);
  const save = await screen.findByRole("button", { name: "Save gate policy" });
  const card = save.parentElement as HTMLElement;

  fireEvent.click(within(card).getByLabelText("Open"));
  fireEvent.click(within(card).getByLabelText("Mon"));
  fireEvent.change(screen.getByLabelText("gate start time UTC"), {
    target: { value: "08:30" },
  });
  fireEvent.click(save);
  await waitFor(() =>
    expect(apiClient.put).toHaveBeenCalledWith(
      "/api/v1/admin/access/policies/gate",
      expect.objectContaining({
        enabled: false,
        start_minute: 510,
        end_minute: 1440,
        weekdays: "1011111",
      })
    )
  );
  expect(await screen.findByRole("status")).toHaveTextContent("policy saved");

  fireEvent.change(screen.getByLabelText("Student record ID"), {
    target: { value: "12" },
  });
  fireEvent.change(screen.getByLabelText("Exception expiry"), {
    target: { value: "2026-10-30T12:00" },
  });
  fireEvent.change(screen.getByLabelText("Exception reason"), {
    target: { value: "Temporary assignment" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Grant exception" }));
  await waitFor(() =>
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/v1/admin/access/exceptions",
      expect.objectContaining({
        student_id: 12,
        location: "gate",
        reason: "Temporary assignment",
      })
    )
  );

  fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
  await waitFor(() =>
    expect(apiClient.delete).toHaveBeenCalledWith(
      "/api/v1/admin/access/exceptions/4"
    )
  );
  fireEvent.click(screen.getByRole("button", { name: "Reconcile" }));
  await waitFor(() =>
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/v1/admin/access/devices/9/reconcile"
    )
  );
  expect(screen.getByText(/2 device deliveries/)).toBeInTheDocument();
});

it("reports load and save failures without losing the page", async () => {
  (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error("offline"));
  render(<AccessRulesPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load access administration"
  );
  expect(reportError).toHaveBeenCalledWith(
    "access.admin.load",
    expect.any(Error)
  );

  fireEvent.click(screen.getByRole("button", { name: "Refresh status" }));
  const save = await screen.findByRole("button", { name: "Save gate policy" });
  (apiClient.put as jest.Mock).mockRejectedValueOnce(new Error("denied"));
  fireEvent.click(save);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not save policy"
  );
  expect(reportError).toHaveBeenCalledWith(
    "access.admin.policy",
    expect.any(Error)
  );
});
