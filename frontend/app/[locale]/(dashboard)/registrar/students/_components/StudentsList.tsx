import { RootState } from "@/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { EditIcon, IdCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { handleFetchStudents } from "@/store/slices/registrarSlice/students";
import StudentsDisplayLoading from "./StudentsDisplayLoading";
import StudentSyncStatus from "@/components/access/StudentSyncStatus";

const StudentsList = ({
  limit,
  name,
  page,
  setPage,
  status,
}: {
  page: number;
  setPage: (prev: number) => void;
  limit: number;
  name?: string;
  status: string;
}) => {
  const t = useTranslations("adminusers");
  const dispatch = useDispatch();
  const router = useRouter();
  const locale = usePathname().split("/")[1];
  const {
    students,
    isGetStudentLoading,
    isGetStudentError,
    currentPage,
    totalPages,
    totalStudents,
  } = useSelector((state: RootState) => state.student);

  useEffect(() => {
    dispatch<any>(
      handleFetchStudents({ page, limit, name: name ?? "", status })
    );
  }, [dispatch, page, limit, name, status]);

  const renderPageNumbers = () => {
    let pagesToDisplay = [];
    if (currentPage > 2) {
      pagesToDisplay.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(totalPages, currentPage + 1);
      i++
    ) {
      pagesToDisplay.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            className={
              currentPage === i
                ? "rounded-sm border-2 border-primary m-2 text-xs h-10 w-10 flex items-center justify-center"
                : "bg-transparent rounded-sm hover:bg-background/90 hover:rounded-sm hover:h-8 hover:w-8"
            }
            onClick={() => setPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (currentPage < totalPages - 1) {
      pagesToDisplay.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    return pagesToDisplay;
  };

  if (isGetStudentLoading) {
    return <StudentsDisplayLoading />;
  } else if (students?.length === 0) {
    return <div className="text-[#3A5DD9]">{t("nouser")}</div>;
  } else {
    return (
      <div className="relative rounded-xl p-0 h-[calc(100vh-120px)] flex flex-col gap-y-2">
        <div className="h-5/6 flex-1 rounded-xl rounded-bl-none rounded-br-none overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Id</TableHead>
                <TableHead>{t("firstname")}</TableHead>
                <TableHead>{t("fathername")}</TableHead>
                <TableHead>{t("grandfathername")}</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Card Number</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Semister</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Religion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Device sync</TableHead>
                <TableHead className="">{t("edit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.map((student, index) => (
                <TableRow
                  key={student.ID}
                  className={cn(
                    index % 2 === 0 ? "" : "bg-secondary",
                    "hover:bg-primary-foreground",
                    "h-8"
                  )}
                >
                  <TableCell>{student.student_id}</TableCell>
                  <TableCell>{student.first_name}</TableCell>
                  <TableCell>{student.father_name}</TableCell>
                  <TableCell>{student.grand_father_name}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell className="text-center grid place-items-center">
                    {student.card_number ? <IdCard /> : "-"}
                  </TableCell>
                  <TableCell className="text-center">{student.sex}</TableCell>
                  <TableCell className="text-center">
                    {student.program}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.semester}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.section}
                  </TableCell>
                  <TableCell>{student.religion}</TableCell>
                  <TableCell>{student.status}</TableCell>
                  <TableCell>
                    <StudentSyncStatus studentId={student.ID} />
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-center"
                    onClick={() =>
                      router.push(
                        `/${locale}/registrar/students/form/?studentId=${student.ID}`
                      )
                    }
                  >
                    <EditIcon size={20} className="text-yellow-600" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination className=" rounded-none">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={cn(
                  `${
                    currentPage === 1 ? "opacity-35 cursor-default" : ""
                  } bg-secondary-foreground/15 hover:bg-secondary-foreground/25 text-xs`
                )}
                onClick={() => setPage(Math.max(currentPage - 1, 1))}
              />
            </PaginationItem>

            {renderPageNumbers()}

            <PaginationItem>
              <PaginationNext
                href="#"
                className={cn(
                  `${
                    currentPage === totalPages
                      ? "opacity-35 cursor-default"
                      : ""
                  } bg-secondary-foreground/15 hover:bg-secondary-foreground/25 text-xs`
                )}
                onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }
};

export default StudentsList;
