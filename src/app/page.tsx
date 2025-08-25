import { redirect } from "next/navigation";
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth/auth-options";

export default async function HomePage() {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.email) {
      // User is logged in, redirect to dashboard
      redirect("/dashboard");
    } else {
      // User is not logged in, redirect to signin
      redirect("/auth/signin");
    }
  } catch (error) {
    // If there's any authentication error, just redirect to signin
    redirect("/auth/signin");
  }
}
