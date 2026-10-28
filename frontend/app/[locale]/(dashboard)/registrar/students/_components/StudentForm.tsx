import CustomDatePicker from "@/components/inputs/customDatePicker";
import CustomInputWithLabel from "@/components/inputs/customInputWithLabel";
import CustomSelectWithLabel from "@/components/inputs/customSelectWithLabel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppDispatch, RootState } from "@/store";
import {
  DataSendToCreateStudent,
  DataSendToUpdateStudent,
  handleCreateStudent,
  handleUpdateStudent,
  handleUpdateStudentCard,
  handleUpdateStudentPhoto,
  SexType,
  SexType as SexTypeEnum,
  StatusType,
  StudentRecieved,
} from "@/store/slices/registrarSlice/students";
import { createStudentSchema } from "@/validators/registrar/edit-student";
import { yupResolver } from "@hookform/resolvers/yup";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FaSpinner } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import Webcam from "react-webcam";
import { toast } from "sonner";

type Props = {
  student?: StudentRecieved;
};
export default function StudentForm({ student }: Props) {
  const t = useTranslations("addStudent");
  const dispatch = useDispatch<AppDispatch>();
  const webcamRef = useRef<Webcam | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState<string | null>(null);
  const [newStudentCreated, setNewStudentCreated] =
    useState<StudentRecieved | null>(null);

  const {
    isUpdateStudentCardLoading,
    isUpdateStudentPhotoLoading,
    isCreateStudentLoading,
    isUpdateStudentLoading,
  } = useSelector((state: RootState) => state.student);

  const updateStudentCardNumber = () => {
    if (cardNumber == null) {
      toast.error("Card number is required");
      return;
    }
    if (!/^\d{8}$/.test(cardNumber)) {
      toast.error("Card number must be 8 digits");
      return;
    }
    dispatch(
      handleUpdateStudentCard({
        ...(newStudentCreated ?? student),
        card_number: cardNumber,
      } as DataSendToUpdateStudent)
    );
  };
  const captureImage = () => {
    if (webcamRef.current) {
      const capturedImage = webcamRef.current.getScreenshot();
      if (capturedImage) {
        setImage(capturedImage.split(",")[1]);
      }
    }
  };
  const saveImage = () => {
    if (image === null) {
      toast.error("Image is required");
      return;
    }
    dispatch(
      handleUpdateStudentPhoto({
        ...(newStudentCreated ?? student),
        photo: image,
      } as DataSendToUpdateStudent)
    );
  };

  const deleteImage = () => {
    setImage(null);
  };

  const defaultValues: DataSendToCreateStudent = {
    id: student?.ID ?? undefined,
    first_name: student?.first_name ?? "",
    father_name: student?.father_name ?? "",
    grand_father_name: student?.grand_father_name ?? "",
    email: student?.email ?? "",
    phone: student?.phone ?? "",
    sex: student?.sex ?? SexType.Male,
    date_of_birth: student?.date_of_birth
      ? new Date(student.date_of_birth)
      : new Date(),
    program: student?.program ?? "",
    section: student?.section ?? "",
    year: student?.year ?? 1,
    semester: student?.semester ?? 1,
    religion: student?.religion ?? "",
    library_id: student?.library_id ?? null,
    cafeteria_id: student?.cafeteria_id ?? null,
    dormitory_id: student?.dormitory_id ?? null,
    registered_by_id: student?.registered_by_id ?? null,
    student_id: student?.student_id ?? "",
    status: student?.status ?? StatusType.Active,
    is_manually_add: student?.is_manually_add ?? true,
  };

  const form = useForm<DataSendToCreateStudent>({
    defaultValues,
    resolver: yupResolver(createStudentSchema(t)),
  });

  const onSubmit = (data: DataSendToCreateStudent) => {
    if (student?.ID) {
      dispatch(handleUpdateStudent(data));
    } else {
      dispatch(handleCreateStudent(data)).then((res) => {
        if (handleCreateStudent.fulfilled.match(res)) {
          setNewStudentCreated(res.payload);
        }
      });
    }
  };

  return (
    <div className="flex items-start gap-x-8">
      <>
        {image ? (
          <div className="col-span-4">
            <div className="h-64 w-64 relative rounded-sm overflow-hidden">
              <Image
                src={`data:image/jpeg;base64,${image}`}
                fill
                className="object-cover rounded-sm"
                alt="Student Image"
              />
            </div>
          </div>
        ) : student?.photo ? (
          <div className="col-span-4">
            <div className="h-64 w-64 relative rounded-sm overflow-hidden">
              <Image
                src={`data:image/jpeg;base64,${student.photo}`}
                fill
                className="object-cover rounded-sm"
                alt="Student Image"
              />
            </div>
          </div>
        ) : (
          <User className="h-64 w-64 border-[10px] border-gray-200 rounded-lg" />
        )}
      </>
      <div className="flex flex-col gap-y-8 w-full">
        <Form {...form}>
          <form
            className="w-full space-y-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <h1 className="text-2xl">STUDENT BASIC INFORMATION</h1>
            <div className="grid grid-cols-3 gap-4 items-center">
              <CustomInputWithLabel
                fieldTitle="First Name"
                nameInSchema="first_name"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomInputWithLabel
                fieldTitle="Father Name"
                nameInSchema="father_name"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomInputWithLabel
                fieldTitle="Grand Father Name"
                nameInSchema="grand_father_name"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomInputWithLabel
                fieldTitle="Student Id"
                nameInSchema="student_id"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomInputWithLabel
                fieldTitle="Email"
                nameInSchema="email"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomInputWithLabel
                fieldTitle="Phone Number"
                nameInSchema="phone"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomSelectWithLabel
                fieldTitle="Sex"
                nameInSchema="sex"
                disabled={!!student?.ID && !student?.is_manually_add}
                data={[
                  {
                    id: "Male",
                    name: "Male",
                    description: "Male Student",
                  },
                  {
                    id: "Female",
                    name: "Female",
                    description: "Female Student",
                  },
                ]}
              />
              <CustomDatePicker
                fieldTitle="Date Of Birth"
                nameInSchema="date_of_birth"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomInputWithLabel
                fieldTitle="Program"
                nameInSchema="program"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomInputWithLabel
                fieldTitle="Year"
                nameInSchema="year"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomInputWithLabel
                fieldTitle="Semester"
                nameInSchema="semester"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomInputWithLabel
                fieldTitle="Section"
                nameInSchema="section"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomInputWithLabel
                fieldTitle="Religion"
                nameInSchema="religion"
                disabled={!!student?.ID && !student?.is_manually_add}
              />
              <CustomSelectWithLabel
                fieldTitle="Status"
                nameInSchema="status"
                data={[
                  {
                    id: "Active",
                    name: "Active",
                    description: "Active Student",
                  },
                  {
                    id: "Inactive",
                    name: "Inactive",
                    description: "Inactive Student",
                  },
                ]}
              />
              <div className="col-span-1 flex justify-center h-full items-end w-full">
                <Button
                  type="submit"
                  disabled={isCreateStudentLoading || isUpdateStudentLoading}
                  className="py-2 w-full"
                >
                  <span>
                    {student?.ID ? t("editstudent") : t("createstudent")}
                  </span>
                  {(isUpdateStudentLoading || isCreateStudentLoading) && (
                    <FaSpinner className="animate-spin ml-2" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
        <div>
          <h1 className="text-2xl">ADDITIONAL STUDENT INFORMATION</h1>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex flex-col gap-y-1 items-start">
              <Label htmlFor="card_number">{t("cardnumber")}</Label>
              <div className="flex gap-x-2 items-baseline w-full">
                <Input
                  id="card_number"
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder={t("entercardnumber")}
                  className="w-2/3"
                />
                <Button
                  className="w-1/3 flex items-center justify-center gap-x-2"
                  disabled={
                    isUpdateStudentCardLoading ||
                    student?.status === "Inactive" ||
                    (student?.ID === undefined &&
                      newStudentCreated?.ID === undefined)
                  }
                  onClick={updateStudentCardNumber}
                >
                  Save
                  {isUpdateStudentCardLoading ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : null}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-y-2 items-start">
              <Label htmlFor="status">Picture</Label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    disabled={
                      student?.status === "Inactive" ||
                      (student?.ID === undefined &&
                        newStudentCreated?.ID === undefined)
                    }
                  >
                    Take a picture
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[650px] sm:max-h-[700px]">
                  <DialogHeader>
                    <DialogTitle>Take picture</DialogTitle>
                    <DialogDescription>
                      Please position the student appropriately before taking
                      the picture.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center gap-4">
                    {!image ? (
                      <>
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="w-full rounded-md"
                        />
                        <Button
                          onClick={() =>
                            (student?.ID || newStudentCreated) && captureImage()
                          }
                          className="w-full py-6"
                        >
                          Capture Image
                        </Button>
                        <Button onClick={saveImage} className="w-full py-6">
                          Save Image
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <Image
                          src={`data:image/jpeg;base64,${image}`}
                          width={100}
                          height={100}
                          alt="Captured"
                          className="w-full rounded-md"
                        />
                        <div className="flex gap-2 w-full">
                          <Button
                            onClick={deleteImage}
                            className="w-1/2 py-6 bg-red-700 hover:bg-red-800 text-white"
                            disabled={isUpdateStudentPhotoLoading}
                          >
                            Delete
                          </Button>
                          <Button
                            className="w-1/2 flex items-center justify-center gap-x-2 py-6"
                            onClick={() =>
                              (student?.ID || newStudentCreated) && saveImage()
                            }
                            disabled={isUpdateStudentPhotoLoading}
                          >
                            Save Image
                            {isUpdateStudentPhotoLoading ? (
                              <FaSpinner className="animate-spin mr-2" />
                            ) : null}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <DialogClose
                      onClick={() => setImage(null)}
                      className="bg-red-700 hover:bg-red-800 w-full py-4 px-4 text-sm rounded-md"
                      disabled={isUpdateStudentPhotoLoading}
                    >
                      Cancel
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
