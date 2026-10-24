"use client";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";

import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { handleFetchPermissions } from "@/store/slices/adminSlice/permission";
import {
  handleFetchPermissionForSpecificRole,
  handleUpdateRolePermissionByRoleId,
} from "@/store/slices/adminSlice/rolepermission";
import { FaSpinner } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

const RoleDetailPage = () => {
  const params = useParams<{ roleId: string }>();
  const t = useTranslations("roles");
  const dispatch = useDispatch();
  const { roles } = useSelector((state: RootState) => state.role);
  const { permissions, isPermissionLoading } = useSelector(
    (state: RootState) => state.permission
  );
  const {
    rolePermissions,
    isRolePermissionLoading,
    isRolePermissionUpdateLoading,
  } = useSelector((state: RootState) => state.rolePermission);
  const currentRole = roles.find((role) => role.ID === parseInt(params.roleId));
  const [searchTerm, setSearchTerm] = useState("");
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
    dispatch<any>(handleFetchPermissions());
    dispatch<any>(
      handleFetchPermissionForSpecificRole({ role_id: parseInt(params.roleId) })
    );
  }, [dispatch, params.roleId]);

  useEffect(() => {
    if (rolePermissions) {
      const rolePermIds = rolePermissions.map((perm) => perm.permission_id);
      form.setValue("selectedPermissions", rolePermIds);
    }
  }, [rolePermissions, form]);

  const onSubmit = (data: { selectedPermissions?: number[] }) => {
    dispatch<any>(
      handleUpdateRolePermissionByRoleId({
        role_id: parseInt(params.roleId),
        permission_ids: data.selectedPermissions ?? [],
      })
    );
  };

  const filteredPermissions = permissions.filter((permission) =>
    permission.permissions_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-66px)] flex flex-col gap-y-2">
      <div className="bg-secondary/60 p-6 rounded-tr-2xl rounded-br-2xl">
        <div className="grid grid-cols-8 gap-x-4 mb-4 items-baseline">
          <h1 className="text-[#2a4bc6] text-lg col-span-2 uppercase">
            {t("rolename")}
          </h1>
          <p className="text-muted-foreground text-lg col-span-6">
            {currentRole?.role_name}
          </p>
        </div>
        <div className="grid grid-cols-8 gap-x-4  items-baseline">
          <h1 className="text-[#2a4bc6] text-lg col-span-2 uppercase">
            {t("roledescription")}
          </h1>
          <p className="text-muted-foreground text-lg col-span-6">
            {currentRole?.description}
          </p>
        </div>
      </div>
      <div className="bg-secondary/60 p-6 flex-1 flex flex-col gap-y-4 relative rounded-tr-xl rounded-br-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl text-[#2a4bc6] flex-1 flex-grow uppercase">
            {t("assignpermissiontorole")}
            <span className="italic underline ml-2">
              {currentRole?.role_name}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Search size={18} />
            </div>
            <Input
              id="search-by-name"
              type="text"
              placeholder={t("searchbyname")}
              className="pl-10 ring-0 border-2 focus-visible:ring-offset-0 focus-visible:ring-1 min-w-96"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {isPermissionLoading || isRolePermissionLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="w-60 h-[50px] col-span-2" />
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="col-span-1 h-[50px]" />
            ))}
            <Skeleton className="w-60 h-[50px]" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div
                className={`grid grid-cols-6 gap-y-4 gap-x-4 items-start justify-start mt-4 w-full ${
                  filteredPermissions.length > 30
                    ? "overflow-y-auto max-h-[calc(100vh-350px)]"
                    : ""
                }`}
              >
                {filteredPermissions.length > 0 ? (
                  filteredPermissions.map((permission) => (
                    <FormField
                      key={permission.ID}
                      control={form.control}
                      name="selectedPermissions"
                      render={({ field }) => (
                        <FormItem className="w-full flex items-center gap-x-3">
                          <FormControl>
                            <Checkbox
                              checked={
                                field?.value?.includes(permission.ID) ?? false
                              }
                              onCheckedChange={(checked) => {
                                field.onChange(
                                  checked
                                    ? [...(field.value ?? []), permission.ID]
                                    : field.value?.filter(
                                        (id) => id !== permission.ID
                                      )
                                );
                              }}
                              className="h-5 w-5 text-[#2a4bc6]"
                            />
                          </FormControl>
                          <FormLabel>{permission.permissions_name}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))
                ) : (
                  <div className="col-span-6 text-[#2a4bc6]">
                    {t("nopermissionforrole")}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="py-6 bg-[#3A5DD9] hover:bg-[#2a4bc6] absolute bottom-4 right-4 text-white"
              >
                {t("savechanges")}
                {isRolePermissionUpdateLoading && (
                  <FaSpinner className="animate-spin ml-2" />
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default RoleDetailPage;
