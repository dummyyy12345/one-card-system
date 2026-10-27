import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosRequestConfig } from "axios";
import { DataSendToCreateUser } from "./user";
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
    builder
      .addCase(handleFetchRole.pending, (state) => {
        state.isRoleLoading = true;
        state.isRoleError = null;
      })
      .addCase(
        handleFetchRole.fulfilled,
        (state, action: PayloadAction<DataRecievedWhileFecthRoles>) => {
          state.roles = action.payload.data;
          state.isRoleLoading = false;
          state.isRoleError = null;
        }
      )
      .addCase(handleFetchRole.rejected, (state, action) => {
        state.isRoleLoading = false;
        state.isRoleError = action.error.message as string;
      })
      .addCase(handleCreateRole.pending, (state) => {
        state.isRoleCreateLoading = true;
        state.isRoleError = null;
      })
      .addCase(
        handleCreateRole.fulfilled,
        (state, action: PayloadAction<RoleRecieved>) => {
          state.roles = [...state.roles, action.payload];
          state.isRoleCreateSuccess = true;
          state.isRoleCreateLoading = false;
          state.isRoleError = null;
        }
      )
      .addCase(handleCreateRole.rejected, (state, action) => {
        state.isRoleCreateLoading = false;
        state.isRoleError = action.error.message as string;
      })
      .addCase(handleUpdateRole.pending, (state, action) => {
        state.isRoleUpdateLoading = true;
        state.isRoleError = null;
      })
      .addCase(handleUpdateRole.fulfilled, (state, action) => {
        state.isRoleUpdateLoading = false;
        state.isRoleError = null;
        state.roles = state.roles.map((role) => {
          if (role.ID === action.payload.ID) {
            return action.payload;
          }
          return role;
        });
        state.isRoleUpdateSuccess = true;
      })
      .addCase(handleUpdateRole.rejected, (state, action) => {
        state.isRoleUpdateLoading = false;
        state.isRoleError = action.error.message as string;
      })
      .addCase(handleDeleteRole.pending, (state, action) => {
        state.isRoleDeleteLoading = true;
        state.isRoleError = null;
      })
      .addCase(handleDeleteRole.fulfilled, (state, action) => {
        state.isRoleDeleteLoading = false;
        state.isRoleError = null;
        state.isRoleDeleteSuccess = true;
        state.roles = state.roles.filter(
          (role) => role.ID !== action.payload.ID
        );
      })
      .addCase(handleDeleteRole.rejected, (state, action) => {
        state.isRoleDeleteLoading = false;
        state.isRoleError = action.error.message as string;
      });
  },
});

export const handleFetchRole = createAsyncThunk<DataRecievedWhileFecthRoles>(
  "role/fetchRole",
  async () => {
    const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/roles`;

    const config: AxiosRequestConfig = {
      url,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    try {
      const response = await axios(config);
      if (response.data) {
        return response.data;
      } else {
        toast.error("Get role Failed");
        throw new Error("Get role Failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Get role Failed");
      throw new Error(error.response?.data?.error || "Get role Failed");
    }
  }
);

export const handleCreateRole = createAsyncThunk<RoleRecieved, RoleSend>(
  "role/createRole",
  async (data) => {
    const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/roles`;

    const config: AxiosRequestConfig = {
      url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
      withCredentials: true,
    };

    try {
      const response = await axios(config);
      if (response.data) {
        toast.success("Role created successfully");
        return response.data.data;
      } else {
        toast.error("Create role Failed");
        throw new Error("Create role Failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Create role Failed");
      throw new Error(error.response?.data?.error || "Create role Failed");
    }
  }
);

export const handleUpdateRole = createAsyncThunk<RoleRecieved, RoleSend>(
  "role/updateRole",
  async (data) => {
    const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/roles/${data.id}`;

    const config: AxiosRequestConfig = {
      url,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
      withCredentials: true,
    };

    try {
      const response = await axios(config);
      if (response.data) {
        toast.success("Role updated successfully");
        return response.data.data;
      } else {
        toast.error("Update role Failed");
        throw new Error("Update role Failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Update role Failed");
      throw new Error(error.response?.data?.error || "Update role Failed");
    }
  }
);
export const handleDeleteRole = createAsyncThunk<RoleRecieved, { id: number }>(
  "role/deleteRole",
  async (data) => {
    const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/roles/${data.id}`;

    const config: AxiosRequestConfig = {
      url,
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    try {
      const response = await axios(config);
      if (response.data) {
        toast.success("Role deleted successfully");
        return response.data.data;
      } else {
        toast.error("Delete role Failed");
        throw new Error("Delete role Failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Delete role Failed");
      throw new Error(error.response?.data?.error || "Delete role Failed");
    }
  }
);

export const {
  resetRoleCreateSuccess,
  resetRoleUpdateSuccess,
  resetRoleDeleteSuccess,
} = roleSlice.actions;
export default roleSlice.reducer;
