"use client";
import { useState } from "react";
import { ImLoop2 } from "react-icons/im";
import { useDispatch } from "react-redux";
import DeviceList from "./_components/DeviceList";
import { handleFetchDevice } from "@/store/slices/adminSlice/device";
import CreateDevice from "./_components/CreateDevice";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { TbDeviceDesktopPlus } from "react-icons/tb";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import type { AppDispatch } from "@/store";

const DevicesPage = () => {
  const t = useTranslations("adminDevice");
  const dispatch = useDispatch<AppDispatch>();
  const [refetchDevice, setRefetchDevice] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const refetchDevices = () => {
    setRefetchDevice(true);
    setTimeout(() => {
      setRefetchDevice(false);
    }, 500);
    dispatch(handleFetchDevice());
  };
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-x-4">
        <button
          type="button"
          aria-label={t("refreshdevices")}
          className="h-8 w-8 bg-[#3A5DD9] hover:bg-[#2a4bc6] flex items-center justify-center rounded-sm cursor-pointer"
          onClick={refetchDevices}
        >
          <ImLoop2
            className={`text-sm transition-transform duration-500 text-white ${
              refetchDevice ? "animate-spin" : ""
            }`}
          />
        </button>
        <div className="flex items-center justify-end gap-x-4">
          <div className="flex items-center justify-center gap-2 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Search size={18} />
            </div>
            <Input
              id="search-by-name"
              aria-label={t("searchbylocation")}
              type="text"
              placeholder={t("searchbylocation")}
              className="pl-10 ring-0 border-2 focus-visible:ring-offset-0 focus-visible:ring-1 min-w-96"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Dialog>
            <DialogTrigger
              aria-label={t("createdevice")}
              className="h-8 w-8 bg-[#3A5DD9] hover:bg-[#2a4bc6] flex items-center justify-center rounded-sm"
            >
              <TbDeviceDesktopPlus className="text-xl text-white" />
            </DialogTrigger>
            <CreateDevice />
          </Dialog>
        </div>
      </div>
      <DeviceList searchTerm={searchTerm} />
    </div>
  );
};

export default DevicesPage;
