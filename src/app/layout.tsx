import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ホテル価格比較サイト",
  description: "目的地と宿泊日からホテル価格を比較するサイトです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
