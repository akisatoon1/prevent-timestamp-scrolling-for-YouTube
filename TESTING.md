# E2E テスト手順（開発者向け）

この拡張機能（YouTube のタイムスタンプ・クリック時に**ページ先頭へのスクロールを抑止**する）が
正しく動くかを、実際の YouTube に対して **Playwright** で確認するための手順です。

テストはローカルで実行し、ブラウザ操作を**目視**できるようになっています。

## テスト内容

| ケース | 内容 |
| --- | --- |
| ケースA | YouTube ホーム → 検索で動画を開く（SPA遷移）→ **コメント欄**のタイムスタンプをクリック |
| ケースB | 動画を直接開く → **コメント欄**のタイムスタンプをクリック |
| ケースC | 動画を直接開く → **概要欄(description)**のタイムスタンプをクリック |
| ケースD | **ライブアーカイブ(`/live/VIDEO_ID`)** を直接開く → **コメント欄**のタイムスタンプをクリック |

**成功条件はただ一つ:「タイムスタンプをクリックしてもページが先頭へスクロールしないこと」**
（リンクが見える程度にページを下方へスクロールした状態でクリックし、クリック後も
先頭(scrollY≈0)へ戻らないことを検証します。拡張が無効だと SPA 遷移で先頭へ飛びます）

対象動画は既定で `https://www.youtube.com/watch?v=eKC3_9gRrOI` です。

## 前提

- Node.js（18 以上推奨）
- 拡張は Manifest V3 のコンテンツスクリプトのみ。テストは拡張をロードした Chromium を起動して実行します。

## セットアップ

リポジトリのルートで:

```bash
npm install
npx playwright install chromium
```

## 実行

### 1. 通常実行（ブラウザを目視）

```bash
npm run test:e2e
```

- ブラウザが実際に立ち上がり、`slowMo` でゆっくり操作します。
- 「ホーム→検索→動画→タイムスタンプをクリック」の流れがそのまま見えます。
- 3 ケースが順番に実行されます。

### 1-2. ケースを個別に実行

特定のケースだけ実行したいときは、専用スクリプトを使います:

```bash
npm run test:e2e:a   # ケースA のみ
npm run test:e2e:b   # ケースB のみ
npm run test:e2e:c   # ケースC のみ
npm run test:e2e:d   # ケースD のみ（/live ライブアーカイブ）
```

環境変数（`WATCH_VIDEO_ID` / `LIVE_VIDEO_ID` など）と併用できます:

```bash
LIVE_VIDEO_ID=xxxxxxxxxxx npm run test:e2e:d
```

任意の文言で絞り込みたい場合は `-g`（grep）を直接指定もできます:

```bash
npx playwright test --headed -g ケースD
```

### 2. UI モード（ステップごとに確認・デバッグ）

```bash
npm run test:e2e:ui
```

- Playwright の UI モードが開き、テストをステップ送りしたり、各時点の DOM スナップショット
  （タイムトラベル）を確認できます。セレクタが合わなくなったときの調査に便利です。

### 3. レポート（録画・トレースの確認）

実行後に:

```bash
npm run report
```

- 各ケースの**録画動画**、スクリーンショット、トレース（操作の時系列）を閲覧できます。
- 失敗時の原因調査はまずここを見てください。

## 対象動画を変える

環境変数で上書きできます:

```bash
# 例: 別の動画を対象にする
WATCH_VIDEO_ID=xxxxxxxxxxx npm run test:e2e

# ケースA の検索クエリも変えたい場合（既定は WATCH_VIDEO_ID と同じ）
WATCH_VIDEO_ID=xxxxxxxxxxx SEARCH_QUERY="動画タイトル" npm run test:e2e

# 例: ケースD（/live）の対象を指定して実行
LIVE_VIDEO_ID=xxxxxxxxxxx npm run test:e2e
```

- `WATCH_VIDEO_ID`: 対象動画の ID（`watch?v=` の後ろ）。**コメント欄・概要欄の両方にタイムスタンプ付き
  リンクがある動画**を選んでください。
- `SEARCH_QUERY`: ケースA でホームから動画へ遷移するための検索語。既定は動画ID
  （ID で検索すると当該動画が結果に出るため）。ヒットしにくい場合は動画タイトルを指定します。
- `LIVE_VIDEO_ID`: ケースD（`/live/VIDEO_ID` 形式のライブアーカイブ）の対象動画ID。
  既定は `1J_9-rpdPzw`（`https://www.youtube.com/live/1J_9-rpdPzw`）。別のライブアーカイブで
  試す場合に上書きします。コメント欄にタイムスタンプ付きリンクがあるものを選んでください。

## 仕組み（ファイル構成）

```
playwright.config.js          … headed + slowMo、録画/トレース常時記録の設定
tests/
  fixtures/extension.js       … 拡張をロードした Chromium を起動するフィクスチャ
  helpers.js                  … 同意ダイアログ処理 / コメント・概要欄の展開 /
                                タイムスタンプ検出 / スクロール判定
  timestamp-scroll.spec.js    … ケースA / B / C / D の本体
```

## うまくいかないとき

実 YouTube を相手にするため、外的要因で不安定になることがあります。主な対処:

- **同意ダイアログ / Cookie 同意が出て止まる**
  `tests/helpers.js` の `dismissConsent` がボタン文言で閉じています。文言やセレクタが
  変わった場合はここを調整してください。
- **「タイムスタンプ付きリンクが見つかりません」エラー**
  対象動画のコメント/概要欄にタイムスタンプが無い、または読み込みが遅い可能性があります。
  別の動画（`VIDEO_ID`）に変えるか、`helpers.js` のスクロール回数・待機時間を増やしてください。
- **セレクタが合わない（YouTube のレイアウト変更）**
  `npm run test:e2e:ui` でステップごとに DOM を確認し、`helpers.js` のセレクタを更新します。
- **bot 判定 / CAPTCHA**
  ネットワーク環境によっては出ることがあります。時間をおく、別環境で試す等で回避してください。

> 注意: 概要欄のタイムスタンプ（ケースC）はリンクの `href` 形式（`v=` を含むか、`id="endpoint"`
> か）によって拡張側の処理経路が変わります。対象動画を変えた際はケースCのクリック対象が
> 期待どおりか UI モードで確認してください。
