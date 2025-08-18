import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: Promise<{ token: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/dashboard");
  }

  try {
    // Find and validate token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="max-w-md w-full space-y-8 p-8 bg-card shadow rounded-lg">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-foreground">
                Invalid or Expired Link
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                This verification link is invalid or has expired. Please request a new verification email.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });

      return (
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="max-w-md w-full space-y-8 p-8 bg-card shadow rounded-lg">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-foreground">
                Link Expired
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                This verification link has expired. Please request a new verification email.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="max-w-md w-full space-y-8 p-8 bg-card shadow rounded-lg">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-foreground">
              Email Verified!
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Your email has been successfully verified. You can now close this window.
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error: unknown) {
    console.error("Error verifying email:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="max-w-md w-full space-y-8 p-8 bg-card shadow rounded-lg">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-foreground">
              Error
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              An error occurred while verifying your email. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
} 