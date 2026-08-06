import type { Metadata } from "next";
import "./app.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
