import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/hooks/useAuth";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Brokiax — AI Trading Platform",
    template: "%s | Brokiax",
  },
  description:
    "Plataforma SaaS de trading con inteligencia artificial. Multi-LLM, Multi-Exchange, Strategy Studio. Opera criptomonedas con agentes IA autónomos.",
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
    description: "Opera criptomonedas con agentes IA autónomos",
    type: "website",
    locale: "es_ES",
  },
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn("h-full", inter.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
