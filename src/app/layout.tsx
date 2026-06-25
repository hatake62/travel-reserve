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
      <body>
        {children}
        <footer className="bg-slate-50 px-4 pb-8 text-center text-xs leading-6 text-slate-500 sm:px-6">
          表示価格や空室状況は取得タイミングにより変動する場合があります。実際の予約条件は各予約サイトで確認してください。
        </footer>
      </body>
    </html>
  );
}
