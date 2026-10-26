import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AxiosRequestConfig } from "axios";
import apiClient from "@/store/apiClient";
import { addAsyncCases } from "@/store/sliceHelpers";
import { toast } from "sonner";
import {
  StudentRecieved,
  SexType,
  StatusType,
  StudentState,
  DataForDashboard,
} from "./types";
export type {
  StudentRecieved,
  LibraryRecieved,
  CafeRecieved,
  DormRecieved,
  StudentState,
  DataForDashboard,
} from "./types";
export { SexType, StatusType } from "./types";

export interface DataRecievedWhileFetchStudents {
  currentPage: number;
  totalPages: number;
  totalStudents: number;
  data: StudentRecieved[];
}
interface DataSendToFetchStudents {
  page: number;
  limit: number;
  name?: string;
  status: string;
}

export interface DataSendToCreateStudent {
  id?: number;
  student_id: string;
  first_name: string;
  father_name: string;
  grand_father_name: string;
  email: string;
  phone: string;
  sex: SexType;
  date_of_birth: Date;
  program: string;
  section: string;
  year: number;
  semester: number;
  religion: string;
  library_id: number | null;
  cafeteria_id: number | null;
  dormitory_id: number | null;
  registered_by_id: number | null;
  status: string;
  is_manually_add: boolean;
}

export interface DataSendToUpdateStudent {
  ID?: number;
  student_id: string;
  card_number: string;
  first_name: string;
  father_name: string;
  grand_father_name: string;
  email: string;
  phone: string;
  sex: SexType;
  date_of_birth: Date;
  program: string;
  section: string;
  year: number;
  semester: number;
  religion: string;
  photo: string;
  library_id: number;
  cafeteria_id: number;
  dormitory_id: number;
  registered_by_id: number;
  status: StatusType;
}

const initialState: StudentState = {
  students: [],
  student: null,
  isCreateStudentLoading: false,
  isCreateStudentError: null,
  isUpdateStudentLoading: false,
  isUpdateStudentError: null,
  isGetStudentLoading: false,
  isGetStudentError: null,
  isUpdateStudentPhotoLoading: false,
  isUpdateStudentCardLoading: false,
  currentPage: 0,
  totalPages: 0,
  totalStudents: 0,
  isGetStudentForDashboardLoading: false,
  isGetStudentForDashboardError: null,
  studentDataForDashboard: null,
};

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {},
  extraReducers(builder) {
    addAsyncCases(builder, handleCreateStudent, {
      loadingKey: "isCreateStudentLoading",
      errorKey: "isCreateStudentError",
      fallbackError: "Create Student Failed",
      onPending: (state) => {
        state.student = null;
      },
      onFulfilled: (state, payload) => {
        state.student = payload;
      },
      onRejected: (state) => {
        state.student = null;
      },
    });
    addAsyncCases(builder, handleUpdateStudent, {
      loadingKey: "isUpdateStudentLoading",
      errorKey: "isUpdateStudentError",
      fallbackError: "Create Student Failed",
      onFulfilled: (state, payload) => {
        state.student = payload;
      },
    });
    addAsyncCases(builder, handleFetchStudents, {
      loadingKey: "isGetStudentLoading",
      errorKey: "isGetStudentError",
      fallbackError: "Fetch students failed",
      onFulfilled: (state, payload) => {
        state.students = payload.data;
        state.currentPage = payload.currentPage;
        state.totalPages = payload.totalPages;
        state.totalStudents = payload.totalStudents;
      },
    });
    addAsyncCases(builder, handleGetSingleStudent, {
      loadingKey: "isGetStudentLoading",
      errorKey: "isGetStudentError",
      fallbackError: "Fetch students failed",
      onPending: (state) => {
        state.student = null;
      },
      onFulfilled: (state, payload) => {
        state.student = payload;
      },
      onRejected: (state) => {
        state.student = null;
      },
    });
    addAsyncCases(builder, handleUpdateStudentPhoto, {
      loadingKey: "isUpdateStudentPhotoLoading",
      errorKey: "isUpdateStudentError",
      fallbackError: "Fetch students failed",
      onFulfilled: (state, payload) => {
        state.student = payload;
      },
    });
    addAsyncCases(builder, handleUpdateStudentCard, {
      loadingKey: "isUpdateStudentCardLoading",
      errorKey: "isUpdateStudentError",
      fallbackError: "Fetch students failed",
      onFulfilled: (state, payload) => {
        state.student = payload;
      },
    });
    addAsyncCases(builder, handleGetDashboardInformationForStudent, {
      loadingKey: "isGetStudentForDashboardLoading",
      errorKey: "isGetStudentForDashboardError",
      fallbackError: "Fetch users failed",
      onFulfilled: (state, payload) => {
        state.studentDataForDashboard = payload;
      },
      onRejected: (state) => {
        state.studentDataForDashboard = null;
      },
    });
  },
});

