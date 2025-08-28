import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { LayoutProvider } from "@/lib/layout/layout-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { PostHogProvider } from "@/lib/posthog/posthog-provider";
import { DebugInitializer } from "@/components/debug/DebugInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AgendaIQ - Meeting Intelligence Platform",
  description: "Advanced meeting tracking, action item management, and intelligent follow-up system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgendaIQ - Meeting Intelligence Platform",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "AgendaIQ",
    title: "AgendaIQ - Meeting Intelligence Platform",
    description: "Transform your meetings with intelligent tracking, action management, and automated follow-ups",
  },
  twitter: {
    card: "summary",
    title: "AgendaIQ - Meeting Intelligence Platform",
    description: "Transform your meetings with intelligent tracking and action management",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} bg-background text-foreground`}>
        <DebugInitializer />
        <PostHogProvider>
          <ErrorBoundary>
            <AuthProvider>
              <ThemeProvider>
                <LayoutProvider>
                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md">
                  Skip to main content
                </a>
                <div id="main-content" role="main">
                  {children}
                </div>
              </LayoutProvider>
            </ThemeProvider>
          </AuthProvider>
        </ErrorBoundary>
        </PostHogProvider>
      </body>
    </html>
  );
}
/* Force complete rebuild 1756355027 */
