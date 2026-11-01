import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

const UserDetailFooter = ({
  page,
  setPage,
}: {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const t = useTranslations("adminusers");
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-x-5">
        <Button onClick={() => setPage(1)} disabled={page === 1} variant="link">
          {t("prev")}
        </Button>
        <Button onClick={() => setPage(2)} disabled={page === 2} variant="link">
          {t("next")}
        </Button>
      </div>
    </div>
  );
};

export default UserDetailFooter;
