# ホテル価格比較サイト

## 概要

複数のホテル予約サイトの料金を比較できるWebアプリです。Googleホテルのようなメタサーチ型のホテル比較サイトを目指しており、ホテル一覧・詳細画面で予約サイトごとの料金を比較できます。

現在は仮データ、楽天トラベルAPI、じゃらんAPIに対応できる構成です。アプリ内で予約処理は行わず、実際の予約は外部予約サイトへ遷移して行う想定です。

## 公開URL

- 公開URL: https://travel-reserve.vercel.app/
- GitHubリポジトリ: https://github.com/hatake62/travel-reserve

## 作成目的

- Next.jsを用いたWebアプリ開発の学習
- 外部API連携の学習
- 複数Providerのデータ統合の学習
- ユーザーがホテル料金を比較しやすいUIの実装

## 主な機能

- ホテル一覧表示
- ホテル詳細表示
- 目的地・日付・人数による検索
- 並び替え
- 上限価格フィルター
- 予約サイトフィルター
- 朝食ありフィルター
- 複数予約サイトの料金比較表示
- 最安値表示
- お気に入り登録
- お気に入り一覧
- localStorageによるお気に入り保存
- 検索条件のURLクエリ反映
- ホテル検索結果のページング
- ホテル画像がない場合の代替表示
- ローディング・エラー・0件表示
- Provider設定確認API

## 使用技術

- Next.js
- React
- TypeScript
- Tailwind CSS
- Route Handler
- localStorage
- 楽天トラベルAPI
- じゃらんAPI

## ディレクトリ構成

```text
src/
├─ app/
│  ├─ api/
│  │  ├─ areas/
│  │  ├─ debug/provider-config/
│  │  └─ hotels/
│  │     └─ [id]/
│  ├─ favorites/
│  ├─ hotels/[id]/
│  ├─ page.tsx
│  ├─ layout.tsx
│  ├─ error.tsx
│  ├─ not-found.tsx
│  └─ globals.css
├─ components/
├─ data/
├─ lib/
│  └─ hotelProviders/
└─ types/
```

主な役割は次の通りです。

- `src/app/`: 画面、レイアウト、Route Handler
- `src/app/api/hotels/`: ホテル一覧取得API
- `src/app/api/hotels/[id]/`: ホテル詳細取得API
- `src/app/api/areas/`: 地区候補取得API
- `src/app/api/debug/provider-config/`: Provider設定確認API
- `src/components/`: 検索フォーム、ホテルカード、画像、状態表示などのUI部品
- `src/data/`: 仮データ
- `src/lib/`: API取得、検索条件、価格表示、名寄せ、お気に入りなどの処理
- `src/lib/hotelProviders/`: Providerごとのホテル取得処理
- `src/types/`: アプリ共通の型定義

## 環境構築

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` を作成し、利用するProviderに合わせて環境変数を設定してください。

## 環境変数

`.env.local` の例です。

```dotenv
USE_MOCK_HOTELS=true
USE_RAKUTEN_PROVIDER=false
USE_JALAN_PROVIDER=false
```

外部APIを使う場合だけ、必要なAPIキーを追加します。値がないAPIキーは空欄で登録せず、行ごと省略してください。

環境変数の意味は次の通りです。

- `USE_MOCK_HOTELS=true`: 仮データを使います。APIキーなしで動作確認できます。
- `USE_MOCK_HOTELS=false`: 外部API Providerを使います。
- `USE_RAKUTEN_PROVIDER=true`: 楽天Providerを使います。
- `USE_JALAN_PROVIDER=true`: じゃらんProviderを使います。
- `RAKUTEN_TRAVEL_APP_ID`: 楽天トラベルAPIのアプリIDです。
- `RAKUTEN_TRAVEL_ACCESS_KEY`: 楽天トラベルAPIのアクセスキーです。
- `RAKUTEN_AFFILIATE_ID`: 楽天アフィリエイトIDです。任意項目です。
- `RAKUTEN_ALLOWED_ORIGIN`: 楽天ウェブサービスのAllowed websites/IPsに登録した公開URLです。例: `https://travel-reserve.vercel.app`
- `JALAN_API_KEY`: じゃらんAPIキーです。

現在の実装では、`USE_MOCK_HOTELS` が未設定または `true` の場合は `mockProvider` だけを使用し、楽天ProviderとじゃらんProviderは呼びません。外部APIを使う場合は `USE_MOCK_HOTELS=false` にしてください。

`USE_MOCK_HOTELS=false` のときは、`USE_RAKUTEN_PROVIDER=true` または `USE_JALAN_PROVIDER=true` を明示したProviderだけを呼びます。複数Providerを有効にした場合、一方が失敗しても、もう一方が成功していればホテル一覧を返します。

APIキーは `.env.local` に記載します。`.env.local` はGitHubに上げないでください。

