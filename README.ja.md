# Google Apps Script モノレポテンプレート

[English](README.md) | **日本語**

複数の Google Apps Script（GAS）プロジェクトを 1 つのリポジトリで管理するためのテンプレートです。手元で TypeScript を書き、esbuild で 1 ファイルにまとめ、clasp で Apps Script に送ります。

## 使っているツール

| ツール                                                              | 役割                                            |
| ------------------------------------------------------------------- | ----------------------------------------------- |
| [clasp](https://github.com/google/clasp)                            | Apps Script のプロジェクトを取得・送信する      |
| TypeScript                                                          | 型チェック                                      |
| [esbuild](https://esbuild.github.io/)                               | プロジェクトごとに 1 ファイルへまとめる         |
| [esbuild-gas-plugin](https://github.com/mahaker/esbuild-gas-plugin) | まとめたコードを Apps Script で動く形にする     |
| [Biome](https://biomejs.dev/)                                       | Lint とフォーマット                             |
| [Vitest](https://vitest.dev/)                                       | テスト                                          |
| [lefthook](https://github.com/evilmartians/lefthook)                | コミット前にステージしたファイルへ Biome をかける |

## ディレクトリ構成

```
.
├── packages/
│   ├── _common/        ← 全プロジェクトで使う共通コード
│   │   ├── config/     ← 新しいプロジェクトにコピーする esbuild.config.js
│   │   └── src/
│   └── sample/         ← 最小のサンプル（不要になったら消してよい）
├── scripts/            ← clone・build・deploy・open のスクリプト
├── template/           ← 新しいプロジェクトにコピーする README.md
└── esbuild.config.js   ← 全プロジェクト共通の esbuild 設定
```

`packages/` 配下のディレクトリ 1 つが、Apps Script のプロジェクト 1 つに対応します（`_common` を除く）。

```
packages/<projectName>/
├── src/                ← ソースコード（TypeScript）
├── dist/               ← Apps Script に送るビルド結果（Git の管理外）
├── appsscript.json     ← Apps Script のマニフェスト（タイムゾーン、OAuth スコープなど）
├── esbuild.config.js   ← エントリーファイルと出力先
├── package.json        ← ビルド・デプロイのコマンドとスプレッドシートの URL
├── .clasp.dev.json     ← 開発環境のスクリプト ID（Git の管理外）
└── .clasp.prod.json    ← 本番環境のスクリプト ID（Git の管理外）
```

## 必要なもの

- [Node.js 24](https://nodejs.org/)
- [pnpm 12 以降](https://pnpm.io/installation)
- [clasp](https://github.com/google/clasp)（`npm install -g @google/clasp`）
- Apps Script を使える Google アカウント

## 環境構築

1. 依存パッケージを入れます。Git フックもこのとき有効になります。

   ```bash
   pnpm install
   ```

2. clasp で Google にログインします。別のアカウントに切り替えるときは、先に `clasp logout` を実行します。

   ```bash
   clasp login
   ```

3. <https://script.google.com/home/usersettings> で **Google Apps Script API** をオンにします。

## プロジェクトを追加する

`pnpm clone` で Apps Script のプロジェクトを `packages/` に取り込みます。新しく作る場合も同じです。先に Apps Script のプロジェクトを作り（スプレッドシートに紐づけるなら、スプレッドシートを開いて **拡張機能 → Apps Script**）、**プロジェクトの設定** からスクリプト ID をコピーしておきます。

```bash
pnpm clone
Project name (e.g. my-project): <projectName>
Script ID: <scriptId>
dev spreadsheet URL (optional): ...
prod spreadsheet URL (optional): ...
```

- プロジェクト名はケバブケース（英小文字・数字・ハイフン）です。形が違うときや、すでにある名前のときは、もう一度聞かれます
- 取得した `.gs` / `.js` / `.html` は `src/` に移されます
- `.clasp.json` は `.clasp.prod.json` と `.clasp.dev.json` に分かれます。**どちらも取り込んだスクリプトを指している**ので、`.clasp.dev.json` には開発用のスクリプト ID を自分で書き込みます
- `esbuild.config.js`・`README.md`・`package.json` が作られます。スプレッドシートの URL は `package.json` と `README.md` に入ります

続けて次の 2 つを行います。

1. エントリーファイルを `src/index.ts` に改名します（または `esbuild.config.js` の `entryPoints` を書き換えます）。エントリーファイルは `src/` の中、出力先は `dist/` の中から動かせません
2. Apps Script から呼ぶ関数（メニュー、トリガー、`onOpen` など）を `global` に載せます。例は `packages/sample/src/index.ts` にあります

   ```typescript
   declare const global: { [x: string]: unknown };

   global.onOpen = onOpen;
   ```

## ビルド

```bash
cd packages/<projectName>
pnpm build
```

- esbuild が `src/` を `dist/` の 1 ファイルにまとめ、先頭に「スクリプトエディタで編集しないこと」という警告を入れます
- `appsscript.json` と、`src/` 配下のすべての `.html` が `dist/` にコピーされます。`.html` はサブディレクトリにあっても `dist/` の直下に並ぶため、ファイル名が重ならないようにします

`pnpm build:time` を実行すると、最後にビルドした時刻と、それより新しいコミットが `src/` にあるかが分かります。コミットしていない変更は判定に含まれません。

全プロジェクトをまとめてビルドするときは、リポジトリのルートで `pnpm build` を実行します。

## デプロイ

> [!WARNING]
> デプロイすると、Apps Script 上のコードは**上書き**されます。必ずビルドしてから実行します。

1. `.clasp.dev.json` / `.clasp.prod.json` に各環境のスクリプト ID を書きます。スクリプト ID は Apps Script エディタの **プロジェクトの設定** で確認できます。

   ```json
   {
     "scriptId": "スクリプト ID",
     "rootDir": "./dist"
   }
   ```

2. プロジェクトのディレクトリでデプロイします。

   ```bash
   cd packages/<projectName>
   pnpm deploy:dev    # 開発環境
   pnpm deploy:prod   # 本番環境
   ```

   環境に合った `.clasp.<env>.json` が `.clasp.json` にコピーされ、`clasp push` で `dist/` が送られます。

## スプレッドシートを開く

プロジェクトの `package.json` の `spreadsheetUrls` に URL を書きます（`pnpm clone` で入力した場合は書き込み済みです）。

```json
"spreadsheetUrls": {
  "dev": "https://docs.google.com/spreadsheets/d/.../edit",
  "prod": "https://docs.google.com/spreadsheets/d/.../edit"
}
```

```bash
cd packages/<projectName>
pnpm open:dev
pnpm open:prod
```

## 共通コード

`packages/_common/src/` には、どのプロジェクトからでも読み込める部品を置いています。読み込んだ分だけが、esbuild で各プロジェクトに含まれます。

```typescript
import { getSheet } from "../../_common/src/spreadsheet";
```

| ファイル                   | 中身                                                     |
| -------------------------- | -------------------------------------------------------- |
| `spreadsheet.ts`           | シートの読み書き、A1 形式の変換、スクリプトプロパティ   |
| `http.ts` / `utils.ts`     | 外部 API の呼び出し、現在の日時と月                      |
| `date.ts`                  | `YYYY-MM-DD` 形式の日付の計算                            |
| `logger.ts`                | 決まった形式でのログ出力                                 |
| `trigger.ts`               | 毎日実行するトリガーの作り直し                           |
| `setupScriptProperties.ts` | 未設定のスクリプトプロパティを仮の値でまとめて登録する   |

## コマンド

リポジトリのルートで実行するもの:

```bash
pnpm clone          # プロジェクトを追加する
pnpm build          # 全プロジェクトをビルドする
pnpm check          # Lint とフォーマットの検査（Biome）
pnpm lint           # Lint だけ
pnpm format         # フォーマット
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest（1 回だけ実行）
pnpm test:watch     # Vitest（変更を監視）
```

`packages/<projectName>` で実行するもの:

```bash
pnpm build
pnpm build:time
pnpm deploy:dev / pnpm deploy:prod
pnpm open:dev / pnpm open:prod
```

## テスト

テストは、対象のコードの隣に `*.test.ts` として置きます。Node.js には Apps Script のサービス（`SpreadsheetApp`、`UrlFetchApp` など）が無いため、処理をサービスに依存しない関数に切り出す（`packages/sample/src/greeting.ts`）か、`vi.stubGlobal` でサービスを差し替えます（`packages/_common/src/http.test.ts`）。

## トラブルシューティング

### `User has not enabled the Apps Script API`

<https://script.google.com/home/usersettings> で **Google Apps Script API** をオンにして、もう一度デプロイします。反映まで数分かかることがあります。

### `.clasp.dev.json not found`

`.clasp.*.json` は Git の管理外なので、リポジトリを clone した直後にはありません。[デプロイ](#デプロイ) の手順で作ります。

## ライセンス

[MIT](LICENSE)
