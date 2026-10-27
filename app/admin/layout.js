import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default function AdminLayout({ children }) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="text-sm text-ts-muted p-4">Loading admin session...</div>}>
        <AdminGuard>{children}</AdminGuard>
      </Suspense>
    </div>
  );
}

async function AdminGuard({ children }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  
  return <>{children}</>;
}
