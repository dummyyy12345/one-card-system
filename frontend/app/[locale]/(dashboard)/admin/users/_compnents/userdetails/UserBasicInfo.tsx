import { useTranslations } from "next-intl";
import {
  DataSendToCreateUser,
  UserRecieved,
} from "@/store/slices/adminSlice/user";
import { useForm, FormProvider } from "react-hook-form";
import { createUserSchema } from "@/validators/admin/create-user-validator";
import { yupResolver } from "@hookform/resolvers/yup";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import CustomInputWithLabel from "@/components/inputs/customInputWithLabel";

const UserBasicInfo = ({ user }: { user: UserRecieved }) => {
  const t = useTranslations("adminusers");
  const { roles } = useSelector((state: RootState) => state.role);

  const formMethods = useForm<any>({
    defaultValues: {
      first_name: user.first_name,
      father_name: user.father_name,
      grand_father_name: user.grand_father_name,
      email: user.email,
      role_name: user.role.role_name,
    },
  });

  const { setValue } = formMethods;

  return (
    <FormProvider {...formMethods}>
      <form className="flex flex-col gap-y-6">
        <div className="text-center grid grid-cols-2 gap-4">
          <CustomInputWithLabel
            fieldTitle={t("firstname")}
            nameInSchema="first_name"
            value={user.first_name}
            placeholder={t("enterfirstname")}
            disabled
            className="cursor-not-allowed border-muted-foreground border-2"
          />
          <CustomInputWithLabel
            fieldTitle={t("fathername")}
            nameInSchema="father_name"
            value={user.father_name}
            placeholder={t("enterfathername")}
            disabled
            className="cursor-not-allowed border-muted-foreground border-2"
          />
          <CustomInputWithLabel
            fieldTitle={t("grandfathername")}
            nameInSchema="grand_father_name"
            value={user.grand_father_name}
            placeholder={t("entergrandfathername")}
            disabled
            className="cursor-not-allowed border-muted-foreground border-2"
          />
          <CustomInputWithLabel
            fieldTitle={t("email")}
            nameInSchema="email"
            value={user.email}
            placeholder={t("enteremail")}
            disabled
            className="cursor-not-allowed border-muted-foreground border-2"
          />
          <CustomInputWithLabel
            fieldTitle={t("role")}
            nameInSchema="role_name"
            value={user.role.role_name}
            placeholder={t("enterrole")}
            disabled
            className="cursor-not-allowed border-muted-foreground border-2"
          />
        </div>
      </form>
    </FormProvider>
  );
};

export default UserBasicInfo;
