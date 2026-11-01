import { Label } from "@/components/ui/label";
import CreateUserFooter from "./CreateUserFooter";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  DataSendToCreateUser,
  handleCreateUser,
  handleUpdateUser,
  UserReceived,
} from "@/store/slices/adminSlice/user";
import { useForm } from "react-hook-form";
import { createUserSchema } from "@/validators/admin/create-user-validator";
import { yupResolver } from "@hookform/resolvers/yup";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useDispatch } from "react-redux";
import CustomInputWithLabel from "@/components/inputs/customInputWithLabel";
import { Form } from "@/components/ui/form";
import CustomSelectWithLabel from "@/components/inputs/customSelectWithLabel";

type Props = {
  user?: UserReceived;
};
const BasicInformationForm = ({ user }: Props) => {
  const t = useTranslations("adminusers");
  const dispatch = useDispatch();
  const { roles } = useSelector((state: RootState) => state.role);
  const { isUserCreateLoading, isUserCreateError } = useSelector(
    (state: RootState) => state.user
  );

  const roleForSelect = roles?.map((role) => {
    return { id: role.ID, name: role.role_name, description: role.description };
  });
  const form = useForm<DataSendToCreateUser>({
    resolver: yupResolver(createUserSchema(t)),
    defaultValues: {
      id: user?.ID ?? undefined,
      first_name: user?.first_name ?? "",
      father_name: user?.father_name ?? "",
      grand_father_name: user?.grand_father_name ?? "",
      email: user?.email ?? "",
      role_id: user?.role_id ?? undefined,
    },
  });

  const onSubmit = (data: DataSendToCreateUser) => {
    if (user?.ID) {
      dispatch<any>(handleUpdateUser(data));
    } else {
      dispatch<any>(handleCreateUser(data));
    }
  };

  return (
    <Form {...form}>
      <form
        className="grid grid-cols-2 gap-4 items-center"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <CustomInputWithLabel
          fieldTitle={t("firstname")}
          nameInSchema="first_name"
          placeholder={t("enterfirstname")}
        />
        <CustomInputWithLabel
          fieldTitle={t("fathername")}
          nameInSchema="father_name"
          placeholder={t("enterfathername")}
        />
        <CustomInputWithLabel
          fieldTitle={t("grandfathername")}
          nameInSchema="grand_father_name"
          placeholder={t("entergrandfathername")}
        />
        <CustomInputWithLabel
          fieldTitle={t("email")}
          nameInSchema="email"
          placeholder={t("enteremail")}
        />
        <CustomSelectWithLabel
          fieldTitle={t("role")}
          nameInSchema="role_id"
          data={roleForSelect}
        />
        {/* Spacer to push the button to the next row */}
        <div className="col-span-1 flex justify-center h-full items-end w-full">
          <Button
            type="submit"
            disabled={isUserCreateLoading}
            className="bg-[#3A5DD9] hover:bg-[#2a4bc6] py-2 text-white w-full"
          >
            <span>{user?.ID ? t("edituser") : t("createuser")}</span>
            {isUserCreateLoading && (
              <FaSpinner className="animate-spin ml-2 text-white" />
            )}
          </Button>
        </div>
      </form>
      <CreateUserFooter />
    </Form>
  );
};

export default BasicInformationForm;
