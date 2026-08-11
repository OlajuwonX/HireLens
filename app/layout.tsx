import { ThemeScript } from "@/components/theme/theme-script";
import { Toaster } from "@/components/ui/toast";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./app.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HireLens",
    template: "%s | HireLens",
  },
  description: "AI-powered resume and job application workspace.",
  icons: {
    icon: "/hllogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
