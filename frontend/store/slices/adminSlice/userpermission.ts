import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios, { AxiosRequestConfig } from "axios";
import { handleFetchUser, increareCurrentPage, UserRecieved } from "./user";
import { toast } from "sonner";
import { PermissionRecieved } from "./permission";

export interface DataSendToCreateUserPermission {
  user_id: number;
  permission_ids: number[];
}

export interface DataReceivedWhileCreateUserPermission {
  data: ReceivedWhileFetchUserPermission[];
}

export interface ReceivedWhileFetchUserPermission {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  user_id: number;
  permission_id: number;
  user: UserRecieved;
  permission: PermissionRecieved;
}
export interface DataReceivedWhileFetchUserPermission {
  data: ReceivedWhileFetchUserPermission[];
}

interface UserPermissionState {
  userPermissions: ReceivedWhileFetchUserPermission[] | [];
  isUserPermissionLoading: boolean;
  isUserPermissionCreateLoading: boolean;
  isUserPermissionError: string | null;
}

const initialState: UserPermissionState = {
  userPermissions: [],
  isUserPermissionLoading: false,
  isUserPermissionCreateLoading: false,
  isUserPermissionError: null,
};

// Define the slice
const userPermissionSlice = createSlice({
  name: "userPermission",
  initialState,
  reducers: {
    resetUserPermissionState: (state) => {
      state.userPermissions = [];
      state.isUserPermissionCreateLoading = false;
      state.isUserPermissionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(handleCreateUserPermission.pending, (state) => {
        state.isUserPermissionCreateLoading = true;
        state.isUserPermissionError = null;
      })
      .addCase(handleCreateUserPermission.fulfilled, (state, action) => {
        state.userPermissions = action.payload.data;
        state.isUserPermissionCreateLoading = false;
        state.isUserPermissionError = null;
      })
      .addCase(handleCreateUserPermission.rejected, (state, action) => {
        state.isUserPermissionCreateLoading = false;
        state.isUserPermissionError =
          (action.payload as string) || "An error occurred";
      })
      .addCase(handleFetchUserPermission.pending, (state) => {
        state.isUserPermissionLoading = true;
        state.isUserPermissionError = null;
      })
      .addCase(handleFetchUserPermission.fulfilled, (state, action) => {
        state.userPermissions = action.payload.data;
        state.isUserPermissionLoading = false;
        state.isUserPermissionError = null;
      })
      .addCase(handleFetchUserPermission.rejected, (state, action) => {
        state.isUserPermissionLoading = false;
        state.isUserPermissionError =
          (action.payload as string) || "An error occurred";
      })
      .addCase(handleUpdateUserPermission.pending, (state) => {
        state.isUserPermissionCreateLoading = true;
        state.isUserPermissionError = null;
      })
      .addCase(handleUpdateUserPermission.fulfilled, (state, action) => {
        state.userPermissions = action.payload.data;
        state.isUserPermissionCreateLoading = false;
        state.isUserPermissionError = null;
      })
      .addCase(handleUpdateUserPermission.rejected, (state, action) => {
        state.isUserPermissionCreateLoading = false;
        state.isUserPermissionError =
          (action.payload as string) || "An error occurred";
      });
  },
});

export const handleCreateUserPermission = createAsyncThunk<
  DataReceivedWhileCreateUserPermission,
  DataSendToCreateUserPermission
>(
  "userPermission/createUserPermission",
  async (data, { rejectWithValue, dispatch }) => {
    const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/createuserpermission`;

    const config: AxiosRequestConfig = {
      url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data,
      withCredentials: true,
    };

    try {
      const response = await axios(config);
      if (response.data) {
        dispatch<any>(increareCurrentPage());
        toast.success("User permission created successfully");
        return response.data;
      } else {
        toast.error("Create users failed");
        throw new Error("Create users failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Create users failed");
      return rejectWithValue(
        error.response?.data?.error || "Create users failed"
      );
    }
  }
);

//handle get permission for the specific user
export const handleFetchUserPermission = createAsyncThunk<
  DataReceivedWhileFetchUserPermission,
  number
>("userPermission/fetchUserPermission", async (user_id) => {
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/userpermission/${user_id}`;

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
      toast.error("Fetch user permission failed");
      throw new Error("Fetch user permission failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Fetch user permission failed");
    throw new Error(
      error.response?.data?.error || "Fetch user permission failed"
    );
  }
});

// Update user permission
export const handleUpdateUserPermission = createAsyncThunk<
  DataReceivedWhileCreateUserPermission,
  DataSendToCreateUserPermission
>(
  "userPermission/updateUserPermission",
  async (data, { rejectWithValue, dispatch }) => {
    const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/admin/updateuserpermission`;

    const config: AxiosRequestConfig = {
      url,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      data,
      withCredentials: true,
    };

    try {
      const response = await axios(config);
      if (response.data) {
        dispatch<any>(increareCurrentPage());
        toast.success("User permission updated successfully");
        return response.data;
      } else {
        toast.error("Update users failed");
        throw new Error("Update users failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Update users failed");
      return rejectWithValue(
        error.response?.data?.error || "Update users failed"
      );
    }
  }
);

export const { resetUserPermissionState } = userPermissionSlice.actions;
export default userPermissionSlice.reducer;
