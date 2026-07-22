# Zeta Chat

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-000?logo=shadcnui)](https://ui.shadcn.com)
[![pnpm](https://img.shields.io/badge/pnpm-latest-F69220?logo=pnpm)](https://pnpm.io)

Zeta AI プラットフォームの非公式 Web チャットクライアント。AI キャラクターと会話できるシングルページアプリケーションです。

---

## どうやったらつかえますか
ブラウザで https://zeta-ai.io/ を開いてお好みの方法でログイン

できたらCtrl+Shift+IもしくはF12を押して

<img width="240" height="280" alt="image" src="https://github.com/user-attachments/assets/70631641-ef38-4334-9091-6bf76136f272" />

↑こんなのを開く

したら上にいっぱいある奴から>> を探して、**Application**ってのをクリック

その中の🍪Cookiesってのをクリックして

さらにその中にある🍪https://zeta-ai.io/ を探してください

<img width="110" height="300" alt="image" src="https://github.com/user-attachments/assets/748cd2c5-bc6f-4e30-9215-531d1ab24811" />

こんな感じでいっぱいあるから、その中の**DEVICE_ID**って値と**REFRESH_TOKEN**の2つの値をコピーします

できたらウェブの設定を開いて、Device IDとRefresh Tokenにさっきコピーした値をそれぞれ入力する

そうしたらセッションを更新を押せばログインしてあとは好きなように使えます

---

## Features

- **プロット探索** — ホームのおすすめやランキング（トレンド / ベスト / 新着）からシナリオ（プロット）を探す
- **AI チャット** — SSE ストリーミングによるリアルタイム対話
- **候補切り替え** — メッセージの再生成や前後の候補へのスワイプ切替に対応
- **編集・削除** — 届いたメッセージの編集や、特定位置からのメッセージ一括削除
- **トークプロフィール** — ユーザー自身のキャラクター設定（プロフィール）を作成・管理
- **おすすめ返信** — web版だと使えないおすすめ返信の取得も実装済！
- **クイズ自動化** — デイリークイズへの自動参加と報酬受取
- **画像キャッシュ** — Cache API を利用した画像読み込みの最適化
- **ダークテーマ** — 常時ダークモード
みたいに、アプリでできる基本的なチャット機能はほとんど実装できてるはずです。
---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (18 or later)
- [pnpm](https://pnpm.io)

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

起動後、ブラウザで `http://localhost:3000` にアクセスします。

初回起動時は認証情報（Device ID / Refresh Token）が必要です。設定画面から入力してください。

### Build

```bash
pnpm build
```

`dist/` に本番用の静的ファイルが出力されます。

### Preview

```bash
pnpm preview
```

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19, TypeScript 5.9 |
| Build tool | Vite 7 |
| Routing | React Router v7 (HashRouter) |
| UI Library | Tailwind CSS v4, shadcn/ui, Radix UI |
| Icons | lucide-react |
| Animation | tw-animate-css |
| Package manager | pnpm (workspace) |
| API Client | Custom fetch wrapper + SSE |
| Fonts | Noto Sans JP, Geist |

---

## Project Structure

```
zeta-dev/app/
├── src/
│   ├── pages/          # 画面コンポーネント
│   │   ├── home.tsx    # ホーム（おすすめ一覧）
│   │   ├── chat.tsx    # チャット画面
│   │   ├── ranking.tsx # ランキング
│   │   ├── rooms.tsx   # チャットルーム一覧
│   │   └── settings.tsx# 設定
│   ├── components/     # UI 部品
│   │   ├── ui/         # shadcn/ui コンポーネント
│   │   ├── layout/     # AppShell, BottomNav
│   │   ├── plot-card.tsx
│   │   ├── info-box.tsx
│   │   └── ...
│   ├── lib/            # ビジネスロジック
│   │   ├── api.js      # API クライアント
│   │   ├── auth.js     # 認証管理
│   │   ├── quiz-client.ts # クイズ自動化
│   │   ├── types.ts    # 型定義
│   │   └── ...
│   └── hooks/          # カスタムフック
├── scripts/            # ビルド前処理
└── package.json
```

---

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | 開発サーバー起動 (port 3000) |
| `pnpm build` | TypeScript チェック + ビルド |
| `pnpm preview` | ビルド結果のプレビュー |
| `pnpm lint` | ESLint によるコードチェック |
| `pnpm format` | Prettier によるコードフォーマット |
| `pnpm typecheck` | TypeScript 型チェックのみ実行 |

---

## API

本アプリケーションは `https://api.zeta-ai.io` を API エンドポイントとして通信します。
認証には Bearer Token を使用します。

---

## 懸念事項みたいな
内部api勝手に叩いてるだけなのでアカウントがbanされたりするかもしれないです(ヘッダに関してはandroidのものと合わせてあります)
