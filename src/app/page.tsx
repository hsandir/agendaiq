import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth-utils";

export default async function HomePage() {
  const user = await getCurrentUser();
  
  if (user) {
    // User is logged in, redirect to dashboard
    redirect("/dashboard");
  } else {
    // User is not logged in, redirect to signin
    redirect("/auth/signin");
  }
}
