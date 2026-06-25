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
https://travel-reserve.vercel.app/api/debug/provider-config
```

## 本番でのProvider確認手順

楽天Provider確認:

1. Vercelで `USE_MOCK_HOTELS=false` を設定する。
2. `USE_RAKUTEN_PROVIDER=true`、`USE_JALAN_PROVIDER=false` を設定する。
3. `RAKUTEN_TRAVEL_APP_ID` と `RAKUTEN_TRAVEL_ACCESS_KEY` を設定する。
4. 必要な場合だけ `RAKUTEN_AFFILIATE_ID` を設定する。
5. Redeployする。
6. `https://travel-reserve.vercel.app/api/debug/provider-config` で楽天Providerが有効で、必要なキーが設定済みになっていることを確認する。
7. `https://travel-reserve.vercel.app/api/hotels?keyword=東京` がJSONを返すことを確認する。
8. トップページで東京を検索する。

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
