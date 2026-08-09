import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3학년 2반 | 수행평가 일정",
  description: "3학년 2반 수행평가 일정 공지",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