export const handleFetchStudents = createAsyncThunk<
  DataRecievedWhileFetchStudents,
  DataSendToFetchStudents
>("student/fetchStudents", async (data) => {
  const url = `/api/v1/registrar/students`;

  const config: AxiosRequestConfig = {
    url,
    method: "GET",
    params: {
      page: data.page,
      limit: data.limit,
      name: data.name,
      status: data.status,
    },
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      return response.data;
    } else {
      toast.error("Fetch students failed");
      throw new Error("Fetch students failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Fetch students failed");
    throw new Error(error.response?.data?.error || "Fetch students failed");
  }
});

export const handleGetSingleStudent = createAsyncThunk<
  StudentRecieved,
  { id: number }
>("student/getstudent", async (data) => {
  const url = `/api/v1/registrar/student/${data.id}`;

  const config: AxiosRequestConfig = {
    url,
    method: "GET",
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      return response.data.data;
    } else {
      toast.error("Fetch student failed");
      throw new Error("Fetch student failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Fetch student failed");
    throw new Error(error.response?.data?.error || "Fetch student failed");
  }
});

export const handleCreateStudent = createAsyncThunk<
  StudentRecieved,
  DataSendToCreateStudent
>("student/createStudent", async (data) => {
  const url = `/api/v1/registrar/student/create`;
  const config: AxiosRequestConfig = {
    url,
    method: "POST",
    data,
  };
  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("Student created successfully");
      return response.data.data;
    } else {
      toast.error("Create Student failed");
      throw new Error("Create Student failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Create Student failed");
    throw new Error(error.response?.data?.error || "Create Student failed");
  }
});

export const handleUpdateStudent = createAsyncThunk<
  StudentRecieved,
  DataSendToCreateStudent
>("student/updateStudent", async (data) => {
  const url = `/api/v1/registrar/student/edit/${data.id}`;
  const config: AxiosRequestConfig = {
    url,
    method: "PATCH",
    data,
  };
  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("Student updated successfully");
      return response.data.data;
    } else {
      toast.error("Update Student failed");
      throw new Error("Update Student failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Update Student failed");
    throw new Error(error.response?.data?.error || "Update Student failed");
  }
});

export const handleUpdateStudentPhoto = createAsyncThunk<
  StudentRecieved,
  DataSendToUpdateStudent
>("student/updateStudentPhoto", async (data) => {
  const url = `/api/v1/registrar/student/photo/${data.ID}`;

  const config: AxiosRequestConfig = {
    url,
    method: "PATCH",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("Student updated successfully");
      return response.data.data;
    } else {
      toast.error("Update Student failed");
      throw new Error("Update Student failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Update Student failed");
    throw new Error(error.response?.data?.error || "Update Student failed");
  }
});

export const handleUpdateStudentCard = createAsyncThunk<
  StudentRecieved,
  DataSendToUpdateStudent
>("student/updateStudentCard", async (data) => {
  const url = `/api/v1/registrar/student/card/${data.ID}`;

  const config: AxiosRequestConfig = {
    url,
    method: "PATCH",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("Student updated successfully");
      return response.data.data;
    } else {
      toast.error("Update Student failed");
      throw new Error("Update Student failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Update Student failed");
    throw new Error(error.response?.data?.error || "Update Student failed");
  }
});

export const handleUpdateStudentStatus = createAsyncThunk<
  StudentRecieved,
  DataSendToUpdateStudent
>("student/updateStudentStatus", async (data) => {
  const url = `/api/v1/registrar/student/status/${data.ID}`;

  const config: AxiosRequestConfig = {
    url,
    method: "PATCH",
    data: data,
  };

  try {
    const response = await apiClient(config);
    if (response.data) {
      toast.success("Student updated successfully");
      return response.data;
    } else {
      toast.error("Update Student failed");
      throw new Error("Update Student failed");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Update Student failed");
    throw new Error(error.response?.data?.error || "Update Student failed");
  }
});

export const handleGetDashboardInformationForStudent =
  createAsyncThunk<DataForDashboard>("user/dashboard", async () => {
    const url = `/api/v1/registrar/dashboard`;

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
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Fetch dashboard information failed"
      );
      throw new Error(
        error.response?.data?.error || "Fetch dashboard information failed"
      );
    }
  });

export const {} = studentSlice.actions;
export default studentSlice.reducer;
