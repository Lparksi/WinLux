# WinLux

[English](./README.md) | [简体中文](./README.zh-CN.md) | 日本語 | [한국어](./README.ko.md)

WinLux は Tauri 2 + React で構築された、Windows 専用の軽量デスクトップユーティリティです。
Windows のライト/ダークテーマをすばやく切り替え、システムトレイ常駐、言語設定の管理、そして日の出/日没に基づく自動テーマ切り替えに対応しています。

## 目次

- [機能](#機能)
- [スクリーンショット](#スクリーンショット)
- [技術スタック](#技術スタック)
- [要件](#要件)
- [クイックスタート](#クイックスタート)
- [スクリプト](#スクリプト)
- [検証](#検証)
- [プロジェクト構成](#プロジェクト構成)
- [日の出/日没 自動テーマメモ](#日の出日没-自動テーマメモ)
- [OpenStreetMap の帰属表記](#openstreetmap-の帰属表記)
- [言語メモ](#言語メモ)
- [ライセンス](#ライセンス)

## 機能

- Apps と System の両方に対して、ダーク/ライトをワンクリックで切り替え。
- Windows テーマ設定の読み書き:
  - `HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize`
- システムトレイ機能:
  - メインウィンドウを開く
  - ダーク/ライトをクイック切り替え
  - 日の出/日没 自動テーマの切り替え
  - 言語設定の変更
  - アプリ終了
- ウィンドウを閉じても終了せず、トレイへ最小化。
- 言語設定をサポート（`auto` でシステム追従、または手動選択）。
- 日の出/日没 設定パネル:
  - 日の出/日没 自動テーマ設定のために住所を座標へ解決（OpenStreetMap Nominatim）
  - 保存した地点で指定日の日の出/日没を取得
  - ローカル日の出/日没時刻に基づき Apps/System テーマを自動切り替え
- NSIS インストーラーで 30 言語を選択可能。

## スクリーンショット

| Main Window | Tray Menu |
| --- | --- |
| ![Main Window](docs/screenshots/main-window.png) | ![Tray Menu](docs/screenshots/tray-menu.png) |
| Main interface | Tray quick actions |

## 技術スタック

- フロントエンド: React 18 + TypeScript + Vite
- デスクトップランタイム: Tauri 2
- バックエンド: Rust + `winreg` + `reqwest` + `sunrise` + `tokio`
- パッケージマネージャー: Bun

## 要件

- Windows 10 または Windows 11
- Bun（最新安定版推奨）
- Rust stable toolchain（MSVC ターゲット）
- Tauri の Windows 前提要件（WebView2 / ビルドツール）
- インターネット接続（OpenStreetMap Nominatim による住所ジオコーディング時のみ必要）

## クイックスタート

```bash
bun install
bun run tauri:dev
```

アプリはデスクトップウィンドウとして起動し、トレイアイコンからも操作できます。

## スクリプト

| Command | Description |
| --- | --- |
| `bun run dev` | Vite フロントエンドのみ起動（`http://localhost:5173`） |
| `bun run build` | 型チェック後、フロントエンド資産を `dist/` にビルド |
| `bun run typecheck` | TypeScript 型チェックのみ実行 |
| `bun run i18n:check` | ロケール key とプレースホルダーを検証 |
| `bun run tauri:dev` | Tauri デスクトップアプリを開発モードで実行 |
| `bun run tauri:build` | デスクトップ配布物をビルド（NSIS） |
| `bun run release` | 最新 Git タグからバージョン推定してリリースビルド |
| `bun run icon:gen` | Windows アイコン資産を生成 |

## 検証

PR 作成前に最低限以下を実行してください:

```bash
bun run typecheck
cargo test -p winlux
```

## プロジェクト構成

```text
.
├─ src/                 # React frontend and Tauri bridge
│  └─ lib/tauri.ts      # invoke wrappers + shared TS contracts
├─ src-tauri/src/       # Rust backend (commands, tray, i18n)
├─ src-tauri/icons/     # App/package icons
├─ scripts/             # Build/release helper scripts
└─ dist/                # Frontend output consumed by Tauri builds
```

## 日の出/日没 自動テーマメモ

- ジオコーディング API:
  - `https://nominatim.openstreetmap.org/search`
- 日の出/日没 自動テーマ worker:
  - バックグラウンドで動作し、保存地点のローカル日の出/日没に基づいてライト/ダークを適用。
  - 自動テーマ有効時に地点未保存の場合、設定が必要である旨のエラーを返します。
- 設定の保存先:
  - `HKCU\Software\WinLux\SolarAddress`
  - `HKCU\Software\WinLux\SolarDisplayName`
  - `HKCU\Software\WinLux\SolarLatitude`
  - `HKCU\Software\WinLux\SolarLongitude`
  - `HKCU\Software\WinLux\SolarAutoThemeEnabled`

## OpenStreetMap の帰属表記

- WinLux は OpenStreetMap Nominatim（ `https://nominatim.openstreetmap.org/search` ）を使用し、ユーザーが入力した住所を緯度経度へ変換して、日の出/日没 自動テーマ機能に利用します。
- ジオコーディングデータの著作権は © OpenStreetMap contributors に帰属し、ODbL 1.0 ライセンスで提供されています。
- 著作権とライセンスの詳細: `https://www.openstreetmap.org/copyright`

## 言語メモ

- 対応言語（30）:
  - English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Thai, Vietnamese, Indonesian, French, German, Italian, Spanish (Spain), Spanish (International), Portuguese (Portugal), Portuguese (Brazil), Russian, Polish, Turkish, Ukrainian, Czech, Hungarian, Greek, Bulgarian, Romanian, Arabic, Dutch, Danish, Finnish, Norwegian, Swedish
- メインウィンドウ UI 文字列は上記 30 言語すべてに対応。
- トレイメニュー文字列は `src/locales/tray-texts.json` から読み込み。
- 言語設定の保存先:
  - `HKCU\Software\WinLux\LanguagePreference`

## ライセンス

MIT. 詳細は `LICENSE` を参照してください。
