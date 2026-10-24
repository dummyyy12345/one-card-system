import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

export const locales: string[] = ["en", "am"];

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  if (!locale || !locales.includes(locale)) notFound();
  const logininImport = (await import(`./messages/${locale}/common/login.json`))
    .default;
  const navbarImport = (await import(`./messages/${locale}/common/navbar.json`))
    .default;
  const adminSidebarImport = (
    await import(`./messages/${locale}/admin/sidebar.json`)
  ).default;
  const adminRoleImport = (
    await import(`./messages/${locale}/admin/roles.json`)
  ).default;
  const adminUserImport = (
    await import(`./messages/${locale}/admin/users.json`)
  ).default;
  const adminPermissionImport = (
    await import(`./messages/${locale}/admin/permission.json`)
  ).default;
  const adminDeviceImport = (
    await import(`./messages/${locale}/admin/devices.json`)
  ).default;
  const adminDashboardImport = (
    await import(`./messages/${locale}/admin/dashboard.json`)
  ).default;
  const registrarSidebarImport = (
    await import(`./messages/${locale}/registrar/sidebar.json`)
  ).default;
  const createStudentImport = (
    await import(`./messages/${locale}/registrar/student.json`)
  ).default;
  const registrarDashboardImport = (
    await import(`./messages/${locale}/registrar/dashboard.json`)
  ).default;
  const gateSidebarImport = (
    await import(`./messages/${locale}/gate/sidebar.json`)
  ).default;
  return {
    locale,
    messages: {
      ...logininImport,
      ...navbarImport,
      ...adminSidebarImport,
      ...adminRoleImport,
      ...adminUserImport,
      ...adminPermissionImport,
      ...adminDeviceImport,
      ...adminDashboardImport,
      ...registrarSidebarImport,
      ...registrarDashboardImport,
      ...createStudentImport,
      ...gateSidebarImport,
    },
  };
});
