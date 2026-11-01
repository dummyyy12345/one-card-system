"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaSpinner } from "react-icons/fa";
import { MdAddModerator } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import {
  CreatePermissionDataSend,
  resetPermissionCreateSuccess,
  resetPermissionUpdateSuccess,
  handleCreatePermission,
  handleUpdatePermission,
  PermissionReceived,
} from "@/store/slices/adminSlice/permission";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { createPermissionSchema } from "@/validators/admin/create-permission-validator";
import CustomInputWithLabel from "@/components/inputs/customInputWithLabel";
import { Form } from "@/components/ui/form";

type Props = {
  permission?: PermissionReceived;
};

const AddPermissions = ({ permission }: Props) => {
  const t = useTranslations("permission");
  const dispatch = useDispatch();
  const {
    isPermissionCreateSuccess,
    isPermissionUpdateSuccess,
    isPermissionError,
    isPermissionCreateLoading,
  } = useSelector((state: RootState) => state.permission);

  const form = useForm<CreatePermissionDataSend>({
    resolver: yupResolver(createPermissionSchema(t)),
    defaultValues: {
      id: permission?.ID ?? undefined,
      permissions_name: permission?.permissions_name ?? "",
      description: permission?.description ?? "",
    },
  });

  useEffect(() => {
    if (isPermissionCreateSuccess) {
      dispatch(resetPermissionCreateSuccess());
      form.reset();
    }
  }, [isPermissionCreateSuccess, t, form, dispatch]);

  const onSubmit = (data: CreatePermissionDataSend) => {
    if (permission?.ID) {
      dispatch<any>(handleUpdatePermission(data));
    } else {
      dispatch<any>(handleCreatePermission(data));
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {permission?.ID ? t("editpermission") : t("addpermission")}
        </DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="text-center flex flex-col gap-y-4">
            <CustomInputWithLabel
              fieldTitle={t("permissionname")}
              nameInSchema="permissions_name"
              placeholder={t("enterpermissionname")}
            />
            <CustomInputWithLabel
              fieldTitle={t("permissiondescription")}
              nameInSchema="description"
              placeholder={t("enterpermissiondescription")}
            />
            {permission?.ID ? (
              <>
                {(permission?.ID && isPermissionUpdateSuccess) ||
                (!permission?.ID && isPermissionCreateSuccess) ? (
                  <DialogClose
                    type="button"
                    onClick={() => {
                      dispatch(resetPermissionCreateSuccess());
                      dispatch(resetPermissionUpdateSuccess());
                    }}
                    className="bg-green-600 hover:bg-green-700 py-3.5 rounded-sm text-white"
                  >
                    {t("close")}
                  </DialogClose>
                ) : (
                  <Button
                    type="submit"
                    disabled={isPermissionCreateLoading}
                    className="w-full bg-[#3A5DD9] hover:bg-[#2a4bc6] py-6 text-white"
                  >
                    <span>{t("editpermission")}</span>
                    {isPermissionCreateLoading && (
                      <FaSpinner className="animate-spin ml-2 text-white" />
                    )}
                  </Button>
                )}
              </>
            ) : (
              <Button
                type="submit"
                disabled={isPermissionCreateLoading}
                className="w-full bg-[#3A5DD9] hover:bg-[#2a4bc6] py-6 text-white"
              >
                <span>{t("createpermission")}</span>
                {isPermissionCreateLoading && (
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

export default AddPermissions;
