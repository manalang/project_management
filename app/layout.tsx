import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Engineering Project Control",
  description: "Portfolio control for engineering development and operations.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
