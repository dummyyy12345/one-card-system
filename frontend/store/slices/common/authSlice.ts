import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AxiosRequestConfig } from "axios";
import apiClient from "@/store/apiClient";
import { reportRequestError } from "@/store/requestError";
import { toast } from "sonner";
import { roleHomePath } from "@/lib/roleRoutes";

// Define your types
export interface LoginUserSendData {
  email: string;
  password: string;
}

export interface DataRecievedWhileUserLogin {
  data: UserRecieved;
}
interface UserRecieved {
  ID: number;
  first_name: string;
  father_name: string;
  grand_father_name: string;
  email: string;
  role_id: number;
  role: RoleRecieved;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  password: null;
}

interface RoleRecieved {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  role_name: string;
  description: string;
}

interface AuthState {
  user: UserRecieved | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Create the slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearAuthUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(handleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(handleLogin.fulfilled, (state, action) => {
        state.user = (action.payload as DataRecievedWhileUserLogin).data;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(handleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message as string;
      });
  },
});

// Thunk for handling login
export const handleLogin = createAsyncThunk<
  DataRecievedWhileUserLogin,
  { data: LoginUserSendData; router: any; locale?: string }
>("auth/login", async ({ data, router, locale = "en" }) => {
  const config: AxiosRequestConfig = {
    url: "/api/v1/user/login",
    method: "POST",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data?.data) {
      router.push(
        roleHomePath(response.data.data.role?.role_name || "", locale)
      );
      toast.success("Logged in successfully");
      return response.data;
    }
    throw new Error("Invalid login data");
  } catch (error: unknown) {
    throw new Error(reportRequestError("auth.login", error, "Login failed"));
  }
});

// Thunk for handling logout
export const handleLogout = createAsyncThunk(
  "auth/logout",
  async (
    { router, languagePrefix }: { router: any; languagePrefix: string },
    { dispatch }
  ) => {
    dispatch(clearAuthUser());
    toast.success("Logged out successfully");
    router.push(`/${languagePrefix}/login`);
  }
);

export const { setLoading, setError, clearAuthUser } = authSlice.actions;
export default authSlice.reducer;
