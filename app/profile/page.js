import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function ProfileRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(`/profile/${user._id}`);
}