## 起動方法

```bash
npm install
npm run dev
```

起動後、ブラウザで次のURLを開きます。

```text
http://localhost:3000
```

## GitHubへpushする手順

デプロイ前にローカルで次のコマンドが通ることを確認してください。

```bash
npm run lint
npm run build
```

GitHubでリポジトリを作成した後、`main` ブランチへpushします。

```bash
git add .
git commit -m "Finalize project for deployment"
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
git branch -M main
git push -u origin main
```

すでにremoteが登録済みの場合は、`git remote add origin ...` は不要です。

## Vercelで公開する手順

1. Vercelにログインします。
2. Add New Projectを選びます。
3. GitHubリポジトリをImportします。
4. Framework Presetは `Next.js` を選びます。
5. Install Commandは `npm install` を指定します。
6. Build Commandは `npm run build` を指定します。
7. Output Directoryは通常変更しません。
8. Environment Variablesを設定します。
9. Deployを実行します。

## Vercel環境変数の設定例

VercelのEnvironment Variablesでは、空欄のAPIキーを登録しないでください。`Value is required.` が出た場合は、空欄の環境変数を削除し、外部APIを使うときだけ実際の値を登録してください。環境変数を変更したらRedeployが必要です。

段階1: 仮データ公開

```dotenv
USE_MOCK_HOTELS=true
USE_RAKUTEN_PROVIDER=false
USE_JALAN_PROVIDER=false
```

段階2: 楽天Providerのみ

```dotenv
USE_MOCK_HOTELS=false
USE_RAKUTEN_PROVIDER=true
USE_JALAN_PROVIDER=false

RAKUTEN_TRAVEL_APP_ID=実際の値
RAKUTEN_TRAVEL_ACCESS_KEY=実際の値
RAKUTEN_AFFILIATE_ID=任意
RAKUTEN_ALLOWED_ORIGIN=https://travel-reserve.vercel.app
```

段階3: じゃらんProviderのみ

```dotenv
USE_MOCK_HOTELS=false
USE_RAKUTEN_PROVIDER=false
USE_JALAN_PROVIDER=true

JALAN_API_KEY=実際の値
```

段階4: 楽天 + じゃらん

```dotenv
USE_MOCK_HOTELS=false
USE_RAKUTEN_PROVIDER=true
USE_JALAN_PROVIDER=true

RAKUTEN_TRAVEL_APP_ID=実際の値
RAKUTEN_TRAVEL_ACCESS_KEY=実際の値
RAKUTEN_AFFILIATE_ID=任意
RAKUTEN_ALLOWED_ORIGIN=https://travel-reserve.vercel.app
JALAN_API_KEY=実際の値
```

## Vercel公開後の確認項目

公開URLで次の項目を確認します。

- トップページが表示される
- ホテル一覧が表示される
- 検索できる
- ホテル詳細ページを開ける
- お気に入り登録できる
- `/favorites` が開ける
- `/api/hotels` がJSONを返す
- `/api/debug/provider-config` がAPIキーの値そのものを返していない
- スマホ幅でも大きく崩れない

確認する主なURLは次の通りです。

```text
https://travel-reserve.vercel.app/
https://travel-reserve.vercel.app/?destination=東京
https://travel-reserve.vercel.app/hotels/1
https://travel-reserve.vercel.app/favorites
https://travel-reserve.vercel.app/api/hotels
https://travel-reserve.vercel.app/api/hotels?keyword=東京
https://travel-reserve.vercel.app/api/hotels?keyword=東京&debug=true
https://travel-reserve.vercel.app/api/debug/provider-config
```

## 環境変数変更後の注意

- Vercelで環境変数を変更したら再デプロイが必要です。
- 値がないAPIキーは登録しないでください。
- `Value is required.` が出た場合は、空欄の環境変数を削除してください。
- 外部APIを使うときだけ実際のAPIキーを登録してください。
- APIキーには `NEXT_PUBLIC_` を付けないでください。
- APIキーをREADMEやGitHubに書かないでください。
- 本番環境では、まず `USE_MOCK_HOTELS=true` で公開確認するのがおすすめです。仮データで画面とAPIの動作を確認した後、必要に応じて外部API Providerを有効にしてください。

## 本番公開時の注意事項

- APIキーをコードやREADMEに直接書かないでください。
- APIキーには `NEXT_PUBLIC_` を付けないでください。
- ブラウザ側から直接予約サイトAPIを呼ばないでください。
- 外部APIはRoute Handler経由で呼んでください。
- `.env.local` はGitHubにpushしないでください。
- 価格や空室状況は変動する可能性があります。
- 実際の予約条件は予約サイトで確認してください。
- 予約サイトの情報取得は各サービスの利用規約に従ってください。
- 本番公開時は価格表示に「実際の予約条件は予約サイトで確認してください」などの注意文を入れてください。
- 一休.comやYahoo!トラベルは現時点では公式APIではなく、アフィリエイトリンク中心に検討してください。

