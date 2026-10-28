import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AxiosRequestConfig } from "axios";
import apiClient from "@/store/apiClient";
import { toast } from "sonner";
import { reportError } from "@/lib/errorReporter";
import { addAsyncCases } from "@/store/sliceHelpers";
import { getRequestErrorMessage } from "@/store/requestError";

export interface DataSendToCreateDevice {
  id?: number;
  name: string;
  serial_number: string;
  ip_address: string;
  port: number;
  location: string;
}

export interface DataRecievedWhileFetchDevice {
  data: DeviceRecieved[];
}
export interface DataRecievedWhileCreateDevice {
  data: DeviceRecieved;
}
export interface DeviceRecieved {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  name: string;
  serial_number: string;
  ip_address: string;
  port: number;
  location: string;
}

export interface DeviceState {
  devices: DeviceRecieved[];
  isDeviceLoading: boolean;
  isDeviceCreateLoading: boolean;
  isDeviceCreateSuccess: boolean;
  isDeviceUpdateLoading: boolean;
  isDeviceUpdateSuccess: boolean;
  isDeviceError: string | null;
  isDeviceCreateError: string | null;
  isDeviceDeleteLoading: boolean;
  isDeviceDeleteSuccess: boolean;
}

const initialState: DeviceState = {
  devices: [],
  isDeviceLoading: false,
  isDeviceError: null,
  isDeviceCreateLoading: false,
  isDeviceUpdateSuccess: false,
  isDeviceCreateError: null,
  isDeviceDeleteLoading: false,
  isDeviceCreateSuccess: false,
  isDeviceDeleteSuccess: false,
  isDeviceUpdateLoading: false,
};

const deviceSlice = createSlice({
  name: "device",
  initialState,
  reducers: {
    resetDeviceCreateSuccess: (state) => {
      state.isDeviceCreateSuccess = false;
    },
    resetDeviceUpdateSuccess: (state) => {
      state.isDeviceUpdateSuccess = false;
    },
    resetDeviceDeleteSuccess: (state) => {
      state.isDeviceDeleteSuccess = false;
    },
  },
  extraReducers: (builder) => {
    addAsyncCases(builder, handleFetchDevice, {
      loadingKey: "isDeviceLoading",
      errorKey: "isDeviceError",
      fallbackError: "Fetch devices failed",
      onFulfilled: (state, payload) => {
        state.devices = payload.data;
      },
    });
    addAsyncCases(builder, handleCreateDevice, {
      loadingKey: "isDeviceCreateLoading",
      errorKey: "isDeviceCreateError",
      fallbackError: "Create device failed",
      onFulfilled: (state, payload) => {
        state.devices.push(payload.data);
        state.isDeviceCreateSuccess = true;
      },
    });
    addAsyncCases(builder, handleUpdateDevice, {
      loadingKey: "isDeviceUpdateLoading",
      errorKey: "isDeviceCreateError",
      fallbackError: "Update Device failed",
      onFulfilled: (state, payload) => {
        state.devices = state.devices.map((device) =>
          device.ID === payload.data.ID ? payload.data : device
        );
        state.isDeviceUpdateSuccess = true;
      },
    });
    addAsyncCases(builder, handleDeleteDevice, {
      loadingKey: "isDeviceDeleteLoading",
      errorKey: "isDeviceError",
      fallbackError: "Delete device failed",
      onFulfilled: (state, payload) => {
        state.devices = state.devices.filter(
          (device) => device.ID !== payload.data.ID
        );
        state.isDeviceDeleteSuccess = true;
      },
    });
  },
});

export const handleFetchDevice = createAsyncThunk<DataRecievedWhileFetchDevice>(
  "device/fetchDevice",
  async (data) => {
    const url = `/api/v1/admin/devices`;

    const config: AxiosRequestConfig = {
      url,
      method: "GET",
    };

    try {
      const response = await apiClient(config);
      if (response.data) {
        return response.data;
      } else {
        throw new Error("Fetch devices failed");
      }
    } catch (error: unknown) {
      reportError("device.fetch", error);
      throw new Error(getRequestErrorMessage(error, "Fetch devices failed"));
    }
  }
);

export const handleCreateDevice = createAsyncThunk<
  DataRecievedWhileCreateDevice,
  DataSendToCreateDevice
>("device/createDevice", async (data) => {
  const url = `/api/v1/admin/createdevice`;

  const config: AxiosRequestConfig = {
    url,
    method: "POST",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("Device created successfully");
      return response.data;
    } else {
      toast.error("Create devices failed");
      throw new Error("Create devices failed");
    }
  } catch (error: unknown) {
    reportError("device.create", error);
    const message = getRequestErrorMessage(error, "Create Devices failed");
    toast.error(message);
    throw new Error(message);
  }
});
export const handleUpdateDevice = createAsyncThunk<
  DataRecievedWhileCreateDevice,
  DataSendToCreateDevice
>("device/updateDevice", async (data) => {
  const url = `/api/v1/admin/device/${data.id}`;

  const config: AxiosRequestConfig = {
    url,
    method: "PATCH",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("device updated successfully");
      return response.data;
    } else {
      toast.error("Update device failed");
      throw new Error("Update device failed");
    }
  } catch (error: unknown) {
    reportError("device.update", error);
    const message = getRequestErrorMessage(error, "Update device failed");
    toast.error(message);
    throw new Error(message);
  }
});

export const handleDeleteDevice = createAsyncThunk<
  DataRecievedWhileCreateDevice,
  { id: number }
>("device/deleteDevice", async (data) => {
  const url = `/api/v1/admin/device/${data.id}`;

  const config: AxiosRequestConfig = {
    url,
    method: "DELETE",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("device deleted successfully");
      return response.data;
    } else {
      toast.error("Delete device failed");
      throw new Error("Delete device failed");
    }
  } catch (error: unknown) {
    reportError("device.delete", error);
    const message = getRequestErrorMessage(error, "Delete device failed");
    toast.error(message);
    throw new Error(message);
  }
});

export const {
  resetDeviceCreateSuccess,
  resetDeviceDeleteSuccess,
  resetDeviceUpdateSuccess,
} = deviceSlice.actions;
export default deviceSlice.reducer;
