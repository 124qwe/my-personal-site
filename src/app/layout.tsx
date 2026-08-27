import type { Metadata, Viewport } from "next";
import { Analytics } from '@vercel/analytics/next';
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "咕嘟星球｜只有两个人的喝水监督小站",
  description: "把关心装进每一杯水。咕嘟星球是专属于两个人的私密喝水监督与互动空间。",
  applicationName: "咕嘟星球",
  appleWebApp: {
    capable: true,
    title: "咕嘟星球",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "1024x1024", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf7ef",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
