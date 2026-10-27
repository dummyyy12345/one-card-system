import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import apiClient from "@/store/apiClient";
import StudentSyncStatus from "../StudentSyncStatus";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

it("shows a failed delivery and queues a retry", async () => {
  const get = apiClient.get as jest.Mock;
  const post = apiClient.post as jest.Mock;
  get.mockResolvedValue({
    data: {
      data: [{ ID: 5, device_id: 7, status: "failed", attempts: 2 }],
    },
  });
  post.mockResolvedValue({ data: { queued: 1 } });
  render(<StudentSyncStatus studentId={12} />);

  fireEvent.click(screen.getByRole("button", { name: "Device sync" }));
  expect(await screen.findByText(/Device 7: failed/)).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Retry failed deliveries" })
  );
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith("/api/v1/registrar/student/12/sync/retry")
  );
  expect(get).toHaveBeenCalledWith("/api/v1/registrar/student/12/sync");
});
