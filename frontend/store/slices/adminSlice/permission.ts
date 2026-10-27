import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AxiosRequestConfig } from "axios";
import apiClient from "@/store/apiClient";
import { addAsyncCases } from "@/store/sliceHelpers";
import { reportRequestError } from "@/store/requestError";
import { toast } from "sonner";

export interface CreatePermissionDataSend {
  permissions_name: string;
  description: string;
  id?: number;
}

export interface PermissionRecieved {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  permissions_name: string;
  description: string;
}

export interface PermissionsRecievedData {
  data: PermissionRecieved[];
}

interface PermissionState {
  permissions: PermissionRecieved[];
  permission: PermissionRecieved | null;
  isPermissionLoading: boolean;
  isPermissionCreateLoading: boolean;
  isPermissionUpdateLoading: boolean;
  isPermissionDeleteLoading: boolean;
  isPermissionCreateSuccess: boolean;
  isPermissionUpdateSuccess: boolean;
  isPermissionDeleteSuceess: boolean;
  isPermissionError: string | null;
}

const initialState: PermissionState = {
  permissions: [],
  permission: null,
  isPermissionLoading: false,
  isPermissionCreateLoading: false,
  isPermissionUpdateLoading: false,
  isPermissionDeleteLoading: false,
  isPermissionCreateSuccess: false,
  isPermissionUpdateSuccess: false,
  isPermissionDeleteSuceess: false,
  isPermissionError: null,
};

const permissionSlice = createSlice({
  name: "permission",
  initialState,
  reducers: {
    resetRoleCreateSuccess: (state) => {
      state.isPermissionCreateSuccess = false;
    },
    resetPermissionCreateSuccess: (state) => {
      state.isPermissionCreateSuccess = false;
    },
    resetPermissionUpdateSuccess: (state) => {
      state.isPermissionUpdateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    addAsyncCases(builder, handleFetchPermissions, {
      loadingKey: "isPermissionLoading",
      errorKey: "isPermissionError",
      fallbackError: "Get permission failed",
      onFulfilled: (state, payload) => {
        state.permissions = payload.data;
      },
    });
    addAsyncCases(builder, handleCreatePermission, {
      loadingKey: "isPermissionCreateLoading",
      errorKey: "isPermissionError",
      fallbackError: "Create permission failed",
      onFulfilled: (state, payload) => {
        state.permissions.push(payload);
        state.isPermissionCreateSuccess = true;
      },
    });
    addAsyncCases(builder, handleUpdatePermission, {
      loadingKey: "isPermissionUpdateLoading",
      errorKey: "isPermissionError",
      fallbackError: "Update permission failed",
      onFulfilled: (state, payload) => {
        state.permissions = state.permissions.map((permission) =>
          permission.ID === payload.ID ? payload : permission
        );
        state.isPermissionUpdateSuccess = true;
      },
    });
    addAsyncCases(builder, handleDeletePermission, {
      loadingKey: "isPermissionDeleteLoading",
      errorKey: "isPermissionError",
      fallbackError: "Delete permission failed",
      onFulfilled: (state, payload) => {
        state.permissions = state.permissions.filter(
          (permission) => permission.ID !== payload.ID
        );
        state.isPermissionDeleteSuceess = true;
      },
    });
  },
});

//handle fetch all permissions
export const handleFetchPermissions = createAsyncThunk<PermissionsRecievedData>(
  "permission/fetchPermission",
  async () => {
    const config: AxiosRequestConfig = {
      url: "/api/v1/admin/permissions",
      method: "GET",
    };

    try {
      const response = await apiClient(config);
      if (response.data) {
        return response.data;
      }
      throw new Error("Get permission failed");
    } catch (error: unknown) {
      throw new Error(
        reportRequestError("permission.fetch", error, "Get permission failed")
      );
    }
  }
);

export const handleCreatePermission = createAsyncThunk<
  PermissionRecieved,
  CreatePermissionDataSend
>("permission/createPermission", async (data) => {
  const config: AxiosRequestConfig = {
    url: "/api/v1/admin/permissions",
    method: "POST",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("Permission created successfully");
      return response.data.data;
    }
    throw new Error("Create permission failed");
  } catch (error: unknown) {
    throw new Error(
      reportRequestError("permission.create", error, "Create permission failed")
    );
  }
});

export const handleUpdatePermission = createAsyncThunk<
  PermissionRecieved,
  CreatePermissionDataSend
>("permission/updatePermission", async (data) => {
  const config: AxiosRequestConfig = {
    url: `/api/v1/admin/permissions/${data.id}`,
    method: "PATCH",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("Permission updated successfully");
      return response.data.data;
    }
    throw new Error("Update permission failed");
  } catch (error: unknown) {
    throw new Error(
      reportRequestError("permission.update", error, "Update permission failed")
    );
  }
});

export const handleDeletePermission = createAsyncThunk<
  PermissionRecieved,
  { id: number }
>("permission/deletePemission", async (data) => {
  const config: AxiosRequestConfig = {
    url: `/api/v1/admin/permissions/${data.id}`,
    method: "DELETE",
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("Permission deleted successfully");
      return response.data.data;
    }
    throw new Error("Delete permission failed");
  } catch (error: unknown) {
    throw new Error(
      reportRequestError("permission.delete", error, "Delete permission failed")
    );
  }
});

export const {
  resetRoleCreateSuccess,
  resetPermissionUpdateSuccess,
  resetPermissionCreateSuccess,
} = permissionSlice.actions;
export default permissionSlice.reducer;
