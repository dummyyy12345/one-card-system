import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { mergeMessages, type Messages } from "@/lib/mergeMessages";

export const locales: string[] = ["en", "am"];

async function loadMessages(locale: string): Promise<Messages> {
  const files = await Promise.all([
    import(`./messages/${locale}/common/login.json`),
    import(`./messages/${locale}/common/navbar.json`),
    import(`./messages/${locale}/admin/sidebar.json`),
    import(`./messages/${locale}/admin/roles.json`),
    import(`./messages/${locale}/admin/users.json`),
    import(`./messages/${locale}/admin/permission.json`),
    import(`./messages/${locale}/admin/devices.json`),
    import(`./messages/${locale}/admin/dashboard.json`),
    import(`./messages/${locale}/registrar/sidebar.json`),
    import(`./messages/${locale}/registrar/student.json`),
    import(`./messages/${locale}/registrar/dashboard.json`),
    import(`./messages/${locale}/gate/sidebar.json`),
  ]);
  return Object.assign({}, ...files.map((file) => file.default)) as Messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  if (!locale || !locales.includes(locale)) notFound();

  const english = await loadMessages("en");
  const messages =
    locale === "en"
      ? english
      : mergeMessages(english, await loadMessages(locale));
  return { locale, messages };
});
