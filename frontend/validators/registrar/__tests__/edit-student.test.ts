import { SexType, StatusType } from "@/store/slices/registrarSlice/types";
import { createStudentSchema } from "../edit-student";

const schema = createStudentSchema((key) => key);
const student = {
  first_name: "Ada",
  father_name: "Hailu",
  grand_father_name: "Tesfaye",
  email: "ada@example.com",
  phone: "0123456789",
  sex: SexType.Female,
  date_of_birth: new Date("2000-01-01"),
  program: "Computer Science",
  section: "A",
  year: 2,
  semester: 1,
  religion: "Other",
  status: StatusType.Active,
  student_id: "ST-123",
  is_manually_add: true,
  library_id: null,
  cafeteria_id: null,
  dormitory_id: null,
  registered_by_id: null,
};

it("accepts a complete student creation payload", async () => {
  await expect(schema.validate(student)).resolves.toMatchObject(student);
});

it("requires the manual registration flag", async () => {
  await expect(
    schema.validate({ ...student, is_manually_add: undefined })
  ).rejects.toThrow();
});

it("rejects an unsupported sex value", async () => {
  await expect(schema.validate({ ...student, sex: "Unknown" })).rejects.toThrow(
    "sexinvalid"
  );
});
