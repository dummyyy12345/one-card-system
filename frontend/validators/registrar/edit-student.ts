import * as yup from "yup";
import type { DataSendToCreateStudent } from "@/store/slices/registrarSlice/students";
import { SexType, StatusType } from "@/store/slices/registrarSlice/types";

export const editStudentSchema = (t: (key: string) => string) =>
  yup.object({
    card_number: yup
      .string()
      .required(t("cardnumberrequired"))
      .min(8, t("cardnumberminlength"))
      .max(8, t("cardnumbermaxlength")),
    status: yup.string().required("statusrequired"),
    photo: yup.string().required("photorequired"),
  });

export const createStudentSchema = (
  t: (key: string) => string
): yup.ObjectSchema<DataSendToCreateStudent> =>
  yup.object({
    id: yup.number().optional(),
    first_name: yup.string().required(t("firstnamerequired")),
    father_name: yup.string().required(t("fathernamerequired")),
    grand_father_name: yup.string().required(t("grandfathernamerequired")),
    email: yup.string().email(t("emailinvalid")).required(t("emailrequired")),
    phone: yup
      .string()
      .matches(/^0\d{9}$/, t("phoneinvalid"))
      .required(t("phonerequired")),
    sex: yup
      .mixed<SexType>()
      .oneOf(Object.values(SexType), t("sexinvalid"))
      .required(t("sexrequired")),
    date_of_birth: yup
      .date()
      .max(new Date(), t("dateofbirthinvalid"))
      .required(t("dateofbirthrequired")),
    program: yup.string().required(t("programrequired")),
    section: yup.string().required(t("sectionrequired")),
    year: yup.number().min(1, t("yearinvalid")).required(t("yearrequired")),
    semester: yup
      .number()
      .min(1, t("semesterinvalid"))
      .required(t("semesterrequired")),
    religion: yup.string().required(t("religionrequired")),
    status: yup
      .string()
      .oneOf(Object.values(StatusType), t("statusinvalid"))
      .required(t("statusrequired")),
    is_manually_add: yup.boolean().required(),
    student_id: yup.string().required(t("studentidrequired")),
    library_id: yup.number().min(1, t("libraryidinvalid")).nullable().defined(),
    cafeteria_id: yup
      .number()
      .min(1, t("cafeteriaidinvalid"))
      .nullable()
      .defined(),
    dormitory_id: yup
      .number()
      .min(1, t("dormitoryidinvalid"))
      .nullable()
      .defined(),
    registered_by_id: yup
      .number()
      .min(1, t("registeredbyrequired"))
      .nullable()
      .defined(),
  });

export type createStudentSchemaType = yup.InferType<
  ReturnType<typeof createStudentSchema>
>;
