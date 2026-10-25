import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosRequestConfig } from "axios";
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
    builder
      .addCase(handleCreateStudent.pending, (state) => {
        state.student = null;
        state.isCreateStudentLoading = true;
        state.isCreateStudentError = null;
      })
      .addCase(
        handleCreateStudent.fulfilled,
        (state, action: PayloadAction<StudentRecieved>) => {
          state.isCreateStudentLoading = false;
          state.isCreateStudentError = null;
          state.student = action.payload;
        }
      )
      .addCase(handleCreateStudent.rejected, (state, action) => {
        state.student = null;
        state.isCreateStudentLoading = false;
        state.isCreateStudentError =
          action.error.message || "Create Student Failed";
      })
      .addCase(handleUpdateStudent.pending, (state) => {
        state.isUpdateStudentLoading = true;
        state.isUpdateStudentError = null;
      })
      .addCase(
        handleUpdateStudent.fulfilled,
        (state, action: PayloadAction<StudentRecieved>) => {
          state.isUpdateStudentLoading = false;
          state.isUpdateStudentError = null;
          state.student = action.payload;
        }
      )
      .addCase(handleUpdateStudent.rejected, (state, action) => {
        state.isUpdateStudentLoading = false;
        state.isUpdateStudentError =
          action.error.message || "Create Student Failed";
      })
      .addCase(handleFetchStudents.pending, (state) => {
        state.isGetStudentLoading = true;
        state.isGetStudentError = null;
      })
      .addCase(
        handleFetchStudents.fulfilled,
        (state, action: PayloadAction<DataRecievedWhileFetchStudents>) => {
          state.students = action.payload.data;
          state.currentPage = action.payload.currentPage;
          state.totalPages = action.payload.totalPages;
          state.totalStudents = action.payload.totalStudents;
          state.isGetStudentLoading = false;
          state.isGetStudentError = null;
        }
      )
      .addCase(handleFetchStudents.rejected, (state, action) => {
        state.isGetStudentLoading = false;
        state.isGetStudentError =
          action.error.message || "Fetch students failed";
      });
    builder
      .addCase(handleGetSingleStudent.pending, (state) => {
        state.isGetStudentLoading = true;
        state.isGetStudentError = null;
        state.student = null;
      })
      .addCase(
        handleGetSingleStudent.fulfilled,
        (state, action: PayloadAction<StudentRecieved>) => {
          state.student = action.payload;
          state.isGetStudentLoading = false;
          state.isGetStudentError = null;
        }
      )
      .addCase(handleGetSingleStudent.rejected, (state, action) => {
        state.student = null;
        state.isGetStudentLoading = false;
        state.isGetStudentError =
          action.error.message || "Fetch students failed";
      });
    builder
      .addCase(handleUpdateStudentPhoto.pending, (state) => {
        state.isUpdateStudentPhotoLoading = true;
        state.isUpdateStudentError = null;
      })
      .addCase(
        handleUpdateStudentPhoto.fulfilled,
        (state, action: PayloadAction<StudentRecieved>) => {
          state.student = action.payload;
          state.isUpdateStudentPhotoLoading = false;
          state.isUpdateStudentError = null;
        }
      )
      .addCase(handleUpdateStudentPhoto.rejected, (state, action) => {
        state.isUpdateStudentPhotoLoading = false;
        state.isUpdateStudentError =
          action.error.message || "Fetch students failed";
      });

    builder
      .addCase(handleUpdateStudentCard.pending, (state) => {
        state.isUpdateStudentCardLoading = true;
        state.isUpdateStudentError = null;
      })
      .addCase(
        handleUpdateStudentCard.fulfilled,
        (state, action: PayloadAction<StudentRecieved>) => {
          state.student = action.payload;
          state.isUpdateStudentCardLoading = false;
          state.isUpdateStudentError = null;
        }
      )
      .addCase(handleUpdateStudentCard.rejected, (state, action) => {
        state.isUpdateStudentCardLoading = false;
        state.isUpdateStudentError =
          action.error.message || "Fetch students failed";
      })
      .addCase(handleGetDashboardInformationForStudent.pending, (state) => {
        state.isGetStudentForDashboardLoading = true;
        state.isGetStudentForDashboardError = null;
      })
      .addCase(
        handleGetDashboardInformationForStudent.fulfilled,
        (state, action) => {
          state.isGetStudentForDashboardLoading = false;
          state.studentDataForDashboard = action.payload;
        }
      )
      .addCase(
        handleGetDashboardInformationForStudent.rejected,
        (state, action) => {
          state.studentDataForDashboard = null;
          state.isGetStudentForDashboardLoading = false;
          state.isGetStudentForDashboardError =
            action.error.message || "Fetch users failed";
        }
      );
  },
});

export const handleFetchStudents = createAsyncThunk<
  DataRecievedWhileFetchStudents,
  DataSendToFetchStudents
>("student/fetchStudents", async (data) => {
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/registrar/students`;

  const config: AxiosRequestConfig = {
    url,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      page: data.page,
      limit: data.limit,
      name: data.name,
      status: data.status,
    },
    withCredentials: true,
  };

  try {
    const response = await axios(config);
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
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/registrar/student/${data.id}`;

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
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/registrar/student/create`;
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
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/registrar/student/edit/${data.id}`;
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
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/registrar/student/photo/${data.ID}`;

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
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/registrar/student/card/${data.ID}`;

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
  const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/registrar/student/status/${data.ID}`;

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
    const url = `${process.env.NEXT_PUBLIC_API_SERVER_URL}/api/v1/registrar/dashboard`;

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
