"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { RootState } from "@/store";
import { handleGetDashboardInformationForStudent } from "@/store/slices/registrarSlice/students";
import { CreditCard, UserCheck, UserX, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "@/components/registrarDashboard/Card";
import { RadarGraph } from "@/components/registrarDashboard/RadarGraph";
import { BarGraph } from "@/components/registrarDashboard/BarGraph";
import { useTranslations } from "next-intl";

// Helper to extract student category data
const getCardData = (studentsByCategory: any[], t: any) => [
  {
    label: t("activestudents"),
    amount:
      studentsByCategory
        .find((item) => item.category === "Active Students")
        ?.count?.toString() || "0",
    description: t("activestudentsdescription"),
    icon: UserCheck,
  },
  {
    label: t("inctivestudents"),
    amount:
      studentsByCategory
        .find((item) => item.category === "Inactive Students")
        ?.count?.toString() || "0",
    description: t("inactivestudentsdescription"),
    icon: UserX,
  },
  {
    label: t("studentswithcards"),
    amount:
      studentsByCategory
        .find((item) => item.category === "Students with Cards")
        ?.count?.toString() || "0",
    description: t("studentswithcardsdescription"),
    icon: CreditCard,
  },
  {
    label: t("studentswithoutcards"),
    amount:
      studentsByCategory
        .find((item) => item.category === "Students without Cards")
        ?.count?.toString() || "0",
    description: t("studentswithoutcardsdescription"),
    icon: XCircle,
  },
];

// Helper to format chart data
const formatChartData = (studentsByCategory: any[]) =>
  studentsByCategory.map((student, index) => ({
    name: student.category
      .replace("Active Students", "Active")
      .replace("Inactive Students", "Inactive")
      .replace("Students with Cards", "With Cards")
      .replace("Students without Cards", "Without Cards"),
    total: student.count,
    fill: `hsl(var(--chart-${index + 1}))`,
  }));

// Helper to generate chart configuration
const generateChartConfig = (studentsByCategory: any[]) =>
  studentsByCategory.reduce(
    (config, student, index) => {
      const name = student.category
        .replace("Active Students", "Active")
        .replace("Inactive Students", "Inactive")
        .replace("Students with Cards", "With Cards")
        .replace("Students without Cards", "Without Cards");
      config[name.toLowerCase().replace(" ", "_")] = {
        label: name,
        color: `hsl(var(--chart-${index + 1}))`,
      };
      return config;
    },
    {} as Record<string, { label: string; color: string }>
  );

const RegistrarDashboard = () => {
  const t = useTranslations("registrardashboard");

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch<any>(handleGetDashboardInformationForStudent());
  }, [dispatch]);

  // const { studentDataForDashboard, isStudentLoading } = useSelector(
  //   (state: RootState) => state.student
  // );
  const { studentDataForDashboard, isGetStudentForDashboardLoading } =
    useSelector((state: RootState) => state.student);

  const studentsByCategory = studentDataForDashboard?.studentsByCategory || [];
  const cardData = getCardData(studentsByCategory, t);
  const chartData = formatChartData(studentsByCategory);
  const chartConfig = generateChartConfig(studentsByCategory);

  const currentDate = new Date();
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const formattedDate = currentDate.toLocaleDateString("en-US", options);

  return (
    <div>
      {/* {isStudentLoading ? ( */}
      {isGetStudentForDashboardLoading ? (
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
              chartData={chartData}
              chartConfig={chartConfig}
              title={t("distributionofStudents")}
              desc={`${t("asof")} ${formattedDate}`}
            />
            <RadarGraph
              pieData={chartData}
              title={t("studentcategoriesoverview")}
              desc={`${t("asof")} ${formattedDate}`}
            />
          </section>
        </div>
      )}
    </div>
  );
};

export default RegistrarDashboard;