## 動作確認方法

- トップページでホテル一覧が表示される
- 目的地・日付・人数を入力して検索できる
- 並び替えができる
- 上限価格、予約サイト、朝食ありで絞り込みできる
- ホテル詳細ページを開ける
- ホテルをお気に入り登録できる
- `/favorites` でお気に入り一覧を確認できる
- 検索条件付きURLをリロードしても条件が残る
- `/api/hotels` がJSONを返す
- `/api/debug/provider-config` でProvider設定を確認できる

例:

```text
http://localhost:3000/api/hotels?keyword=東京
http://localhost:3000/api/debug/provider-config
```

Vercelへデプロイした後は、公開URLで次のパスを確認します。

```text
https://travel-reserve.vercel.app/
https://travel-reserve.vercel.app/?destination=東京
https://travel-reserve.vercel.app/hotels/1
https://travel-reserve.vercel.app/favorites
https://travel-reserve.vercel.app/api/hotels
https://travel-reserve.vercel.app/api/hotels?keyword=東京
https://travel-reserve.vercel.app/api/hotels?keyword=東京&debug=true
https://travel-reserve.vercel.app/api/debug/provider-config
```

## 本番でのProvider確認手順

楽天Provider確認:

1. Vercelで `USE_MOCK_HOTELS=false` を設定する。
2. `USE_RAKUTEN_PROVIDER=true`、`USE_JALAN_PROVIDER=false` を設定する。
3. `RAKUTEN_TRAVEL_APP_ID` と `RAKUTEN_TRAVEL_ACCESS_KEY` を設定する。
4. `RAKUTEN_ALLOWED_ORIGIN=https://travel-reserve.vercel.app` を設定する。
5. 必要な場合だけ `RAKUTEN_AFFILIATE_ID` を設定する。
6. Redeployする。
7. `https://travel-reserve.vercel.app/api/debug/provider-config` で楽天Providerが有効で、必要なキーと `RAKUTEN_ALLOWED_ORIGIN` が設定済みになっていることを確認する。
8. `https://travel-reserve.vercel.app/api/hotels?keyword=東京` がJSONを返すことを確認する。
9. トップページで東京を検索する。

楽天トラベルAPI連携確認:

- 楽天Provider有効時は、ホテル情報を楽天トラベルAPIから取得する。
- `/api/hotels?keyword=東京` で外部API由来の `Hotel[]` を確認できる。
- `/api/hotels?keyword=東京&debug=true` で `rawCount` と `mappedCount` を確認できる。
- `rawCount > 0` かつ `mappedCount = 0` の場合は、楽天APIレスポンスから `Hotel` 型への変換処理を確認する。
- `debug=true` でもAPIキー、`applicationId`、`accessKey`、`affiliateId` の実値は表示しない。
- 表示価格や空室状況は取得タイミングで変動する。
- 実際の料金、空室、キャンセル条件、予約条件は楽天トラベル側で確認する。
- Vercelで環境変数を変更した後はRedeployが必要。

外部APIの0件調査:

- まず `/api/hotels?keyword=東京` を確認する。
- 0件の場合は `/api/hotels?keyword=東京&debug=true` を確認する。
- `debug.rawCount` が0なら、外部API側が0件を返している。
- `debug.rawCount` が1以上で `debug.mappedCount` が0なら、外部APIレスポンスからアプリの `Hotel` 型への変換処理に問題がある。
- `debug.mappedCount` が1以上なら、通常の `/api/hotels?keyword=東京` でも `Hotel[]` が返る。
- 楽天Providerでは `debug.detectedPattern` で、`hotelBasicInfo` をどのレスポンス構造から検出したか確認できる。
- `debug.responseTopLevelKeys`、`debug.firstRawHotelKeys`、`debug.firstRawHotelHotelKeys` で、ホテル情報全文を出さずにレスポンス構造だけ確認できる。
- `debug=true` でもAPIキー、`applicationId`、`accessKey`、`affiliateId` の実値は返さない。

## 指定宿泊日の料金推移

ホテル詳細ページでは、指定した宿泊日の過去30日間の料金推移を表示できます。

重要な前提:

- 楽天トラベルAPIから過去の料金履歴を後から直接取得することはできません。
- このアプリでは、楽天APIで取得したその時点の価格をPostgreSQLへスナップショットとして保存します。
- 第2段階では、Vercel Cronで毎日1回、追跡対象の現在価格を自動保存します。
- グラフはDBに保存済みの実データ `hotel_price_snapshots` だけを表示します。
- サンプルデータは返しません。
- 記録開始前の過去データは存在しません。
- 最初は1点だけ、日数が経つほどグラフの点数が増えます。
- 30日後に過去30日分の推移として見られます。
- 追跡対象は個人開発の運用コストを抑えるため最大10件です。
- `DATABASE_URL` が未設定の場合、アプリは落とさず、料金履歴APIは空配列と警告を返します。
- 表示価格は取得時点の参考価格です。実際の料金、空室、キャンセル条件、予約条件は楽天トラベル側で確認してください。

