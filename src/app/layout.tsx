import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Meeting Intelligence Platform",
  description: "Advanced meeting tracking, action item management, and intelligent follow-up system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meeting Intelligence Platform",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Meeting Intelligence Platform",
    title: "Meeting Intelligence Platform - AgendaIQ",
    description: "Transform your meetings with intelligent tracking, action management, and automated follow-ups",
  },
  twitter: {
    card: "summary",
    title: "Meeting Intelligence Platform",
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
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            defaultTheme="light"
            storageKey="agendaiq-ui-theme"
          >
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
