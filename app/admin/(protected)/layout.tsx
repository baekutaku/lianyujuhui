import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/admin-auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}