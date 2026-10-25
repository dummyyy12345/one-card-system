import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import reducer, {
  DeviceRecieved,
  handleCreateDevice,
  handleFetchDevice,
} from "../device";

jest.mock("axios");
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const device: DeviceRecieved = {
  ID: 4,
  CreatedAt: new Date(),
  UpdatedAt: new Date(),
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
    (axios as jest.MockedFunction<typeof axios>).mockResolvedValueOnce({
      data: { data: [device] },
    });
    const store = configureStore({ reducer });
    const action = await store.dispatch(handleFetchDevice());
    expect(handleFetchDevice.fulfilled.match(action)).toBe(true);
    expect(store.getState().devices).toEqual([device]);
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", withCredentials: true })
    );
  });
});
