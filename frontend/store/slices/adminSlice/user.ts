import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AxiosRequestConfig } from "axios";
import apiClient from "@/store/apiClient";
import { reportRequestError } from "@/store/requestError";
import { addAsyncCases } from "@/store/sliceHelpers";
import { toast } from "sonner";

export interface DataForDashboard {
  totalUsers: number;
  totalDevices: number;
  totalRoles: number;
  totalPermissions: number;
  usersByRole: {
    role_id: number;
    role_name: string;
    count: number;
  }[];
}
export interface DataSendToFetchUsers {
  role_id: number;
  page: number;
  limit: number;
  name?: string;
}

export interface DataSendToSendEmail {
  email: string;
  subject: string;
  password: string;
  role: string;
  roledescription: string[];
  name: string;
}
export interface DataSendToCreateUser {
  id?: number;
  first_name: string;
  father_name: string;
  grand_father_name: string;
  email: string;
  role_id: number;
}

export interface RoleReceived {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  role_name: string;
  description: string;
}

export interface DataReceivedWhileFetchUser {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  data: UserReceived[];
}
export interface DataReceivedWhileCreateUser {
  data: UserReceived;
}
export interface UserReceived {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  first_name: string;
  father_name: string;
  grand_father_name: string;
  email: string;
  password: string;
  role_id: number;
  role: RoleReceived;
}

export interface UserState {
  users: UserReceived[];
  user: UserReceived | null;
  currentPageUserCreate: number;
  isUserLoading: boolean;
  isUserCreateLoading: boolean;
  isUserDeleteLoading: boolean;
  isUserError: string | null;
  isUserCreateError: string | null;
  sendEmailLoading: boolean;
  sendEmailError: string | null;
  sendEmailSuccess: boolean;
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  userDashboardData: DataForDashboard | null;
}

const initialState: UserState = {
  users: [],
  user: null,
  currentPageUserCreate: 1,
  isUserLoading: false,
  isUserError: null,
  isUserCreateLoading: false,
  isUserDeleteLoading: false,
  isUserCreateError: null,
  sendEmailLoading: false,
  sendEmailError: null,
  sendEmailSuccess: false,
  currentPage: 0,
  totalPages: 0,
  totalUsers: 0,
  userDashboardData: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    increareCurrentPage: (state) => {
      state.currentPageUserCreate += 1;
    },
    removeCurrentUser: (state) => {
      state.user = null;
      state.currentPageUserCreate = 1;
    },
    removeSendEmailSuccess: (state) => {
      state.sendEmailSuccess = false;
    },
  },
  extraReducers: (builder) => {
    addAsyncCases(builder, handleFetchUser, {
      loadingKey: "isUserLoading",
      errorKey: "isUserError",
      fallbackError: "Fetch users failed",
      onFulfilled: (state, payload) => {
        state.users = payload.data;
        state.currentPage = payload.currentPage;
        state.totalPages = payload.totalPages;
        state.totalUsers = payload.totalUsers;
      },
    });
    addAsyncCases(builder, handleCreateUser, {
      loadingKey: "isUserCreateLoading",
      errorKey: "isUserCreateError",
      fallbackError: "Create user failed",
      onFulfilled: (state, payload) => {
        state.user = payload.data;
        state.currentPageUserCreate += 1;
      },
    });
    addAsyncCases(builder, handleUpdateUser, {
      loadingKey: "isUserCreateLoading",
      errorKey: "isUserCreateError",
      fallbackError: "Update user failed",
      onFulfilled: (state, payload) => {
        state.users = state.users.map((user) =>
          user.ID === payload.data.ID ? payload.data : user
        );
        state.user = payload.data;
        state.currentPageUserCreate += 1;
      },
    });
    addAsyncCases(builder, handleDeleteUser, {
      loadingKey: "isUserDeleteLoading",
      errorKey: "isUserError",
      fallbackError: "Delete user failed",
      onFulfilled: (state, payload) => {
        state.users = state.users.filter((user) => user.ID !== payload.data.ID);
      },
    });
    builder
      .addCase(handleSendEmail.pending, (state) => {
        state.sendEmailLoading = true;
        state.sendEmailError = null;
        state.sendEmailSuccess = false;
      })
      .addCase(handleSendEmail.fulfilled, (state) => {
        state.sendEmailLoading = false;
        state.sendEmailError = null;
        state.sendEmailSuccess = true;
      })
      .addCase(handleSendEmail.rejected, (state) => {
        state.sendEmailSuccess = false;
        state.sendEmailLoading = false;
        state.sendEmailError = "Send email failed";
      })
      .addCase(handleGetDashboardInformation.pending, (state) => {
        state.isUserLoading = true;
        state.isUserError = null;
      })
      .addCase(handleGetDashboardInformation.fulfilled, (state, action) => {
        state.isUserLoading = false;
        state.userDashboardData = action.payload;
      })
      .addCase(handleGetDashboardInformation.rejected, (state, action) => {
        state.userDashboardData = null;
        state.isUserLoading = false;
        state.isUserError = action.error.message || "Fetch users failed";
      });
  },
});