必要な環境変数:

```text
DATABASE_URL=
CRON_SECRET=
```

`DATABASE_URL` はNeonやSupabaseなど、PostgreSQLに接続できるURLを設定します。`CRON_SECRET` はCron自動取得APIを保護するための秘密文字列です。どちらも実値を画面、ログ、APIレスポンス、READMEに出さないでください。Vercelで環境変数を変更した後はRedeployが必要です。

テーブル設計:

- `hotel_price_watch_targets`: ユーザーが追跡したいホテル・宿泊日・人数条件を保存します。
- `hotel_price_snapshots`: 毎日取得した実際の料金を保存します。
- `hotel_price_capture_logs`: Cron実行の集計結果を保存します。
- `hotel_price_capture_log_items`: targetごとの成功・失敗・スキップ概要を保存します。

`hotel_price_watch_targets`:

- `id`: 追跡対象ID
- `hotel_id`: `rakuten-78182` のようなアプリ内ホテルID
- `provider`: `rakuten`
- `check_in_date`: 宿泊開始日
- `check_out_date`: 宿泊終了日
- `adults`: 大人人数
- `enabled`: 取得対象にするか
- `created_at`: DB登録日時
- `updated_at`: DB更新日時

`hotel_price_snapshots`:

- `id`: スナップショットID
- `hotel_id`: `rakuten-78182` のようなアプリ内ホテルID
- `provider`: `rakuten`
- `check_in_date`: 宿泊開始日
- `check_out_date`: 宿泊終了日
- `adults`: 大人人数
- `price`: 取得時点の価格。取得できない場合は `NULL`
- `booking_url`: 予約ページURL
- `captured_at`: 価格を取得した日時
- `created_at`: DB登録日時

`hotel_price_capture_logs`:

- `id`: 実行ログID
- `started_at`: 実行開始日時
- `finished_at`: 実行終了日時
- `target_count`: 対象件数
- `success_count`: 成功件数
- `failure_count`: 失敗件数
- `skipped_count`: スキップ件数
- `message`: 実行概要
- `created_at`: DB登録日時

ユニーク制約の推奨:

- `hotel_id`
- `provider`
- `check_in_date`
- `check_out_date`
- `adults`
- `captured_at` の日付部分

SQL例:

```sql
CREATE TABLE IF NOT EXISTS hotel_price_watch_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 2,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hotel_id, provider, check_in_date, check_out_date, adults)
);

CREATE TABLE IF NOT EXISTS hotel_price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 2,
  price INTEGER,
  booking_url TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_snapshots_lookup
ON hotel_price_snapshots (hotel_id, check_in_date, check_out_date, adults, captured_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_snapshots_daily_unique
ON hotel_price_snapshots (
  hotel_id,
  provider,
  check_in_date,
  check_out_date,
  adults,
  ((captured_at AT TIME ZONE 'Asia/Tokyo')::date)
);

CREATE TABLE IF NOT EXISTS hotel_price_capture_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  target_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_price_capture_log_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_log_id UUID REFERENCES hotel_price_capture_logs(id) ON DELETE CASCADE,
  target_id UUID,
  hotel_id TEXT,
  provider TEXT,
  check_in_date DATE,
  check_out_date DATE,
  adults INTEGER,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

料金履歴API:

```text
/api/hotels/rakuten-78182/price-history?checkIn=2026-08-10&checkOut=2026-08-11&adults=2
```

追跡対象API:

```text
GET /api/price-watch/targets
POST /api/price-watch/targets
PATCH /api/price-watch/targets/:id
```

手動保存API:

```text
POST /api/price-watch/capture-once
```

ホテル詳細ページの「今すぐ1回取得して保存」から呼び出し、指定ホテル・宿泊日・人数の現在価格を楽天APIから取得して `hotel_price_snapshots` に保存します。同じ条件を同じ日本日付で保存した場合は、その日のスナップショットを更新します。

Cron API:

```text
GET /api/cron/capture-price-snapshots
POST /api/cron/capture-price-snapshots
```

Vercel Cronが毎日1回呼び出し、`enabled=true` の追跡対象を最大10件取得して現在価格を保存します。`Authorization: Bearer <CRON_SECRET>` が一致しない場合は `401`、`CRON_SECRET` 未設定時は `500` を返します。Vercel CronはUTC基準です。`0 15 * * *` は日本時間の深夜0時頃です。Hobbyプランでは1日1回実行にしてください。

追跡対象管理:

```text
/price-watch
```

登録済みの追跡対象、enabled状態、最終更新日を確認できます。不要な追跡は停止できます。

手動確認手順:

1. NeonやSupabaseなどでPostgreSQL DBを用意する。
2. 上記SQLを実行してテーブルを作る。
3. Vercelまたはローカルに `DATABASE_URL` を設定する。
4. VercelでRedeployする、または `npm run dev` を再起動する。
5. ホテル詳細ページを開く。
6. 宿泊日と人数を入力する。
7. 「この条件を追跡対象に追加」を押す。
8. 「今すぐ1回取得して保存」を押す。
9. 「料金推移を表示」を押す。
10. 実データが1点以上表示されることを確認する。

Cron手動確認手順:

1. `CRON_SECRET` を `.env.local` またはVercelに設定する。
2. `npm run dev` を再起動する、またはVercelでRedeployする。
3. 追跡対象を1件登録する。
4. Authorizationヘッダー付きで `/api/cron/capture-price-snapshots` を手動実行する。
5. `hotel_price_snapshots` に保存されたことを確認する。
6. 料金推移グラフに実データが表示されることを確認する。

ローカル確認例:

```bash
curl -X GET http://localhost:3000/api/cron/capture-price-snapshots \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

