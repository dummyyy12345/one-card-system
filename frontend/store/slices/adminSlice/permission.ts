import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosRequestConfig } from "axios";
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
    builder
      .addCase(handleFetchPermissions.pending, (state) => {
        state.isPermissionLoading = true;
        state.isPermissionError = null;
      })
      .addCase(
        handleFetchPermissions.fulfilled,
        (state, action: PayloadAction<PermissionsRecievedData>) => {
          state.permissions = action.payload.data;
          state.isPermissionLoading = false;
          state.isPermissionError = null;
        }
      )
      .addCase(handleFetchPermissions.rejected, (state, action) => {
        state.isPermissionLoading = false;
        state.isPermissionError = action.error.message as string;
      })
      .addCase(handleCreatePermission.pending, (state) => {
        state.isPermissionCreateLoading = true;
        state.isPermissionError = null;
      })
      .addCase(handleCreatePermission.fulfilled, (state, action) => {
        state.permissions.push(action.payload);
        state.isPermissionCreateSuccess = true;
        state.isPermissionCreateLoading = false;
        state.isPermissionError = null;
      })
      .addCase(handleCreatePermission.rejected, (state, action) => {
        state.isPermissionCreateLoading = false;
        state.isPermissionError = action.error.message as string;
      })
      .addCase(handleUpdatePermission.pending, (state, action) => {
        state.isPermissionUpdateLoading = true;
        state.isPermissionError = null;
      })
      .addCase(handleUpdatePermission.fulfilled, (state, action) => {
        state.isPermissionUpdateLoading = false;
        state.isPermissionError = null;
        state.permissions = state.permissions.map((permission) => {
          if (permission.ID === action.payload.ID) {
            return action.payload;
          }
          return permission;
        });
        state.isPermissionUpdateSuccess = true;
      })
      .addCase(handleUpdatePermission.rejected, (state, action) => {
        state.isPermissionUpdateLoading = false;
        state.isPermissionError = action.error.message as string;
      })
      .addCase(handleDeletePermission.pending, (state, action) => {
        state.isPermissionDeleteLoading = true;
        state.isPermissionError = null;
      })
      .addCase(handleDeletePermission.fulfilled, (state, action) => {
        state.isPermissionDeleteLoading = false;
        state.isPermissionError = null;
        state.isPermissionDeleteSuceess = true;
        state.permissions = state.permissions.filter(
          (permission) => permission.ID !== action.payload.ID
        );
      })
      .addCase(handleDeletePermission.rejected, (state, action) => {
        state.isPermissionDeleteLoading = false;
        state.isPermissionError = action.error.message as string;
      });
  },
});

//handle fetch all permissions
export const handleFetchPermissions = createAsyncThunk<PermissionsRecievedData>(
  "permission/fetchPermission",
  async () => {
    const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/permissions`;

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
        throw new Error("Get permission Failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Get permission Failed");
      throw new Error(error.response?.data?.error || "Get permission Failed");
    }
  }
);

export const handleCreatePermission = createAsyncThunk<
  PermissionRecieved,
  CreatePermissionDataSend
>("permission/createPermission", async (data) => {
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/permissions`;

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
      toast.success("Permission created successfully");
      return response.data.data;
    } else {
      throw new Error("Create permission Failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Create permission Failed");
    throw new Error(error.response?.data?.error || "Create permission Failed");
  }
});

export const handleUpdatePermission = createAsyncThunk<
  PermissionRecieved,
  CreatePermissionDataSend
>("permission/updatePermission", async (data) => {
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/permissions/${data.id}`;

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
      toast.success("Permission updated successfully");
      return response.data.data;
    } else {
      throw new Error("Update permission Failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Update permission Failed");
    throw new Error(error.response?.data?.error || "Update permission Failed");
  }
});

export const handleDeletePermission = createAsyncThunk<
  PermissionRecieved,
  { id: number }
>("permission/deletePemission", async (data) => {
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/permissions/${data.id}`;

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
      toast.success("Permission deleted successfully");
      return response.data.data;
    } else {
      toast.error("Delete permission Failed");
      throw new Error("Delete permission Failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Delete permission Failed");
    throw new Error(error.response?.data?.error || "Delete permission Failed");
  }
});

export const {
  resetRoleCreateSuccess,
  resetPermissionUpdateSuccess,
  resetPermissionCreateSuccess,
} = permissionSlice.actions;
export default permissionSlice.reducer;
