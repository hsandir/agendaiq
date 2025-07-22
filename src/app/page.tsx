import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth-utils";

export default async function HomePage() {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      // Kullanıcı giriş yapmış, dashboard'a yönlendir
      redirect("/dashboard");
    } else {
      // Kullanıcı giriş yapmamış, signin'e yönlendir
      redirect("/auth/signin");
    }
  } catch (error) {
    // Auth hatası varsa signin'e yönlendir
    console.error("Homepage auth error:", error);
    redirect("/auth/signin");
  }
}
