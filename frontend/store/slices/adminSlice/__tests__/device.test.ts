import { configureStore } from "@reduxjs/toolkit";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import reducer, {
  DeviceRecieved,
  handleCreateDevice,
  handleDeleteDevice,
  handleFetchDevice,
  handleUpdateDevice,
  resetDeviceCreateSuccess,
  resetDeviceDeleteSuccess,
  resetDeviceUpdateSuccess,
} from "../device";

jest.mock("@/store/apiClient", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/lib/errorReporter", () => ({ reportError: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const device: DeviceRecieved = {
  ID: 4,
  CreatedAt: "2026-01-01T00:00:00Z" as unknown as Date,
  UpdatedAt: "2026-01-01T00:00:00Z" as unknown as Date,
  DeletedAt: null,
  name: "Main gate",
  serial_number: "SN-4",
  ip_address: "127.0.0.1",
  port: 80,
  location: "North",
};

const createInput = {
  name: device.name,
  serial_number: device.serial_number,
  ip_address: device.ip_address,
  port: device.port,
  location: device.location,
};

beforeEach(() => jest.clearAllMocks());

describe("device slice", () => {
  it("tracks fetch pending, fulfilled, and rejected state", () => {
    const pending = reducer(undefined, handleFetchDevice.pending("fetch"));
    expect(pending.isDeviceLoading).toBe(true);
    expect(pending.isDeviceError).toBeNull();

    const fulfilled = reducer(
      pending,
      handleFetchDevice.fulfilled({ data: [device] }, "fetch")
    );
    expect(fulfilled.devices).toEqual([device]);
    expect(fulfilled.isDeviceLoading).toBe(false);

    const rejected = reducer(
      pending,
      handleFetchDevice.rejected(new Error("network unavailable"), "fetch")
    );
    expect(rejected.devices).toEqual([]);
    expect(rejected.isDeviceLoading).toBe(false);
    expect(rejected.isDeviceError).toBe("network unavailable");
  });

  it("adds a created device and records create errors", () => {
    const pending = reducer(
      undefined,
      handleCreateDevice.pending("create", createInput)
    );
    expect(pending.isDeviceCreateLoading).toBe(true);

    const fulfilled = reducer(
      pending,
      handleCreateDevice.fulfilled({ data: device }, "create", createInput)
    );
    expect(fulfilled.devices).toEqual([device]);
    expect(fulfilled.isDeviceCreateSuccess).toBe(true);
    expect(fulfilled.isDeviceCreateLoading).toBe(false);

    const rejected = reducer(
      pending,
      handleCreateDevice.rejected(
        new Error("invalid device"),
        "create",
        createInput
      )
    );
    expect(rejected.devices).toEqual([]);
    expect(rejected.isDeviceCreateSuccess).toBe(false);
    expect(rejected.isDeviceCreateError).toBe("invalid device");
  });

  it("dispatches a fetch thunk with the server response", async () => {
    (apiClient as jest.MockedFunction<typeof apiClient>).mockResolvedValueOnce({
      data: { data: [device] },
    });
    const store = configureStore({ reducer });
    const action = await store.dispatch(handleFetchDevice());
    expect(handleFetchDevice.fulfilled.match(action)).toBe(true);
    expect(store.getState().devices).toEqual([device]);
    expect(apiClient).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET" })
    );
  });

  it("creates, updates, and deletes a device through the API", async () => {
    const updatedDevice = { ...device, name: "Updated gate" };
    (apiClient as jest.MockedFunction<typeof apiClient>)
      .mockResolvedValueOnce({ data: { data: device } })
      .mockResolvedValueOnce({ data: { data: updatedDevice } })
      .mockResolvedValueOnce({ data: { data: updatedDevice } });
    const store = configureStore({ reducer });

    const created = await store.dispatch(handleCreateDevice(createInput));
    expect(handleCreateDevice.fulfilled.match(created)).toBe(true);
    expect(store.getState().devices).toEqual([device]);
    expect(store.getState().isDeviceCreateSuccess).toBe(true);
    store.dispatch(resetDeviceCreateSuccess());
    expect(store.getState().isDeviceCreateSuccess).toBe(false);

    const updated = await store.dispatch(
      handleUpdateDevice({ ...createInput, id: 4, name: "Updated gate" })
    );
    expect(handleUpdateDevice.fulfilled.match(updated)).toBe(true);
    expect(store.getState().devices).toEqual([updatedDevice]);
    expect(store.getState().isDeviceUpdateSuccess).toBe(true);
    store.dispatch(resetDeviceUpdateSuccess());
    expect(store.getState().isDeviceUpdateSuccess).toBe(false);

    const deleted = await store.dispatch(handleDeleteDevice({ id: 4 }));
    expect(handleDeleteDevice.fulfilled.match(deleted)).toBe(true);
    expect(store.getState().devices).toEqual([]);
    expect(store.getState().isDeviceDeleteSuccess).toBe(true);
    store.dispatch(resetDeviceDeleteSuccess());
    expect(store.getState().isDeviceDeleteSuccess).toBe(false);
    expect(apiClient).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("keeps a failed delete visible to the page", async () => {
    (apiClient as jest.MockedFunction<typeof apiClient>).mockRejectedValueOnce({
      response: { data: { error: "device busy" } },
    });
    const store = configureStore({ reducer });
    const action = await store.dispatch(handleDeleteDevice({ id: 4 }));
    expect(handleDeleteDevice.rejected.match(action)).toBe(true);
    expect(store.getState().isDeviceError).toBe("device busy");
    expect(store.getState().isDeviceDeleteLoading).toBe(false);
    expect(reportError).toHaveBeenCalledWith(
      "device.delete",
      expect.objectContaining({
        response: { data: { error: "device busy" } },
      })
    );
  });
});