export const handleFetchUser = createAsyncThunk<
  DataReceivedWhileFetchUser,
  DataSendToFetchUsers
>("user/fetchUser", async (data) => {
  const url = `/api/v1/admin/users/${data.role_id}`;

  const config: AxiosRequestConfig = {
    url,
    method: "GET",

    params: { page: data.page, limit: data.limit, name: data.name },
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      return response.data;
    } else {
      throw new Error("Fetch users failed");
    }
  } catch (error: unknown) {
    throw new Error(
      reportRequestError("user.fetch", error, "Fetch users failed")
    );
  }
});

export const handleCreateUser = createAsyncThunk<
  DataReceivedWhileCreateUser,
  DataSendToCreateUser
>("user/createUser", async (data) => {
  const url = `/api/v1/admin/createuser`;

  const config: AxiosRequestConfig = {
    url,
    method: "POST",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("User created successfully");
      return response.data;
    } else {
      throw new Error("Create users failed");
    }
  } catch (error: unknown) {
    throw new Error(
      reportRequestError("user.create", error, "Create users failed")
    );
  }
});

export const handleUpdateUser = createAsyncThunk<
  DataReceivedWhileCreateUser,
  DataSendToCreateUser
>("user/updateUser", async (data) => {
  const url = `/api/v1/admin/user/${data.id}`;

  const config: AxiosRequestConfig = {
    url,
    method: "PATCH",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("User updated successfully");
      return response.data;
    } else {
      throw new Error("Update user failed");
    }
  } catch (error: unknown) {
    throw new Error(
      reportRequestError("user.update", error, "Update user failed")
    );
  }
});

export const handleDeleteUser = createAsyncThunk<
  DataReceivedWhileCreateUser,
  { id: number }
>("user/deleteUser", async (data) => {
  const url = `/api/v1/admin/user/${data.id}`;

  const config: AxiosRequestConfig = {
    url,
    method: "DELETE",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("User deleted successfully");
      return response.data;
    } else {
      throw new Error("Delete user failed");
    }
  } catch (error: unknown) {
    throw new Error(
      reportRequestError("user.delete", error, "Delete user failed")
    );
  }
});

export const handleSendEmail = createAsyncThunk<string, DataSendToSendEmail>(
  "user/sendEmail",
  async (data) => {
    const url = `/api/v1/admin/sendemail`;

    const config: AxiosRequestConfig = {
      url,
      method: "POST",
      data: data,
    };

    try {
      const response = await apiClient(config);
      if (response.data) {
        toast.success("Email sent successfully");
        return response.data.message;
      } else {
        throw new Error("Send email failed");
      }
    } catch (error: unknown) {
      throw new Error(
        reportRequestError("user.sendEmail", error, "Send email failed")
      );
    }
  }
);

export const handleGetDashboardInformation = createAsyncThunk<DataForDashboard>(
  "user/dashboard",
  async () => {
    const url = `/api/v1/admin/dashboard`;

    const config: AxiosRequestConfig = {
      url,
      method: "GET",
    };

    try {
      const response = await apiClient(config);
      if (response.data) {
        return response.data;
      } else {
        throw new Error("Fetch dashboard information failed");
      }
    } catch (error: unknown) {
      throw new Error(
        reportRequestError(
          "user.dashboard",
          error,
          "Fetch dashboard information failed"
        )
      );
    }
  }
);

export const {
  increareCurrentPage,
  removeCurrentUser,
  removeSendEmailSuccess,
} = userSlice.actions;
export default userSlice.reducer;
