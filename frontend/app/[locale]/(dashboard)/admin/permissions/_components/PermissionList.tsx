import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import {
  handleDeletePermission,
  PermissionReceived,
  resetPermissionUpdateSuccess,
} from "@/store/slices/adminSlice/permission";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { EditIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { FaSpinner } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import AddPermissions from "./AddPermission";

const PermissionList = ({ searchTerm }: { searchTerm: string }) => {
  const t = useTranslations("permission");
  const dispatch = useDispatch();
  const { permissions, isPermissionLoading, isPermissionDeleteLoading } =
    useSelector((state: RootState) => state.permission);
  const [permissionToDisplay, setPermissionToDisplay] =
    useState<PermissionReceived[]>(permissions);
  useEffect(() => {
    if (searchTerm) {
      setPermissionToDisplay(
        permissions.filter((permission) =>
          permission.permissions_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setPermissionToDisplay(permissions);
    }
  }, [searchTerm, permissions, dispatch]);

  return (
    <div className="relative rounded-xl p-0 h-[calc(100vh-120px)] flex flex-col gap-y-2">
      {isPermissionLoading ? (
        <div className="flex flex-col items-center w-full gap-y-8 mt-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="w-full h-[44px] rounded-sm" />
          ))}
        </div>
      ) : permissions.length === 0 ? (
        <p>{t("nopermission")}</p>
      ) : (
        <Table className="mt-3">
          <TableHeader>
            <TableRow>
              <TableHead>{t("permissionname")}</TableHead>
              <TableHead>{t("permissiondescription")}</TableHead>
              <TableHead className="text-center">{t("edit")}</TableHead>
              <TableHead className="text-center">{t("delete")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissionToDisplay.map((permission, index) => (
              <TableRow
                key={permission.ID}
                className={cn(
                  index % 2 === 0 ? "" : "bg-secondary",
                  "hover:bg-primary-foreground"
                )}
              >
                <TableCell>{permission.permissions_name}</TableCell>
                <TableCell>
                  {permission.description.length > 70
                    ? `${permission.description.slice(0, 70)}...`
                    : `${permission.description}`}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger
                      asChild
                      className="w-full cursor-pointer text-center"
                      onClick={() => dispatch(resetPermissionUpdateSuccess())}
                    >
                      <EditIcon size={20} className="text-yellow-600" />
                    </DialogTrigger>
                    <AddPermissions permission={permission} />
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
                          {t("areyousuretodeletepermission")}
                          <span className="text-[#3A5DD9] italic underline block">{`${permission.permissions_name} `}</span>
                        </p>
                      </DialogHeader>
                      <div className="flex items-center justify-evenly">
                        <DialogClose className="bg-red-700 hover:bg-red-800 px-7 py-2 rounded-sm text-white lowercase">
                          {t("cancel")}
                        </DialogClose>
                        <Button
                          className="bg-green-700 hover:bg-green-800 px-7 text-white lowercase"
                          onClick={() =>
                            dispatch<any>(
                              handleDeletePermission({ id: permission.ID })
                            )
                          }
                          disabled={isPermissionDeleteLoading}
                        >
                          {t("confirm")}
                          {isPermissionDeleteLoading && (
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

export default PermissionList;
