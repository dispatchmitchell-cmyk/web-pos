//app/staff/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Must be logged in
  if (!session?.staff) {
    redirect("/login");
  }

  // All roles can access staff page now
  return <>{children}</>;
}
