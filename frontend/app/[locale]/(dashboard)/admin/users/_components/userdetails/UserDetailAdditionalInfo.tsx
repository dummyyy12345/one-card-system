import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { handleFetchPermissionForSpecificRole } from "@/store/slices/adminSlice/rolepermission";
import { RootState } from "@/store";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import CustomCheckBoxWithLabel from "@/components/inputs/customCheckBoxWithLabel";
import { handleFetchUserPermission } from "@/store/slices/adminSlice/userpermission";
import { useTranslations } from "next-intl";
import { UserReceived } from "@/store/slices/adminSlice/user";

const AdditionalInformationForm = ({ user }: { user: UserReceived }) => {
  const t = useTranslations("adminusers");
  const dispatch = useDispatch();
  // const { user } = useSelector((state: RootState) => state.user);
  const { rolePermissions, isRolePermissionLoading, isRolePermissionError } =
    useSelector((state: RootState) => state.rolePermission);
  const { userPermissions, isUserPermissionLoading } = useSelector(
    (state: RootState) => state.userPermission
  );

  const allowedUserPermissions = rolePermissions.map((permission) => ({
    id: permission.permission_id,
    name: permission.permission.permissions_name,
    description: permission.permission.description,
  }));

  useEffect(() => {
    if (user?.role_id !== undefined) {
      dispatch<any>(
        handleFetchPermissionForSpecificRole({ role_id: user.role_id })
      );
      dispatch<any>(handleFetchUserPermission(user.ID));
    }
  }, [dispatch, user?.role_id, user?.ID]);

  const FormSchema = z.object({
    selectedPermissions: z.array(z.number()).optional(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
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

  return (
    <>
      {isRolePermissionError ? (
        <p className="text-red-500">{isRolePermissionError}</p>
      ) : (
        <div className="flex flex-col gap-y-4">
          <p>
            {allowedUserPermissions.length === 0 && t("nopermissionforrole")}
          </p>
          {isRolePermissionLoading || isUserPermissionLoading ? (
            <div className="grid grid-cols-2 gap-4 w-full">
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} className="col-span-1 h-[50px]" />
              ))}
            </div>
          ) : (
            <Form {...form}>
              <form className="grid grid-cols-2 gap-4 items-center">
                {allowedUserPermissions.map((permission) => (
                  <CustomCheckBoxWithLabel
                    key={permission.id}
                    fieldTitle={permission.name.toUpperCase()}
                    currentId={permission.id}
                    nameInSchema="selectedPermissions"
                    message={permission.description}
                    disabled={true} // Make it read-only
                    className="col-span-1"
                  />
                ))}
              </form>
            </Form>
          )}
        </div>
      )}
    </>
  );
};

export default AdditionalInformationForm;
