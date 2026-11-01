import CreateUserFooter from "./CreateUserFooter";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  handleFetchUser,
  handleSendEmail,
  removeCurrentUser,
  removeSendEmailSuccess,
} from "@/store/slices/adminSlice/user";
import { DialogClose } from "@/components/ui/dialog";
import { resetUserPermissionState } from "@/store/slices/adminSlice/userpermission";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { FaSpinner } from "react-icons/fa";

const CreateUserSuccess = () => {
  const t = useTranslations("adminusers");
  const dispatch = useDispatch<AppDispatch>();
  const { user, sendEmailLoading, sendEmailSuccess, sendEmailError } =
    useSelector((state: RootState) => state.user);
  const { userPermissions } = useSelector(
    (state: RootState) => state.userPermission
  );
  const userCanDo = userPermissions.map(
    (permission) => permission.permission.description
  );
  const handleConfirmClick = () => {
    dispatch(removeCurrentUser());
    dispatch(resetUserPermissionState());
    dispatch(removeSendEmailSuccess());
    if (user) {
      dispatch(
        handleFetchUser({ role_id: user.role_id, page: 1, limit: 10, name: "" })
      );
    }
    toast.success(t("thankyouproceed"));
  };

  const handleSendEmailForUser = () => {
    if (!user?.email || !user.password) return;
    dispatch(
      handleSendEmail({
        name: `${user.first_name} ${user.father_name} ${user.grand_father_name}`,
        email: user.email,
        subject: "Password for your account",
        password: user.password,
        role: user.role.role_name,
        roledescription: userCanDo,
      })
    );
  };

  const handlePasswordClick = async () => {
    if (!user?.password) return;
    try {
      await navigator.clipboard.writeText(user.password);
      toast.success(t("passwordcopied"));
    } catch {
      toast.error(t("passwordcopyfailed"));
    }
  };

  return (
    <div className="flex flex-col gap-y-16">
      <div className="flex flex-col gap-y-3">
        <h2 className="text-xl font-semibold text-center text-green-600">
          {t("useraccountcreated")}
        </h2>
        <div className="flex flex-col items-center gap-y-2">
          <p className="text-center">
            {t("temporarypassword")}
            <span className="text-muted-foreground text-lg font-semibold block">{`${user?.first_name.toUpperCase()} - ${user?.father_name.toUpperCase()}`}</span>
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                onClick={handlePasswordClick}
                disabled={!user?.password}
              >
                <span className="text-lg font-medium text-green-600 py-3 px-3 rounded-md">
                  {user?.password}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("copypassword")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-center mt-2">{t("pleasechangepassword")}</p>
          {sendEmailError && <p role="alert">{sendEmailError}</p>}
        </div>
        {sendEmailSuccess ? (
          <>
            <h1 className="w-fit mx-auto text-green-600">{t("proceed")}</h1>
            <DialogClose
              onClick={handleConfirmClick}
              className="bg-green-600 hover:bg-green-700 w-1/2 mx-auto h-fit py-3 px-4 rounded mt-2 text-white text-sm"
            >
              {t("ok")}
            </DialogClose>
          </>
        ) : (
          <Button
            className="bg-green-600 hover:bg-green-700 w-1/2 mx-auto h-fit py-3 px-4 rounded mt-2 text-white text-sm"
            onClick={handleSendEmailForUser}
            disabled={sendEmailLoading || !user?.email || !user.password}
          >
            {t("sendemail")}
            {sendEmailLoading && (
              <FaSpinner className="animate-spin ml-2 text-white" />
            )}
          </Button>
        )}
      </div>
      <CreateUserFooter />
    </div>
  );
};

export default CreateUserSuccess;
