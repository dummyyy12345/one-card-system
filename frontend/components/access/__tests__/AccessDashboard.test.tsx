import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import apiClient from "@/store/apiClient";
import AccessDashboard from "../AccessDashboard";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  get.mockImplementation((path: string) =>
    Promise.resolve({
      data: path.endsWith("/events")
        ? { data: [] }
        : { data: { allowed: 2, denied: 1 } },
    })
  );
});

it("checks a card, clears the input, and refreshes the audit summary", async () => {
  post.mockResolvedValue({
    data: {
      decision: "allowed",
      reason: "eligible",
      student: { name: "Ada Example", student_id: "ST1" },
    },
  });
  render(<AccessDashboard location="cafeteria" />);

  expect(await screen.findByText("2")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Station"), {
    target: { value: "North" },
  });
  fireEvent.change(screen.getByLabelText("Card number"), {
    target: { value: "CARD-1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check card" }));

  await waitFor(() =>
    expect(post).toHaveBeenCalledWith("/api/v1/access/check", {
      card_number: "CARD-1",
      location: "cafeteria",
      station: "North",
    })
  );
  expect(await screen.findByRole("status")).toHaveTextContent("Access allowed");
  expect(screen.getByLabelText("Card number")).toHaveValue("");
  expect(get).toHaveBeenCalledWith("/api/v1/access/events", {
    params: { location: "cafeteria" },
  });
});

it("shows history without a card entry form", async () => {
  render(<AccessDashboard location="gate" historyOnly />);
  expect(
    await screen.findByText("No decisions recorded yet.")
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Check card" })).toBeNull();
});
