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

- `USE_MOCK_HOTELS=true`: ホテルと地区候補の仮データを使用します。APIキーは不要です。
- `USE_MOCK_HOTELS=false`: 楽天トラベルAPIを使用します。楽天ウェブサービスで取得した `RAKUTEN_TRAVEL_APP_ID` と `RAKUTEN_TRAVEL_ACCESS_KEY` が必要です。
- `RAKUTEN_AFFILIATE_ID`: 任意です。設定した場合は楽天APIが返すURLに反映されます。
- `JALAN_API_KEY`: 今回は使用しません。

開発サーバーを起動します。

```bash
npm run dev
```

起動後、[http://localhost:3000](http://localhost:3000) を開いてください。

楽天API接続時は、`USE_MOCK_HOTELS=false` と必要な認証情報を設定してサーバーを再起動します。`http://localhost:3000/api/hotels?keyword=東京` で変換後のJSONを確認できます。

## 楽天トラベル地区コードAPI

楽天トラベル地区コードAPI（`Travel/GetAreaClass/20140210`）への接続を追加しました。このAPIは「日本 → 東京都 → 東京23区内 → 新宿…」のような楽天独自の地区階層とコードを返します。アプリでは最下層ごとにフラット化し、次の内部APIで目的地名を部分一致検索できます。

```text
/api/areas?keyword=東京
/api/areas?keyword=新宿
/api/areas?keyword=横浜
```

空の `keyword` には `[]` を返し、APIの検索結果は最大20件です。検索フォームでは目的地を入力して「地区候補を検索」を押し、上位5件から1件を選択します。選択中の階層名を画面に表示し、表示名と4種類の地区コードを検索条件に保持します。

楽天の地区コードAPIへ接続する場合は、`.env.local` に次を設定してください。

```dotenv
RAKUTEN_TRAVEL_APP_ID=楽天ウェブサービスのアプリID
RAKUTEN_TRAVEL_ACCESS_KEY=楽天ウェブサービスのアクセスキー
RAKUTEN_AFFILIATE_ID=任意のアフィリエイトID
USE_MOCK_HOTELS=false
```

`USE_MOCK_HOTELS=true` はホテル一覧・詳細をローカルの仮データで確認する場合、`false` は楽天のキーワード検索・施設詳細・空室検索を使う場合に指定します。

## 楽天トラベル検索APIへの対応状況

ホテル検索は楽天トラベルのキーワード検索APIと空室検索API（`Travel/VacantHotelSearch/20170426`）に対応しています。

内部APIは次の形式に対応しています。

```text
/api/hotels?keyword=東京
/api/hotels?keyword=東京&checkIn=2026-08-01&checkOut=2026-08-02&guests=2
/api/hotels?keyword=新宿&checkIn=2026-08-01&checkOut=2026-08-02&guests=2&areaClassCode=japan&middleClassCode=tokyo&smallClassCode=tokyo&detailClassCode=（選択候補の値）
```

画面で地区候補を選ぶと、`SearchCondition.rakutenAreaCandidate`、トップページ、`fetchHotels`、`/api/hotels` の順に地区コードが渡ります。サーバーは内部APIの `areaClassCode` を楽天APIの `largeClassCode` に変換し、残りの地区コードとともに送信します。

チェックイン日、チェックアウト日、人数がすべて揃い、地区コードが1つ以上ある場合に空室検索APIを呼びます。地区候補が未選択、または宿泊条件が不足している場合はキーワード検索APIへフォールバックし、画面に理由を表示します。空室レスポンスはキーワードレスポンスとは別の変換関数で `Hotel` と `HotelOffer` に変換します。料金を取得できない場合は `0` として保持し、一覧と詳細では「料金未定」または「価格不明」と表示します。

- `USE_MOCK_HOTELS=true`（既定）: ホテル一覧・詳細では楽天APIを呼ばず、ローカルの仮データを使用します。
- `USE_MOCK_HOTELS=false`: 楽天トラベルAPIへ接続します。認証情報を `.env.local` に設定してください。

`USE_MOCK_HOTELS` はホテル一覧・詳細と地区候補のデータ元をまとめて切り替えます。`true` または未設定ならローカルの仮データ、`false` なら楽天APIを使用します。

次の拡張候補は、入力中に候補を表示するオートコンプリート、候補の関連度順ランキング、検索条件をURLへ保存する機能です。
