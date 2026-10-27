import type { UserRecieved } from "../adminSlice/user";

export enum SexType {
  Male = "Male",
  Female = "Female",
}

export enum StatusType {
  Active = "Active",
  Inactive = "Inactive",
}

export interface StudentRecieved {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
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
  library_assigned: LibraryRecieved;
  cafeteria_id: number;
  cafeteria_assigned: CafeRecieved;
  dormitory_id: number;
  dormitory_assigned: DormRecieved;
  registered_by_id: number;
  registered_by: UserRecieved;
  registered_date: Date;
  status: StatusType;
  is_manually_add: boolean;
}

export interface LibraryRecieved {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  library_name: string;
  campus: string;
  block_number: string;
  registered_by: number;
}

export interface CafeRecieved {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  cafeteria_name: string;
  campus: string;
  block_number: string;
  registered_by: number;
}
export interface DormRecieved {
  ID: number;
  CreatedAt: Date;
  UpdatedAt: Date;
  DeletedAt: Date | null;
  dormitory_name: string;
  campus: string;
  block_number: string;
  registered_by: number;
}

export interface DataForDashboard {
  totalStudents: number;
  // totalClasses: number;
  // totalDepartments: number;
  // totalDormitories: number;
  studentsByCategory: {
    category: string;
    count: number;
  }[];
}

export interface StudentState {
  students: StudentRecieved[];
  student: StudentRecieved | null;
  isCreateStudentLoading: boolean;
  isCreateStudentError: string | null;
  isUpdateStudentLoading: boolean;
  isGetStudentLoading: boolean;
  isGetStudentError: string | null;
  currentPage: number;
  totalPages: number;
  isUpdateStudentPhotoLoading: boolean;
  isUpdateStudentCardLoading: boolean;
  isUpdateStudentError: null | string;
  totalStudents: number;
  isGetStudentForDashboardLoading: boolean;
  isGetStudentForDashboardError: null | string;
  studentDataForDashboard: DataForDashboard | null;
}
