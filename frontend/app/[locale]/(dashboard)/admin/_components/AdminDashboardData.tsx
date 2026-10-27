"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { RootState } from "@/store";
import { handleGetDashboardInformation } from "@/store/slices/adminSlice/user";
import { Users2, Shield, KeyRound, Monitor } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card, { CardProps } from "@/components/adminDashboard/Card";
import { BarGraph } from "@/components/adminDashboard/BarGraph";
import { RadarGraph } from "@/components/adminDashboard/RadarGraph";
import { useTranslations } from "next-intl";

// Helper to generate bar chart data
const formatBarChartData = (usersByRole: any[]) =>
  usersByRole.map((item, index) => ({
    name: item.role_name,
    total: item.count,
    fill: `hsl(var(--chart-${index + 1}))`,
  }));

// Helper to generate bar chart config
const generateBarChartConfig = (usersByRole: any[]) =>
  usersByRole.reduce(
    (config, item, index) => {
      config[item.role_name.toLowerCase().replace(" ", "_")] = {
        label: item.role_name,
        color: `hsl(var(--chart-${index + 1}))`,
      };
      return config;
    },
    {} as Record<string, { label: string; color: string }>
  );

// Utility function to get card data
const getCardData = (userDashboardData: any, t: any): CardProps[] => {
  return [
    {
      label: t("totalusers"),
      amount: userDashboardData?.totalUsers?.toString() || "0",
      description: t("totalusersdescription"),
      icon: Users2,
    },
    {
      label: t("totalroles"),
      amount: userDashboardData?.totalRoles?.toString() || "0",
      description: t("totalrolesdescription"),
      icon: Shield,
    },
    {
      label: t("totalpermissions"),
      amount: userDashboardData?.totalPermissions?.toString() || "0",
      description: t("totalpermissionsdescription"),
      icon: KeyRound,
    },
    {
      label: t("totaldevices"),
      amount: userDashboardData?.totalDevices?.toString() || "0",
      description: t("totaldevicesdescription"),
      icon: Monitor,
    },
  ];
};

const AdminDashboardData = () => {
  const t = useTranslations("admindashboard");

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch<any>(handleGetDashboardInformation());
  }, [dispatch]);

  const { userDashboardData, isUserLoading } = useSelector(
    (state: RootState) => state.user
  );

  // Use the utility function to get card data with translations
  const cardData = getCardData(userDashboardData, t);
  const usersByRole = userDashboardData?.usersByRole || [];
  const barChartData = formatBarChartData(usersByRole);
  const barChartConfig = generateBarChartConfig(usersByRole);

  const currentDate = new Date();
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const formattedDate = currentDate.toLocaleDateString("en-US", options);

  return (
    <div>
      {isUserLoading ? (
        <div className="flex flex-col gap-5 w-full">
          <h2></h2> {/* for the space between */}
          <section className="grid w-full grid-cols-1 gap-4 gap-x-8 transition-all sm:grid-cols-2 xl:grid-cols-4">
            {/* Skeletons for cards */}
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="col-span-1 rounded-lg bg-secondary/60 h-32"
              />
            ))}
          </section>
          <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-2">
            {/* Skeletons for graphs */}
            <Skeleton className="rounded-lg bg-secondary/60 h-[28.5rem]" />
            <Skeleton className="rounded-lg bg-secondary/60 h-[28.5rem]" />
          </section>
        </div>
      ) : (
        <div className="flex flex-col gap-5 w-full">
          <h2></h2> {/* for the space between */}
          <section className="grid w-full grid-cols-1 gap-4 gap-x-8 transition-all sm:grid-cols-2 xl:grid-cols-4">
            {cardData.map((data, index) => (
              <Card
                key={index}
                label={data.label}
                amount={data.amount}
                description={data.description}
                icon={data.icon}
              />
            ))}
          </section>
          <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-2">
            <BarGraph
              chartData={barChartData}
              chartConfig={barChartConfig}
              title={t("userroledistribution")}
              desc={`${t("asof")} ${formattedDate}`}
            />
            <RadarGraph
              pieData={barChartData}
              title={t("studentcategoriesoverview")}
              desc={`${t("asof")} ${formattedDate}`}
            />
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardData;
