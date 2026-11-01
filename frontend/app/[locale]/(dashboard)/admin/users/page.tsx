"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ImLoop2 } from "react-icons/im";
import { Skeleton } from "@/components/ui/skeleton";
import AddUser from "@/app/[locale]/(dashboard)/admin/users/_compnents/AddUser";
import SelectLimit from "@/app/[locale]/(dashboard)/admin/_components/SelectLimit";
import UserList from "@/app/[locale]/(dashboard)/admin/users/_compnents/UserList";
import { AppDispatch, RootState } from "@/store";
import { handleFetchRole } from "@/store/slices/adminSlice/role";
import { handleFetchUser } from "@/store/slices/adminSlice/user";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MdOutlinePersonAddAlt1 } from "react-icons/md";
import { useForm, FormProvider } from "react-hook-form";
import CustomSelectWithOutLabel from "@/components/inputs/customSelectWithOutLable";
import CustomDebounceSearch from "@/components/inputs/CustomDebounceSearch";
import { useTranslations } from "next-intl";

const UsersPage = () => {
  const t = useTranslations("adminusers");
  const dispatch = useDispatch<AppDispatch>();
  const [limit, setLimit] = useState<number>(10);
  const [name, setName] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [refetchUser, setRefetchUser] = useState<boolean>(false);

  const { roles, isRoleLoading } = useSelector(
    (state: RootState) => state.role
  );

  const roleForSelect = roles?.map((role) => ({
    id: role.ID,
    name: role.role_name,
    description: role.description,
  }));

  const formMethods = useForm({
    defaultValues: {
      role_id: 1,
    },
  });

  const { watch } = formMethods;
  const selectedRoleId = watch("role_id");

  const refetchUsers = () => {
    setRefetchUser(true);
    setTimeout(() => {
      setRefetchUser(false);
    }, 500);
    dispatch(
      handleFetchUser({
        role_id: selectedRoleId,
        page,
        limit,
        name: name ?? "",
      })
    );
  };

  useEffect(() => {
    dispatch(handleFetchRole());
  }, [dispatch]);

  return (
    <div className="flex flex-col gap-y-3">
      <div>
        {isRoleLoading ? (
          <div className="flex items-center w-full gap-x-14">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="w-[350px] h-[44px] rounded-xl" />
            ))}
          </div>
        ) : (
          <FormProvider {...formMethods}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-6">
                <button
                  type="button"
                  aria-label={t("refreshusers")}
                  className="h-8 w-8 px-2 py-4 bg-[#3A5DD9] hover:bg-[#2a4bc6] flex items-center justify-center rounded-sm cursor-pointer"
                  onClick={refetchUsers}
                >
                  <ImLoop2
                    className={`text-sm transition-transform duration-500 text-white ${
                      refetchUser ? "animate-spin" : ""
                    }`}
                  />
                </button>
                <CustomSelectWithOutLabel
                  nameInSchema="role_id"
                  data={roleForSelect}
                />
                <SelectLimit limit={limit} setLimit={setLimit} />
              </div>
              <div className="flex items-center justify-between  gap-x-20">
                <CustomDebounceSearch
                  value={name}
                  onChange={setName}
                  placeholder={t("searchbyname")}
                  className="min-w-[350px]"
                  delay={1000}
                />
                <Dialog>
                  <DialogTrigger
                    aria-label={t("createuser")}
                    className="h-8 w-8 bg-[#3A5DD9] hover:bg-[#2a4bc6] flex items-center justify-center rounded-sm"
                  >
                    <MdOutlinePersonAddAlt1 className="text-xl text-white" />
                  </DialogTrigger>
                  <AddUser />
                </Dialog>
              </div>
            </div>
          </FormProvider>
        )}
      </div>
      <UserList
        role_id={selectedRoleId}
        limit={limit}
        name={name}
        page={page}
        setPage={setPage}
      />
    </div>
  );
};

export default UsersPage;
