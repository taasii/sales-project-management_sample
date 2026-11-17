# 営業案件情報管理システム（サンプル）

営業担当者が保有する案件情報を一元管理し、エンジニアが自分に合った案件を検索・閲覧できるシステムの**デモ用プロトタイプ**です。
社内DXの改善提案用で、**表示データはすべて架空**です。

サーバー・DBを使わない**静的サイト**で、GitHub Pagesでそのまま動作します。

## できること（サンプル）

| 画面 | ファイル | 内容 |
| --- | --- | --- |
| 案件一覧 | `index.html` | フリーワード／項目別検索、領域・勤務地・単価帯の絞り込み、件数表示、NEW表示、並び替え |
| 案件詳細 | `detail.html?id=1` | 基本情報・応募資格・労働条件、**「応募する」ボタン**（営業へ連絡が行く旨をポップアップ表示。実際の送信はなし） |
| ログイン | `login.html` | 登録画面の手前の認証画面。**ID `sample` / パスワード `sample` 固定**（サンプル用でセキュリティ機能ではありません） |
| 案件登録 | `edit.html` | 入力フォーム・入力チェック・確認ポップアップ・完了メッセージ。**実際の保存は行いません** |

- 案件データは `public/data/projects.json`（10件）を読み込みます。検索・絞り込みはブラウザ上で実行します。
- ログイン状態はブラウザのタブを閉じるまで保持されます（sessionStorage）。
- ログインはあくまで画面遷移のデモです。静的サイトのため、実際の認証・保存・営業への通知はできません。

## GitHub Pagesで公開する手順

1. このフォルダ一式をGitHubリポジトリにpushする（ブランチ名は `main`）。
2. GitHubのリポジトリ → **Settings → Pages** → **Source** を **「GitHub Actions」** にする。
3. 同梱の `.github/workflows/pages.yml` が `public/` フォルダを自動で公開します（push後、Actionsタブで完了を確認）。
4. 公開URL：`https://<ユーザー名>.github.io/<リポジトリ名>/`

> 社内向けデータを扱う場合、GitHub Pagesは（プランによらず設定次第で）外部から閲覧可能になります。今回は架空データのみです。

## ローカルで確認する

Node.js 18以上が必要です。

```bash
npm install
npm run dev      # http://localhost:3000
```

`public/index.html` を直接ダブルクリックで開くと、ブラウザの制限でJSONを読めないため、上記コマンドか任意の静的サーバーで開いてください。
停止は `Ctrl + C` です。

## データの編集

`public/data/projects.json` を編集して再読み込みすると反映されます。
`created_at` から7日以内の案件に `NEW` が付くため、デモ前に日付を直近へ更新してください。

## ディレクトリ構成

```
project-board/
├─ .github/workflows/pages.yml   GitHub Pages自動デプロイ
├─ package.json / README.md
├─ server/index.js               ローカル確認用の静的サーバー
└─ public/                       公開される静的サイト本体
   ├─ index.html / detail.html / login.html / edit.html
   ├─ css/style.css
   ├─ js/common.js（データ取得・検索・ログイン・共通部品）/ list.js / detail.js / login.js / edit.js
   └─ data/projects.json         仮データ（10件）
```

## 本番化する場合

本物の登録・保存・認証・営業への通知にはサーバーが必要です。`public/js/common.js` の `api` オブジェクト（データ取得）と、
`edit.js` / `detail.js` の送信部分を、API呼び出しに差し替える構成を想定しています（Node.js/Express＋DB等を別ホストで稼働）。