本番確認例:

```bash
curl -X GET https://travel-reserve.vercel.app/api/cron/capture-price-snapshots \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

`YOUR_CRON_SECRET` はプレースホルダです。実値をREADMEやGitHubに書かないでください。

## 指定宿泊日の楽天トラベル予約リンク

ホテル詳細ページの料金推移セクションでは、入力した `checkInDate`、`checkOutDate`、`adults` を使って楽天トラベルの予約リンク候補を取得できます。

仕様:

- 指定した宿泊日・人数がある場合、楽天トラベル空室検索APIへ `hotelNo`、`checkinDate`、`checkoutDate`、`adultNum` を指定して問い合わせます。
- 取得できた場合は、`roomBasicInfo.reserveUrl` に含まれるプラン識別子を使い、`/hotelinfo/plan/{hotelNo}` 形式のプラン詳細URLを「最安プランを楽天トラベルで見る」に使います。
- `reserveUrl` は予約確認画面へ進むことがあるため、画面上のリンクでは直接使わず、宿泊日・人数のクエリを保持したプラン詳細URLへ変換します。
- `reserveUrl` がない場合は、`hotelBasicInfo.planListUrl`、`hotelBasicInfo.hotelInformationUrl` の順にフォールバックします。
- 楽天APIが `Data Not Found`、`not_found`、HTTP 404を返した場合は、指定条件で空室・料金が見つからない状態として扱い、通常の楽天トラベルページへのリンクを表示します。
- 楽天APIの仕様上、必ずしもすべての宿泊条件で予約リンクが取得できるとは限りません。
- 実際の料金、空室、キャンセル条件、予約条件は楽天トラベル側で確認してください。
- APIキー、`DATABASE_URL`、`CRON_SECRET` の実値は画面、ログ、APIレスポンス、READMEに出しません。

予約リンクAPI:

```text
/api/hotels/rakuten-78182/booking-url?checkIn=2026-08-10&checkOut=2026-08-11&adults=2
```

### 指定条件付き楽天トラベル予約リンク

宿泊日・チェックアウト日・人数を指定した場合、空室検索APIへ同じ条件を指定して予約リンクを取得します。最優先は `roomBasicInfo.reserveUrl` です。取得したURLには `checkinDate`、`checkoutDate`、`adultNum`、`roomNum` と楽天トラベル画面用の宿泊条件パラメータを追加します。

`reserveUrl` がない場合は、`planListUrl`、`hotelInformationUrl`、既存の予約URLの順に同じ条件を付与してフォールバックします。楽天側の仕様により、フォールバックURLでは日付が反映されない場合があり、そのときは画面で通常ページであることを示し、楽天トラベル側で日付を再指定するよう案内します。

予約リンクAPIのレスポンスには、URLの種別を表す `urlType` と、宿泊条件をURLに追加できたかを表す `dateParamsApplied` が含まれます。`debug=true` を付けると、施設番号、検索パターン、プラン数、各URLの有無などの安全な診断情報を確認できます。APIキー、DB接続文字列、Cronシークレットは返しません。

## 楽天トラベル価格表示の扱い

楽天トラベルAPIでは、宿泊日未指定の参考価格と、宿泊日・人数を指定した空室検索の価格を分けて扱います。

仕様:

- 宿泊日未指定のホテル検索では、楽天キーワード検索APIや施設情報に含まれる `hotelBasicInfo.hotelMinCharge` を参考最安値として表示します。
- `hotelMinCharge` は指定宿泊日の実料金ではないため、宿泊日指定時の最安値表示や料金追跡には使いません。
- 宿泊日、チェックアウト日、人数が指定されている場合は、楽天トラベル空室検索APIへ `hotelNo`、`checkinDate`、`checkoutDate`、`adultNum`、`roomNum=1`、`searchPattern=1`、`sort=+roomCharge`、`responseType=large`、`hits=30` を指定します。
- 指定宿泊日の価格は、空室検索APIレスポンス内の `dailyCharge.total` の最小値を使います。
- 指定日価格の抽出はまず `searchPattern=1` の1ページ目を確認し、`dailyCharge.total` が取れない場合だけ2ページ目、さらに `searchPattern=0` を最大2ページまで試します。
- `dailyCharge.total` がレスポンス内に1件もなく、`dailyCharge.rakutenCharge` だけが取れる場合は、単位が `chargeFlag` によって異なる可能性があるため「指定日の参考価格」としてのみ表示します。取得元とwarningをAPIのdebug情報に含めます。
- `dailyCharge.rakutenCharge` は `chargeFlag` によって1人あたり料金か1室あたり料金かが変わるため、基準価格にはしません。
- 料金追跡グラフへ保存する価格も、同じ `dailyCharge.total` の最小値です。宿泊日未指定の参考価格は保存しません。
- `Data Not Found` や指定条件に合う `dailyCharge.total` がない場合は、`price=null` として保存・表示します。
- 同じホテル、宿泊日、チェックアウト日、人数、取得日のスナップショットはupsertし、同日に再取得すると最新の指定日価格で上書きします。
- 実際の料金、空室、キャンセル条件、予約条件は楽天トラベル側で確認してください。

指定日価格のデバッグ:

```text
/api/hotels?keyword=東京&checkIn=2026-07-25&checkOut=2026-07-26&guests=2&debug=true
```

`debug=true` では、`dateSpecificPriceEnabled`、`dateSpecificPriceHotelLimit`、`pricedHotelCount`、`notFoundCount`、`priceSourceField`、最大5件の `priceSamples` を確認できます。APIキー、DB接続文字列、Cronシークレットなどの秘密情報は返しません。

## ホテル検索のページング

ホテル一覧はアプリ側で10件ずつ表示し、「前へ」「次へ」でページを移動できます。`page=2` 以降はURLクエリに保持されるため、更新や共有したURLでも同じページを開けます。検索条件、並び替え、フィルターを変更した場合は1ページ目に戻ります。

`/api/hotels` は `page` と `limit` を受け取ります。`page` の既定値は1、`limit` の既定値は10、上限は30です。通常レスポンスは次の形式です。

```json
{
  "hotels": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "warnings": []
}
```

楽天APIからは一覧候補として最大2ページ×30件を取得し、名寄せ後にアプリ側でページ分割します。楽天APIの`page`は候補を多く集めるためのページであり、アプリの`page`は画面に表示する10件単位のページです。

宿泊日・人数を指定した一覧検索では、ホテル候補を広く得るため`searchPattern=0`を使います。指定日の最安値を補完する個別検索だけは`searchPattern=1`を使い、現在表示中のページのホテルを対象にします。取得できなかったホテルは一覧から除外せず、「指定条件の料金未取得」または予約サイトでの確認対象として表示します。

地区候補に小分類コードがある場合はまず小分類で検索し、候補が少なければ中分類へ広げます。周辺エリアを含めた検索になった場合は画面に注意文を表示します。

ページングと候補数の確認例:

```text
/api/hotels?keyword=栃木&checkIn=2026-07-25&checkOut=2026-07-26&guests=2&page=2&limit=10&debug=true
```

`debug=true` では、アプリ側のページ番号・offset・件数、楽天APIの取得ページ数、地区フォールバック、指定日価格補完の件数を確認できます。APIキー、DB接続文字列、Cronシークレットなどの秘密情報は返しません。

## 楽天地区候補検索

ホテル検索フォームの地区候補は、楽天トラベル地区コードAPI `GetAreaClass` から取得します。

仕様:

- 楽天地区コードAPIの `largeClass`、`middleClass`、`smallClass`、`detailClass` の階層をフラット化し、都道府県単位、中分類、小分類、詳細分類を候補として扱います。
- 検索対象には地区名だけでなく、各階層のコードと表示ラベルも含めます。
- 都道府県名の表記ゆれに対応します。例: `東京` / `東京都`、`大阪` / `大阪府`、`京都` / `京都府`、`栃木` / `栃木県`。
- `北海道` は末尾の `道` を外さず、`北海道` として検索します。
- 例として `東京`、`栃木`、`栃木県`、`日光`、`那須`、`宇都宮`、`大阪`、`京都`、`北海道`、`福岡`、`沖縄` などを地区候補検索できます。
- 候補がない場合でもホテル検索自体はエラーにせず、目的地キーワード検索へフォールバックできます。
- 地区候補取得結果はメモリ上に短時間キャッシュし、楽天APIへの呼び出し回数を抑えます。Vercelのインスタンスが切り替わるとキャッシュはリセットされます。

通常確認:

```text
/api/areas?keyword=栃木
```

デバッグ確認:

```text
/api/areas?keyword=栃木&debug=true
```

`debug=true` では `rawMiddleClassCount`、`flattenedCandidateCount`、`matchedCount`、`normalizedKeywords`、`firstCandidateLabels`、`warnings` を確認できます。APIキー、DB接続文字列、Cronシークレットなどの秘密情報は返しません。

じゃらんProvider確認:

1. Vercelで `USE_MOCK_HOTELS=false` を設定する。
2. `USE_RAKUTEN_PROVIDER=false`、`USE_JALAN_PROVIDER=true` を設定する。
3. `JALAN_API_KEY` を設定する。
4. Redeployする。
5. `https://travel-reserve.vercel.app/api/debug/provider-config` でじゃらんProviderが有効で、APIキーが設定済みになっていることを確認する。
6. `https://travel-reserve.vercel.app/api/hotels?keyword=東京` がJSONを返すことを確認する。

