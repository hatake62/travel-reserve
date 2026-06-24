# travel-reserve

Next.js、TypeScript、Tailwind CSSで構築したホテル料金比較アプリです。

## ローカル開発

環境変数のひな形をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

`USE_MOCK_HOTELS=true` の場合、`src/data/hotels.ts` の仮データを使用します。現在はこちらが標準の開発設定です。`false` にすると楽天トラベルproviderへ切り替わりますが、楽天トラベルAPIとの通信およびレスポンス変換は今後実装する予定です。その際は `RAKUTEN_TRAVEL_APP_ID` の設定が必要です。

開発サーバーを起動します。

```bash
npm run dev
```

起動後、[http://localhost:3000](http://localhost:3000) を開いてください。
