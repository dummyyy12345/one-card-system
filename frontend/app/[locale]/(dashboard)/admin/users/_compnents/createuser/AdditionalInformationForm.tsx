import { useDispatch, useSelector } from "react-redux";
import CreateUserFooter from "./CreateUserFooter";
import { useEffect, useState } from "react";
import { handleFetchPermissionForSpecificRole } from "@/store/slices/adminSlice/rolepermission";
import { RootState } from "@/store";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FaSpinner } from "react-icons/fa";
import { DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataSendToCreateUserPermission,
  handleCreateUserPermission,
  handleFetchUserPermission,
} from "@/store/slices/adminSlice/userpermission";
import {
  increareCurrentPage,
  UserRecieved,
} from "@/store/slices/adminSlice/user";
import { useTranslations } from "next-intl";
import { handleFetchDevice } from "@/store/slices/adminSlice/device";
import CustomCheckBoxWithLabel from "@/components/inputs/customCheckBoxWithLabel";

const AdditionalInformationForm = () => {
  const t = useTranslations("adminusers");
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  const { rolePermissions, isRolePermissionLoading, isRolePermissionError } =
    useSelector((state: RootState) => state.rolePermission);
  const {
    userPermissions,
    isUserPermissionCreateLoading,
    isUserPermissionLoading,
    isUserPermissionError,
  } = useSelector((state: RootState) => state.userPermission);

  const allowedUserPermissions = rolePermissions.map((permission) => ({
    id: permission.permission_id,
    name: permission.permission.permissions_name,
    description: permission.permission.description,
  }));
  const { devices, isDeviceLoading } = useSelector(
    (state: RootState) => state.device
  );

  useEffect(() => {
    if (user?.role_id !== undefined) {
      dispatch<any>(
        handleFetchPermissionForSpecificRole({ role_id: user.role_id })
      );
      dispatch<any>(handleFetchUserPermission(user.ID));
      dispatch<any>(handleFetchDevice());
    }
  }, [dispatch, user?.role_id, user?.ID]);

  const FormSchema = z.object({
    selectedPermissions: z.array(z.number()).optional(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      selectedPermissions: [],
    },
  });
  useEffect(() => {
    if (userPermissions) {
      form.reset({
        selectedPermissions: userPermissions.map((perm) => perm.permission_id),
      });
    } else {
      form.reset({
        selectedPermissions: [],
      });
    }
  }, [userPermissions, form, dispatch]);
  const onSubmit = async (data: { selectedPermissions?: number[] }) => {
    if (user?.ID !== undefined) {
      dispatch<any>(
        handleCreateUserPermission({
          user_id: user.ID,
          permission_ids: data.selectedPermissions ?? [],
        })
      );
    } else {
      toast.error("User id is not Selected");
    }
  };

  return (
    <>
      {isRolePermissionError ? (
        <p className="text-red-500">{isRolePermissionError}</p>
      ) : (
        <div className="flex flex-col gap-y-4">
          <p>
            {allowedUserPermissions.length === 0
              ? t("nopermissionforrole")
              : t("assignpermissiontouser")}
          </p>
          {isRolePermissionLoading || isUserPermissionLoading ? (
            <div className="grid grid-cols-2 gap-4 w-full">
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} className="col-span-1 h-[50px]" />
              ))}
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid grid-cols-2 gap-4 items-center"
              >
                {allowedUserPermissions.map((permission) => (
                  <CustomCheckBoxWithLabel
                    key={permission.id}
                    fieldTitle={permission.name.toUpperCase()}
                    currentId={permission.id}
                    nameInSchema="selectedPermissions"
                    message={permission.description}
                    disabled={isUserPermissionCreateLoading}
                    className="col-span-1"
                  />
                ))}
                {allowedUserPermissions.length === 0 ? (
                  <Button
                    type="button"
                    className="bg-green-500 hover:bg-green-600 w-full px-4 py-7 rounded-md text-white text-sm"
                    onClick={() => dispatch<any>(increareCurrentPage())}
                  >
                    {t("getpassword")}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-[#3A5DD9] hover:bg-[#2a4bc6] py-2 text-white w-full"
                    disabled={isUserPermissionCreateLoading}
                  >
                    {t("assign")}
                    {isUserPermissionCreateLoading && (
                      <FaSpinner className="animate-spin ml-2 text-white" />
                    )}
                  </Button>
                )}
              </form>
            </Form>
          )}
          <CreateUserFooter />
        </div>
      )}
    </>
  );
};

export default AdditionalInformationForm;