楽天 + じゃらん確認:

1. Vercelで `USE_MOCK_HOTELS=false`、`USE_RAKUTEN_PROVIDER=true`、`USE_JALAN_PROVIDER=true` を設定する。
2. 必要なAPIキーを設定する。
3. Redeployする。
4. `/api/debug/provider-config` と `/api/hotels?keyword=東京` を確認する。

楽天APIがHTTP 403になる場合:

- 楽天地区コードAPIのURLが `/Travel/GetAreaClass/20140210` になっているか確認する。
- 楽天キーワード検索APIのURLが `/Travel/KeywordHotelSearch/20170426` になっているか確認する。
- 楽天空室検索APIのURLが `/Travel/VacantHotelSearch/20170426` になっているか確認する。
- `RAKUTEN_TRAVEL_APP_ID` と `RAKUTEN_TRAVEL_ACCESS_KEY` を設定する。
- この実装では `applicationId` と `accessKey` をクエリパラメータに入れて楽天APIへ送信している。
- 楽天ウェブサービスのAllowed websites/IPsに `https://travel-reserve.vercel.app` が登録されているか確認する。
- VercelのEnvironment Variablesに `RAKUTEN_ALLOWED_ORIGIN=https://travel-reserve.vercel.app` が設定されているか確認する。
- `USE_MOCK_HOTELS=false` が設定されているか確認する。
- `USE_RAKUTEN_PROVIDER=true` が設定されているか確認する。
- `RAKUTEN_TRAVEL_APP_ID` が設定されているか確認する。
- `RAKUTEN_TRAVEL_ACCESS_KEY` が設定されているか確認する。
- 環境変数を変更した後にRedeployしたか確認する。
- `/api/debug/provider-config` で楽天Provider、APIキー設定有無、`RAKUTEN_ALLOWED_ORIGIN` 設定有無を確認する。
- `/api/areas?keyword=東京` で地区コードAPIを確認する。
- `/api/hotels?keyword=東京` でホテル検索APIを確認する。

