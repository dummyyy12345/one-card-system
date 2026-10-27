"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocale, useTranslations } from "next-intl";
import { createLoginSchema } from "@/validators/common/login-validator";
import { FaSpinner } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { handleLogin } from "@/store/slices/common/authSlice";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Eye, EyeClosed } from "lucide-react";
import Image from "next/image";

interface LoginFormInputs {
  email: string;
  password: string;
}

const LoginPage = () => {
  const t = useTranslations("login");
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [visible, setVisible] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(createLoginSchema(t)),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    dispatch(handleLogin({ data, router, locale }));
  };

  return (
    <Card className="w-full py-16 px-0 md:px-8 rounded-lg border-0 max-w-xs sm:max-w-lg md:max-w-xl h-fit">
      <CardHeader className="text-center mb-4 flex flex-col items-center">
        <Image
          src="/assets/images/logo.png"
          alt="logo"
          width={120}
          height={120}
          className="mb-4"
        />
        <CardTitle className="text-4xl font-semibold">{t("welcome")}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div>
            <Label htmlFor="email" className="block text-sm font-medium">
              {t("email")}
            </Label>
            <Input
              id="email"
              type="text"
              placeholder={t("enteremail")}
              {...register("email")}
              className={cn(
                { "focus-visible:ring-red-600": errors.email },
                "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-0 focus:border-0"
              )}
            />
            {errors.email && (
              <p className="text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2 py-2">
            {/* <Label htmlFor="password">Password</Label> */}
            <Label htmlFor="password" className="block text-sm font-medium">
              {t("password")}
            </Label>
            <div className="flex items-center justify-center gap-2 relative">
              <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                {visible ? (
                  <EyeClosed
                    size={22}
                    className="cursor-pointer text-primary"
                    onClick={() => setVisible(!visible)}
                  />
                ) : (
                  <Eye
                    size={22}
                    className="cursor-pointer text-primary"
                    onClick={() => setVisible(!visible)}
                  />
                )}
              </div>
              <Input
                id="password"
                type={visible ? "text" : "password"}
                placeholder={t("enterpassword")}
                {...register("password")}
                className={cn(
                  { "focus-visible:ring-red-600": errors.password },
                  "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-0 focus:border-0"
                )}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition duration-150"
            disabled={isLoading}
          >
            <span>{t("login")}</span>
            {isLoading && <FaSpinner className="animate-spin ml-2" />}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
};

export default LoginPage;
