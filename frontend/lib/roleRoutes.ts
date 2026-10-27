export function roleHomePath(role: string, locale: string): string {
  const normalized = role.toLowerCase().trim();
  const path: Record<string, string> = {
    cafeteria: "cafe",
    cafe: "cafe",
    dormitory: "dormitory",
    librarian: "librarian",
    library: "librarian",
  };
  return `/${locale}/${path[normalized] || normalized}`;
}
