import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { LayoutProvider } from "@/lib/layout/layout-provider";
import { ErrorBoundary } from "@/components/error-boundary";

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
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ErrorBoundary>
          <AuthProvider>
            <ThemeProvider>
              <LayoutProvider>
                {children}
              </LayoutProvider>
            </ThemeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
