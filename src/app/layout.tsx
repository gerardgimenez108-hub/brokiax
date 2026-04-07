import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/hooks/useAuth";
import ToastContainer from "@/components/ui/ToastContainer";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Brokiax — AI Trading Platform",
    template: "%s | Brokiax",
  },
  description:
    "AI-powered SaaS trading platform. Multi-LLM, Multi-Exchange, Strategy Studio. Trade cryptocurrency with autonomous AI agents.",
  keywords: [
    "AI trading",
    "crypto trading bot",
    "LLM trading",
    "automated trading",
    "cryptocurrency",
    "Brokiax",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brokiax",
  },
  openGraph: {
    title: "Brokiax — AI Trading Platform",
    description: "Trade cryptocurrency with autonomous AI agents",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={cn("h-full", "font-sans")}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors duration-300">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <AuthProvider>
              {children}
              <ToastContainer />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
