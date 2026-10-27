"use client";
import { MdOutlinePersonAddAlt1 } from "react-icons/md";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import BasicInformationForm from "./createuser/BasicInformationForm";
import AdditionalInformationForm from "./createuser/AdditionalInformationForm";
import CreateUserSuccess from "./createuser/CreateUserSuccess";
import { useTranslations } from "next-intl";
import { UserRecieved } from "@/store/slices/adminSlice/user";

type Props = {
  user?: UserRecieved;
};
const AddUser = ({ user }: Props) => {
  const t = useTranslations("adminusers");
  const { currentPageUserCreate } = useSelector(
    (state: RootState) => state.user
  );
  console.log("currentPageUserCreate : " + currentPageUserCreate);
  return (
    <DialogContent className="max-h-[700px] min-w-[900px] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {currentPageUserCreate == 1
            ? t("createuser")
            : currentPageUserCreate == 2
              ? t("assignpermission")
              : t("getpassword")}
        </DialogTitle>
        <DialogDescription>
          {currentPageUserCreate === 3
            ? t("takecareofpassword")
            : t("becarefull")}
        </DialogDescription>
      </DialogHeader>
      {currentPageUserCreate === 1 ? (
        <BasicInformationForm user={user} />
      ) : currentPageUserCreate === 2 ? (
        <AdditionalInformationForm />
      ) : currentPageUserCreate === 3 ? (
        <CreateUserSuccess />
      ) : null}
    </DialogContent>
  );
};

export default AddUser;
