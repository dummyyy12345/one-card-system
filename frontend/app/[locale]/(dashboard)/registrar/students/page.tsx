"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ImLoop2 } from "react-icons/im";
import { MdOutlinePersonAddAlt1 } from "react-icons/md";
import { usePathname, useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/store";
import { handleFetchStudents } from "@/store/slices/registrarSlice/students";
import SelectLimit from "@/app/[locale]/(dashboard)/registrar/_components/SelectLimit";
import StudentsList from "./_components/StudentsList";
import StatusFilter from "../_components/StatusFilter";
import CustomDebounceSearch from "@/components/inputs/CustomDebounceSearch";
import { useTranslations } from "next-intl";

const StudentsPage = () => {
  const t = useTranslations("student");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const locale = usePathname().split("/")[1];
  const [limit, setLimit] = useState<number>(10);
  const [status, setStatus] = useState<string>("Active");
  const [name, setName] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const { isGetStudentLoading } = useSelector(
    (state: RootState) => state.student
  );

  const refetchStudents = () => {
    if (page !== 1) {
      setPage(1);
      return;
    }
    dispatch(handleFetchStudents({ page: 1, limit, name, status }));
  };

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-6">
            <button
              type="button"
              aria-label={t("refreshstudents")}
              disabled={isGetStudentLoading}
              className="h-8 w-8 bg-[#3A5DD9] hover:bg-[#2a4bc6] flex items-center justify-center rounded-sm cursor-pointer"
              onClick={refetchStudents}
            >
              <ImLoop2
                className={`text-sm transition-transform duration-500 text-white ${
                  isGetStudentLoading ? "animate-spin" : ""
                }`}
              />
            </button>
            <SelectLimit limit={limit} setLimit={setLimit} />
            <StatusFilter status={status} setStatus={setStatus} />
          </div>
          <div className="flex items-center gap-x-20">
            <CustomDebounceSearch
              value={name}
              onChange={setName}
              placeholder={t("searchbyname")}
              className="min-w-[350px]"
              delay={1000}
            />
            <button
              type="button"
              aria-label={t("addstudent")}
              className="h-8 w-8 bg-[#3A5DD9] hover:bg-[#2a4bc6] flex items-center justify-center rounded-sm cursor-pointer"
              onClick={() => router.push(`/${locale}/registrar/students/form`)}
            >
              <MdOutlinePersonAddAlt1 aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <StudentsList
        limit={limit}
        name={name}
        page={page}
        setPage={setPage}
        status={status}
      />
    </div>
  );
};

export default StudentsPage;
