import { AppDispatch, RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { Skeleton } from "@/components/ui/skeleton";
import {
  handleDeleteDevice,
  resetDeviceUpdateSuccess,
} from "@/store/slices/adminSlice/device";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EditIcon } from "lucide-react";
import { MdDelete } from "react-icons/md";
import { FaSpinner } from "react-icons/fa";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import CreateDevice from "./CreateDevice";

const DeviceList = ({ searchTerm }: { searchTerm?: string }) => {
  const t = useTranslations("adminDevice");
  const dispatch = useDispatch<AppDispatch>();
  const { devices, isDeviceError, isDeviceLoading, isDeviceDeleteLoading } =
    useSelector((state: RootState) => state.device);
  const deviceToDisplay = searchTerm
    ? devices.filter((device) =>
        device.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : devices;
  return (
    <div className="relative rounded-xl p-0 h-[calc(100vh-120px)] flex flex-col gap-y-2">
      {isDeviceError && <p role="alert">{isDeviceError}</p>}
      {isDeviceLoading ? (
        <div className="flex flex-col items-center w-full gap-y-8 mt-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="w-full h-[44px] rounded-sm" />
          ))}
        </div>
      ) : deviceToDisplay.length === 0 ? (
        <p>{t("nodevice")}</p>
      ) : (
        <Table className="mt-3">
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("serial_number")}</TableHead>
              <TableHead>{t("ip_address")}</TableHead>
              <TableHead>{t("port")}</TableHead>
              <TableHead>{t("location")}</TableHead>
              <TableHead className="text-center">{t("edit")}</TableHead>
              <TableHead className="text-center">{t("delete")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deviceToDisplay.map((device, index) => (
              <TableRow
                key={device.ID}
                className={cn(
                  index % 2 === 0 ? "" : "bg-secondary",
                  "hover:bg-primary-foreground"
                )}
              >
                <TableCell>{device.name}</TableCell>
                <TableCell>{device.serial_number}</TableCell>
                <TableCell>{device.ip_address}</TableCell>
                <TableCell>{device.port}</TableCell>
                <TableCell>{device.location}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger
                      asChild
                      className="w-full cursor-pointer text-center"
                      onClick={() => dispatch(resetDeviceUpdateSuccess())}
                    >
                      <button type="button" aria-label={`Edit ${device.name}`}>
                        <EditIcon size={20} className="text-yellow-600" />
                      </button>
                    </DialogTrigger>
                    <CreateDevice device={device} />
                  </Dialog>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger
                      asChild
                      className="w-full cursor-pointer text-center"
                    >
                      <button
                        type="button"
                        aria-label={`Delete ${device.name}`}
                      >
                        <MdDelete size={20} className="text-red-600" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm text-center flex flex-col gap-y-8">
                      <DialogHeader className="mt-4 mx-2">
                        <DialogTitle className="text-center">
                          {t("delete")}: {device.name}
                        </DialogTitle>
                        <DialogDescription>
                          {t("suretodelete")} {device.name}?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center justify-evenly">
                        <DialogClose className="bg-red-700 hover:bg-red-800 px-7 py-2 rounded-sm text-white lowercase">
                          {t("cancel")}
                        </DialogClose>
                        <Button
                          className="bg-green-700 hover:bg-green-800 px-7 text-white lowercase"
                          disabled={isDeviceDeleteLoading}
                          onClick={() =>
                            dispatch(handleDeleteDevice({ id: device.ID }))
                          }
                        >
                          {t("confirm")}
                          {isDeviceDeleteLoading && (
                            <FaSpinner className="animate-spin ml-2 text-white text-xs" />
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default DeviceList;
