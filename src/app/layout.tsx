import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "贴画铺子 · 我们的小账本",
  description:
    "情侣专属的贴画奖罚账本：一次最多奖励 5 张贴画，也能扣除，每笔都写明原因和时间。攒够 20 张就能许一个愿望。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "贴画铺子",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf3e4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Noto+Sans+SC:wght@300;400;500;700;900&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="paper-grain antialiased">{children}</body>
    </html>
  );
}
