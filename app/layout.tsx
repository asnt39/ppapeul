import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "빠플 · 나의 공부 동료",
  description: "시험 계획, 집중 타이머, 친구와 함께하는 공부 기록",
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
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
