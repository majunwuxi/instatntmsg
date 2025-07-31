import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "交易信号发送器",
  description: "在线发送交易信号的应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>
        {children}
      </body>
    </html>
  );
}