import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AxiosRequestConfig } from "axios";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import { addAsyncCases } from "@/store/sliceHelpers";
import { toast } from "sonner";

export interface RoleSend {
  role_name: string;
  description: string;
  id?: number;
}
export interface DataRecievedWhileFecthRoles {
  data: RoleRecieved[];
}
export interface RoleRecieved {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  role_name: string;
  description: string;
}

export interface RoleState {
  roles: RoleRecieved[];
  role: RoleRecieved | null;
  isRoleLoading: boolean;
  isRoleCreateSuccess: boolean;
  isRoleUpdateSuccess: boolean;
  isRoleCreateLoading: boolean;
  isRoleUpdateLoading: boolean;
  isRoleDeleteLoading: boolean;
  isRoleDeleteSuccess: boolean;
  isRoleError: string | null;
}

const initialState: RoleState = {
  roles: [],
  role: null,
  isRoleLoading: false,
  isRoleCreateLoading: false,
  isRoleCreateSuccess: false,
  isRoleUpdateSuccess: false,
  isRoleUpdateLoading: false,
  isRoleDeleteLoading: false,
  isRoleDeleteSuccess: false,
  isRoleError: null,
};

const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    resetRoleCreateSuccess: (state) => {
      state.isRoleCreateSuccess = false;
    },
    resetRoleUpdateSuccess: (state) => {
      state.isRoleUpdateSuccess = false;
    },
    resetRoleDeleteSuccess: (state) => {
      state.isRoleDeleteSuccess = false;
    },
  },
  extraReducers: (builder) => {
    addAsyncCases(builder, handleFetchRole, {
      loadingKey: "isRoleLoading",
      errorKey: "isRoleError",
      fallbackError: "Get role failed",
      onFulfilled: (state, payload) => {
        state.roles = payload.data;
      },
    });
    addAsyncCases(builder, handleCreateRole, {
      loadingKey: "isRoleCreateLoading",
      errorKey: "isRoleError",
      fallbackError: "Create role failed",
      onFulfilled: (state, payload) => {
        state.roles.push(payload);
        state.isRoleCreateSuccess = true;
      },
    });
    addAsyncCases(builder, handleUpdateRole, {
      loadingKey: "isRoleUpdateLoading",
      errorKey: "isRoleError",
      fallbackError: "Update role failed",
      onFulfilled: (state, payload) => {
        state.roles = state.roles.map((role) =>
          role.ID === payload.ID ? payload : role
        );
        state.isRoleUpdateSuccess = true;
      },
    });
    addAsyncCases(builder, handleDeleteRole, {
      loadingKey: "isRoleDeleteLoading",
      errorKey: "isRoleError",
      fallbackError: "Delete role failed",
      onFulfilled: (state, payload) => {
        state.roles = state.roles.filter((role) => role.ID !== payload.ID);
        state.isRoleDeleteSuccess = true;
      },
    });
  },
});

function roleRequestError(
  context: string,
  error: unknown,
  fallback: string
): never {
  reportError(context, error);
  const response =
    error && typeof error === "object" && "response" in error
      ? (error.response as { data?: { error?: unknown } } | undefined)
      : undefined;
  const message =
    typeof response?.data?.error === "string" ? response.data.error : fallback;
  toast.error(message);
  throw new Error(message);
}

export const handleFetchRole = createAsyncThunk<DataRecievedWhileFecthRoles>(
  "role/fetchRole",
  async () => {
    const config: AxiosRequestConfig = {
      url: "/api/v1/admin/roles",
      method: "GET",
    };

    try {
      const response = await apiClient(config);
      if (response.data) {
        return response.data;
      }
      throw new Error("Get role failed");
    } catch (error: unknown) {
      return roleRequestError("role.fetch", error, "Get role failed");
    }
  }
);

export const handleCreateRole = createAsyncThunk<RoleRecieved, RoleSend>(
  "role/createRole",
  async (data) => {
    const config: AxiosRequestConfig = {
      url: "/api/v1/admin/roles",
      method: "POST",
      data: data,
    };

    try {
      const response = await apiClient(config);
      if (response.data) {
        toast.success("Role created successfully");
        return response.data.data;
      }
      throw new Error("Create role failed");
    } catch (error: unknown) {
      return roleRequestError("role.create", error, "Create role failed");
    }
  }
);

export const handleUpdateRole = createAsyncThunk<RoleRecieved, RoleSend>(
  "role/updateRole",
  async (data) => {
    const config: AxiosRequestConfig = {
      url: `/api/v1/admin/roles/${data.id}`,
      method: "PATCH",
      data: data,
    };

    try {
      const response = await apiClient(config);
      if (response.data) {
        toast.success("Role updated successfully");
        return response.data.data;
      }
      throw new Error("Update role failed");
    } catch (error: unknown) {
      return roleRequestError("role.update", error, "Update role failed");
    }
  }
);
export const handleDeleteRole = createAsyncThunk<RoleRecieved, { id: number }>(
  "role/deleteRole",
  async (data) => {
    const config: AxiosRequestConfig = {
      url: `/api/v1/admin/roles/${data.id}`,
      method: "DELETE",
    };

    try {
      const response = await apiClient(config);
      if (response.data) {
        toast.success("Role deleted successfully");
        return response.data.data;
      }
      throw new Error("Delete role failed");
    } catch (error: unknown) {
      return roleRequestError("role.delete", error, "Delete role failed");
    }
  }
);

export const {
  resetRoleCreateSuccess,
  resetRoleUpdateSuccess,
  resetRoleDeleteSuccess,
} = roleSlice.actions;
export default roleSlice.reducer;
