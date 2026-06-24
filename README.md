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

## 楽天トラベル地区コードAPI

楽天トラベル地区コードAPI（`Travel/GetAreaClass/20140210`）への接続を追加しました。このAPIは「日本 → 東京都 → 東京23区内 → 新宿…」のような楽天独自の地区階層とコードを返します。アプリでは最下層ごとにフラット化し、次の内部APIで目的地名を部分一致検索できます。

```text
/api/areas?keyword=東京
/api/areas?keyword=新宿
/api/areas?keyword=横浜
```

空の `keyword` には `[]` を返し、検索結果は最大20件です。検索フォームの「地区候補を確認」からは上位5件を選択できます。選択した候補は表示名だけでなく地区コード一式も検索条件に保持されます。

地区コードAPIも `USE_MOCK_HOTELS` の値に関係なく楽天APIの認証情報が必要です。`.env.local` に次を設定してください。

```dotenv
RAKUTEN_TRAVEL_APP_ID=楽天ウェブサービスのアプリID
RAKUTEN_TRAVEL_ACCESS_KEY=楽天ウェブサービスのアクセスキー
RAKUTEN_AFFILIATE_ID=任意のアフィリエイトID
USE_MOCK_HOTELS=false
```

`USE_MOCK_HOTELS=true` はホテル一覧・詳細をローカルの仮データで確認する場合、`false` は楽天のキーワード検索・施設詳細・空室検索を使う場合に指定します。

## 楽天トラベル検索APIへの対応状況

現在の外部API検索は、楽天トラベルキーワード検索APIが中心です。今回、宿泊日と人数を受け取り、空室検索API
（`Travel/VacantHotelSearch/20170426`）へ接続するためのエンドポイント定義、パラメータ生成、レスポンス変換処理を追加しました。

内部APIは次の形式に対応しています。

```text
/api/hotels?keyword=東京
/api/hotels?keyword=東京&checkIn=2026-08-01&checkOut=2026-08-02&guests=2
```

楽天の空室検索APIでは、日付と人数に加えて、施設番号、地区コード、または緯度・経度などの検索範囲指定が必要です。地区候補を選択した検索では、`areaClassCode` を楽天APIの正式なパラメータ名 `largeClassCode` に変換し、`middleClassCode`、`smallClassCode`、`detailClassCode` とともに空室検索APIへ渡します。地区候補を選択していない場合はキーワード検索へフォールバックし、画面には「現在はキーワード検索結果を表示しています」と表示されます。

- `USE_MOCK_HOTELS=true`（既定）: 外部APIを呼ばず、ローカルの仮データで一覧・詳細・検索UIを確認できます。
- `USE_MOCK_HOTELS=false`: 楽天トラベルAPIへ接続します。認証情報を `.env.local` に設定してください。

空室検索を本格対応する次の段階では、入力中の候補を自動表示するオートコンプリート、候補のランキング、ホテル番号や緯度経度による検索を追加し、空室プランの料金・朝食条件を画面の絞り込みへ反映します。
