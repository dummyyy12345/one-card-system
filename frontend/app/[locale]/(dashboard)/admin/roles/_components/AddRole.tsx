import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaSpinner } from "react-icons/fa";
import { MdDomainAdd } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import {
  handleCreateRole,
  handleUpdateRole,
  resetRoleCreateSuccess,
  resetRoleUpdateSuccess,
  RoleSend,
} from "@/store/slices/adminSlice/role";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { createRoleSchema } from "@/validators/admin/create-role-validators";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Form } from "@/components/ui/form";
import { RoleReceived } from "@/store/slices/adminSlice/user";
import CustomInputWithLabel from "@/components/inputs/customInputWithLabel";

type Props = {
  role?: RoleReceived;
};

const AddRole = ({ role }: Props) => {
  const t = useTranslations("roles");
  const dispatch = useDispatch();
  const {
    isRoleCreateLoading,
    isRoleError,
    isRoleCreateSuccess,
    isRoleUpdateSuccess,
  } = useSelector((state: RootState) => state.role);

  const form = useForm<RoleSend>({
    resolver: yupResolver(createRoleSchema(t)),
    defaultValues: {
      id: role?.ID ?? undefined,
      role_name: role?.role_name ?? "",
      description: role?.description ?? "",
    },
  });

  useEffect(() => {
    if (isRoleCreateSuccess) {
      dispatch(resetRoleCreateSuccess());
      form.reset();
    }
  }, [isRoleCreateSuccess, isRoleError, t, form, dispatch]);

  const onSubmit = (data: RoleSend) => {
    if (role?.ID) {
      dispatch<any>(handleUpdateRole(data));
    } else {
      dispatch<any>(handleCreateRole(data));
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("addRole")}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="text-center flex flex-col gap-y-4">
            <CustomInputWithLabel
              fieldTitle={t("rolename")}
              nameInSchema="role_name"
              placeholder={t("enterrolename")}
            />
            <CustomInputWithLabel
              fieldTitle={t("roledescription")}
              nameInSchema="description"
              placeholder={t("enterroledescription")}
            />
            {role?.ID ? (
              <>
                {(role?.ID && isRoleUpdateSuccess) ||
                (!role?.ID && isRoleCreateSuccess) ? (
                  <DialogClose
                    type="button"
                    onClick={() => {
                      dispatch(resetRoleUpdateSuccess());
                      dispatch(resetRoleCreateSuccess());
                    }}
                    className="bg-green-600 hover:bg-green-700 py-3.5 rounded-sm text-white"
                  >
                    {t("close")}
                  </DialogClose>
                ) : (
                  <Button
                    type="submit"
                    disabled={isRoleCreateLoading}
                    className="w-full bg-[#3A5DD9] hover:bg-[#2a4bc6] py-6 text-white"
                  >
                    <span>{t("editrole")}</span>
                    {isRoleCreateLoading && (
                      <FaSpinner className="animate-spin ml-2 text-white" />
                    )}
                  </Button>
                )}
              </>
            ) : (
              <Button
                type="submit"
                disabled={isRoleCreateLoading}
                className="w-full bg-[#3A5DD9] hover:bg-[#2a4bc6] py-6 text-white"
              >
                <span>{t("createrole")}</span>
                {isRoleCreateLoading && (
                  <FaSpinner className="animate-spin ml-2 text-white" />
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </DialogContent>
  );
};

export default AddRole;
