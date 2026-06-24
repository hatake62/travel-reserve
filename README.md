# travel-reserve

Next.js、TypeScript、Tailwind CSSで構築したホテル料金比較アプリです。

## ローカル開発

環境変数のひな形をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

`.env.local` の値を用途に合わせて設定します。

```dotenv
RAKUTEN_TRAVEL_APP_ID=
RAKUTEN_TRAVEL_ACCESS_KEY=
RAKUTEN_AFFILIATE_ID=
JALAN_API_KEY=
USE_MOCK_HOTELS=true
```

- `USE_MOCK_HOTELS=true`: `src/data/hotels.ts` の仮データを使用します。APIキーは不要です。
- `USE_MOCK_HOTELS=false`: 楽天トラベルAPIを使用します。楽天ウェブサービスで取得した `RAKUTEN_TRAVEL_APP_ID` と `RAKUTEN_TRAVEL_ACCESS_KEY` が必要です。
- `RAKUTEN_AFFILIATE_ID`: 任意です。設定した場合は楽天APIが返すURLに反映されます。
- `JALAN_API_KEY`: 今回は使用しません。

開発サーバーを起動します。

```bash
npm run dev
```

起動後、[http://localhost:3000](http://localhost:3000) を開いてください。

楽天API接続時は、`USE_MOCK_HOTELS=false` と必要な認証情報を設定してサーバーを再起動します。`http://localhost:3000/api/hotels?keyword=東京` で変換後のJSONを確認できます。画面の目的地に「東京」「新宿」などを入力した検索も同じ内部APIを使用します。
