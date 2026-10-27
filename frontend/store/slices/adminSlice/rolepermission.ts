import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { PermissionRecieved } from "./permission";
import { RoleRecieved } from "./role";
import type { AxiosRequestConfig } from "axios";
import apiClient from "@/store/apiClient";
import { addAsyncCases } from "@/store/sliceHelpers";
import { reportRequestError } from "@/store/requestError";
import { toast } from "sonner";

export interface RolePermissionSend {
  role_id: number;
}

export interface RolePermissionRecieved {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  role_id: number;
  permission_id: number;
  role: RoleRecieved;
  permission: PermissionRecieved;
}

export interface RolePermissionRecievedData {
  data: RolePermissionRecieved[];
}

export interface RolePermissionState {
  rolePermissions: RolePermissionRecieved[];
  rolePermission: RolePermissionRecieved | null;
  isRolePermissionLoading: boolean;
  isRolePermissionUpdateLoading: boolean;
  isRolePermissionError: string | null;
}

const initialState: RolePermissionState = {
  rolePermissions: [],
  rolePermission: null,
  isRolePermissionLoading: false,
  isRolePermissionUpdateLoading: false,
  isRolePermissionError: null,
};

const rolePermissionSlice = createSlice({
  name: "rolePermission",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addAsyncCases(builder, handleFetchPermissionForSpecificRole, {
      loadingKey: "isRolePermissionLoading",
      errorKey: "isRolePermissionError",
      fallbackError: "Fetch role permissions failed",
      onFulfilled: (state, payload) => {
        state.rolePermissions = payload.data;
      },
    });
    addAsyncCases(builder, handleUpdateRolePermissionByRoleId, {
      loadingKey: "isRolePermissionUpdateLoading",
      errorKey: "isRolePermissionError",
      fallbackError: "Update role permissions failed",
      onFulfilled: (state, payload) => {
        state.rolePermissions = payload.data;
      },
    });
  },
});

export const handleFetchPermissionForSpecificRole = createAsyncThunk<
  RolePermissionRecievedData,
  RolePermissionSend
>("rolepermission/fetchpermissionsforrole", async ({ role_id }) => {
  const config: AxiosRequestConfig = {
    url: `/api/v1/admin/rolepermission/${role_id}`,
    method: "GET",
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      return response.data;
    }
    throw new Error("Fetch role permissions failed");
  } catch (error: unknown) {
    throw new Error(
      reportRequestError(
        "rolePermission.fetch",
        error,
        "Fetch role permissions failed"
      )
    );
  }
});

export const handleUpdateRolePermissionByRoleId = createAsyncThunk<
  RolePermissionRecievedData,
  { role_id: number; permission_ids: number[] }
>(
  "rolepermission/updaterolepermission",
  async ({ role_id, permission_ids }) => {
    const payload = { role_id, permission_ids };
    const config: AxiosRequestConfig = {
      url: `/api/v1/admin/rolepermission/${role_id}`,
      method: "PATCH",
      data: payload,
    };

    try {
      const response = await apiClient(config);
      if (response.data) {
        toast.success("Permissions updated successfully");
        return response.data;
      }
      throw new Error("Update role permissions failed");
    } catch (error: unknown) {
      throw new Error(
        reportRequestError(
          "rolePermission.update",
          error,
          "Update role permissions failed"
        )
      );
    }
  }
);

export const {} = rolePermissionSlice.actions;
export default rolePermissionSlice.reducer;