## 公開後の動作確認

- [ ] トップページが表示される
- [ ] ホテル一覧が表示される
- [ ] 目的地で検索できる
- [ ] 日付・人数を指定して検索できる
- [ ] 並び替えができる
- [ ] 上限価格フィルターが動く
- [ ] 予約サイトフィルターが動く
- [ ] 朝食ありフィルターが動く
- [ ] ホテル詳細ページを開ける
- [ ] お気に入り登録ができる
- [ ] お気に入り一覧ページを開ける
- [ ] ページ更新後もお気に入りが残る
- [ ] 検索条件がURLクエリに反映される
- [ ] URLを再読み込みしても検索条件が残る
- [ ] 画像がないホテルでも代替表示が出る
- [ ] 価格不明時に0円と表示されない
- [ ] 0件表示が分かりやすく出る
- [ ] エラー表示が分かりやすく出る
- [ ] `/api/hotels` がJSONを返す
- [ ] `/api/debug/provider-config` がAPIキーを直接返していない

## 本番環境の確認ポイント

- VercelのEnvironment Variablesが設定されているか確認する
- まずは `USE_MOCK_HOTELS=true` で公開確認する
- 外部APIを使う場合はVercel側にもAPIキーを登録する
- 環境変数を変更したらRedeployする
- APIキーをREADMEやコードに直接書かない
- `/api/debug/provider-config` でAPIキーの値そのものが返っていないか確認する

## API連携について

画面側は楽天トラベルAPIやじゃらんAPIを直接呼びません。Next.jsのRoute Handlerを経由して、サーバー側でProviderからホテル情報を取得します。

Providerごとの処理は `src/lib/hotelProviders/` に分けています。楽天、じゃらん、仮データのレスポンスは、アプリ共通の `Hotel` 型と `HotelOffer` 型に変換します。複数Providerが有効な場合は、取得結果を統合して画面に表示します。

