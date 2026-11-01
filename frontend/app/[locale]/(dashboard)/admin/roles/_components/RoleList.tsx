import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import {
  handleDeleteRole,
  resetRoleUpdateSuccess,
  RoleReceived,
} from "@/store/slices/adminSlice/role";
import { FaListAlt, FaSpinner } from "react-icons/fa";
import { EditIcon } from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import AddRole from "./AddRole";

const RoleList = ({ searchTerm }: { searchTerm: string }) => {
  const t = useTranslations("roles");
  const dispatch = useDispatch();
  const router = useRouter();
  const locale = usePathname().split("/")[1];
  const {
    roles,
    isRoleError,
    isRoleLoading,
    isRoleDeleteLoading,
    isRoleDeleteSuccess,
  } = useSelector((state: RootState) => state.role);
  const [rolesToDisplay, setRolesToDisplay] = useState<RoleReceived[]>(roles);

  useEffect(() => {
    if (searchTerm) {
      setRolesToDisplay(
        roles.filter((role) =>
          role.role_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setRolesToDisplay(roles);
    }
  }, [dispatch, searchTerm, roles]);

  return (
    <div className="relative rounded-xl p-0 h-[calc(100vh-120px)] flex flex-col gap-y-2">
      {isRoleLoading ? (
        <div className="flex flex-col items-center w-full gap-y-8 mt-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="w-full h-[44px] rounded-sm" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <p>{"norolefound"}</p>
      ) : (
        <Table className="mt-3">
          <TableHeader>
            <TableRow>
              <TableHead>{t("rolename")}</TableHead>
              <TableHead>{t("roledescription")}</TableHead>
              <TableHead className="text-center">{t("details")}</TableHead>
              <TableHead className="text-center">{t("edit")}</TableHead>
              <TableHead className="text-center">{t("delete")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rolesToDisplay.map((role, index) => (
              <TableRow
                key={role.ID}
                className={cn(
                  index % 2 === 0 ? "" : "bg-secondary",
                  "hover:bg-primary-foreground"
                )}
              >
                <TableCell>{role.role_name}</TableCell>
                <TableCell>
                  {role.description.length > 70
                    ? `${role.description.slice(0, 70)}...`
                    : `${role.description}`}
                </TableCell>
                <TableCell className="flex justify-center">
                  <FaListAlt
                    size={20}
                    className="text-green-600 cursor-pointer"
                    onClick={() =>
                      router.push(`/${locale}/admin/roles/${role.ID}`)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger
                      asChild
                      className="w-full cursor-pointer text-center"
                      onClick={() => dispatch<any>(resetRoleUpdateSuccess())}
                    >
                      <EditIcon size={20} className="text-yellow-600" />
                    </DialogTrigger>
                    <AddRole role={role} />
                  </Dialog>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger
                      asChild
                      className="w-full cursor-pointer text-center"
                    >
                      <MdDelete size={20} className="text-red-600" />
                    </DialogTrigger>
                    <DialogContent className="max-w-sm text-center flex flex-col gap-y-8">
                      <DialogHeader className="mt-4 mx-2">
                        <p className="text-center">
                          {t("suretodelete")}
                          <span className="text-[#3A5DD9] italic underline block">{` ${role.role_name} `}</span>
                        </p>
                      </DialogHeader>
                      <div className="flex items-center justify-evenly">
                        <DialogClose
                          className="bg-red-700 hover:bg-red-800 px-7 py-2 rounded-sm text-white lowercase"
                          disabled={isRoleDeleteLoading}
                        >
                          {t("cancel")}
                        </DialogClose>
                        <Button
                          className="bg-green-700 hover:bg-green-800 px-7 text-white lowercase"
                          onClick={() =>
                            dispatch<any>(handleDeleteRole({ id: role.ID }))
                          }
                          disabled={isRoleDeleteLoading}
                        >
                          {t("confirm")}
                          {isRoleDeleteLoading && (
                            <FaSpinner className="animate-spin ml-2 text-white text-xs" />
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default RoleList;
