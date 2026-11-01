import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { createDeviceSchema } from "@/validators/admin/create-device-validator";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@/components/ui/button";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  DataSendToCreateDevice,
  DeviceReceived,
  handleCreateDevice,
  handleUpdateDevice,
  resetDeviceCreateSuccess,
  resetDeviceUpdateSuccess,
} from "@/store/slices/adminSlice/device";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import CustomInputWithLabel from "@/components/inputs/customInputWithLabel";

type Props = {
  device?: DeviceReceived;
};
const CreateDevice = ({ device }: Props) => {
  const t = useTranslations("adminDevice");
  const dispatch = useDispatch();
  const {
    isDeviceCreateLoading,
    isDeviceCreateError,
    isDeviceCreateSuccess,
    isDeviceUpdateLoading,
    isDeviceUpdateSuccess,
  } = useSelector((state: RootState) => state.device);

  const form = useForm<DataSendToCreateDevice>({
    resolver: yupResolver(createDeviceSchema(t)),
    defaultValues: {
      id: device?.ID ?? undefined,
      ip_address: device?.ip_address ?? "",
      location: device?.location ?? "",
      name: device?.name ?? "",
      port: device?.port ?? undefined,
      serial_number: device?.serial_number ?? "",
    },
  });

  useEffect(() => {
    if (isDeviceCreateSuccess) {
      dispatch(resetDeviceCreateSuccess());
      form.reset();
    }
  }, [isDeviceCreateSuccess, form, t, dispatch]);

  const onSubmit = (data: DataSendToCreateDevice) => {
    if (device?.ID) {
      dispatch<any>(handleUpdateDevice(data));
    } else {
      dispatch<any>(handleCreateDevice(data));
    }
  };

  return (
    <DialogContent className="max-h-[700px] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {device?.ID ? t("updatedevice") : t("createdevice")}
        </DialogTitle>
        <DialogDescription>{t("becarefull")}</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="flex flex-col gap-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="text-center flex flex-col gap-y-4">
            {isDeviceCreateError && (
              <p className="text-red-500">{isDeviceCreateError}</p>
            )}
            <CustomInputWithLabel
              fieldTitle={t("name")}
              nameInSchema="name"
              placeholder={t("enterdevicename")}
            />
            <CustomInputWithLabel
              fieldTitle={t("serial_number")}
              nameInSchema="serial_number"
              placeholder={t("enterdeviceserialnumber")}
            />
            <CustomInputWithLabel
              fieldTitle={t("ip_address")}
              nameInSchema="ip_address"
              placeholder={t("enterdeviceipaddress")}
            />
            <CustomInputWithLabel
              fieldTitle={t("port")}
              nameInSchema="port"
              placeholder={t("enterdeviceport")}
            />
            <CustomInputWithLabel
              fieldTitle={t("location")}
              nameInSchema="location"
              placeholder={t("enterdevicelocation")}
            />
            {device?.ID ? (
              <>
                {(device?.ID && isDeviceUpdateSuccess) ||
                (!device?.ID && isDeviceUpdateSuccess) ? (
                  <DialogClose
                    type="button"
                    onClick={() => {
                      dispatch(resetDeviceCreateSuccess());
                      dispatch(resetDeviceUpdateSuccess());
                    }}
                    className="bg-green-600 hover:bg-green-700 py-3.5 rounded-sm text-white"
                  >
                    {t("close")}
                  </DialogClose>
                ) : (
                  <Button
                    type="submit"
                    disabled={isDeviceUpdateLoading}
                    className="w-full bg-[#3A5DD9] hover:bg-[#2a4bc6] py-6 text-white"
                  >
                    <span>{t("updatedevice")}</span>
                    {isDeviceUpdateLoading && (
                      <FaSpinner className="animate-spin ml-2 text-white" />
                    )}
                  </Button>
                )}
              </>
            ) : (
              <Button
                type="submit"
                disabled={isDeviceCreateLoading}
                className="w-full bg-[#3A5DD9] hover:bg-[#2a4bc6] py-6 text-white"
              >
                <span>{t("createdevice")}</span>
                {isDeviceCreateLoading && (
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

export default CreateDevice;