主な内部APIは次の通りです。

- `/api/hotels`: ホテル一覧を取得
- `/api/hotels/[id]`: ホテル詳細を取得
- `/api/areas`: 地区候補を取得
- `/api/debug/provider-config`: Provider設定を確認

## Provider構成

Providerは次の3種類です。

- `mockProvider`: ローカルの仮データを返すProvider
- `rakutenProvider`: 楽天トラベルAPIに接続するProvider
- `jalanProvider`: じゃらんAPIに接続するProvider

Providerの切り替えには次の環境変数を使います。

- `USE_MOCK_HOTELS`
- `USE_RAKUTEN_PROVIDER`
- `USE_JALAN_PROVIDER`

`USE_MOCK_HOTELS=true` の場合は仮データを使用します。`USE_MOCK_HOTELS=false` の場合は、`USE_RAKUTEN_PROVIDER` と `USE_JALAN_PROVIDER` で有効にしたProviderを使用します。複数Providerが有効な場合は、それぞれの結果を結合し、同じホテルと思われるデータをまとめます。

## 名寄せ機能について

複数Providerから取得した同じホテルと思われるデータを1つのホテルにまとめます。予約サイトごとの料金は `offers` に集約し、ホテル一覧や詳細ページで比較できるようにしています。

現在はホテル名やエリアを使った簡易的な判定です。そのため、完全に同じホテルでも別ホテルとして表示されたり、別ホテルが同じホテルとしてまとまったりする可能性があります。将来的には住所、緯度経度、名称の類似度などを使って名寄せ精度を上げる予定です。

## お気に入り機能について

お気に入りホテルIDはブラウザの `localStorage` に保存しています。保存キー名は `favoriteHotelIds` です。

ブラウザを更新してもお気に入りは残ります。ただし、別ブラウザ・別端末には共有されません。現時点ではデータベースを使っていないため、ユーザーごとの永続保存やログイン連携は未対応です。

## 検索条件URL共有について

検索条件はURLクエリに反映されます。URLを共有すると、同じ検索条件でページを開けます。ページをリロードしても条件はURLから復元されます。

例:

```text
http://localhost:3000/?destination=東京&checkIn=2026-08-01&checkOut=2026-08-02&guests=2&sortBy=priceAsc
```

リセットボタンを押すと検索条件を消し、URLクエリも初期状態に戻します。

## スクリーンショット

スクリーンショットは必要に応じて後から追加予定です。今回はREADMEに画像を含めていません。

## 既知の制限

- お気に入りはlocalStorage保存のため、別ブラウザ・別端末では共有されない
- 名寄せは簡易的な判定であり、完全ではない
- 外部APIの価格・空室情報は取得タイミングにより変動する
- 一休.comやYahoo!トラベルは現時点では公式API連携ではなく、将来的にアフィリエイトリンク中心で検討する
- 実際の予約条件は各予約サイトで確認する必要がある

## 提出・ポートフォリオで説明するポイント

- 複数Provider構成にしたこと
- 楽天・じゃらんなどのデータを共通の `Hotel` 型に変換していること
- 同じホテルを名寄せして `offers` にまとめる構成にしたこと
- localStorageでお気に入りを保存していること
- URLクエリで検索条件を共有できるようにしたこと
- 画像なし・エラー・0件などの状態にも対応したこと
- APIキーをサーバー側で扱い、ブラウザに直接出さない方針にしたこと

## 工夫した点

- Provider構成にして、外部APIを追加しやすくした
- 楽天とじゃらんのデータを共通の `Hotel` 型に変換した
- 複数Providerの結果を名寄せして `offers` にまとめる構成にした
- 画像がないホテルでもUIが崩れないようにした
- 価格不明時に `0円` と表示しないようにした
- localStorageでお気に入りを簡単に保存できるようにした
- URLクエリで検索条件を共有できるようにした
- ローディング、エラー、0件表示を分かりやすくした
- Provider設定確認APIで環境変数の状態を確認できるようにした

## 今後の課題

- 名寄せ精度の向上
- 楽天空室検索APIの本格対応
- じゃらん空室検索APIの本格対応
- 一休.comやYahoo!トラベルはAPIや規約面を確認し、まずはアフィリエイトリンク中心に検討する
- データベースを使ったユーザーごとのお気に入り保存
- ログイン機能
- レビュー・評価情報の充実
- 公開後の運用確認
- テストの追加

## 注意事項

- APIキーは公開しないでください。
- `.env.local` はGit管理しないでください。
- 予約サイトの情報取得は各サービスの利用規約に従ってください。
- スクレイピングではなく、公式APIや許可された方法で取得してください。
- 表示価格はAPIレスポンスや取得タイミングによって変わる可能性があります。
- 実際の予約条件は予約サイト側で確認してください。
