# WOFF Sample Application

LINE WORKS WOFF (Works Front-end Framework) の基本的な実装サンプルです。

## 概要

このサンプルアプリケーションは、WOFFの初期化処理から基本的な機能の実装方法を示すシンプルな例です。

## 機能

- ✅ WOFF SDK初期化
- ✅ 初期化状態の視覚的表示
- ✅ ユーザー情報取得・表示
- ✅ エラーハンドリング
- ✅ デバッグ情報表示

## 使用技術

- HTML5
- CSS3 (Bootstrap 5.3.0)
- JavaScript (ES2017+)
- WOFF SDK v3.7.1

## WOFF設定

- **WOFF ID**: `lV79qXZbsMXYVk4FImwN2g`
- **WOFF URL**: https://woff.worksmobile.com/woff/lV79qXZbsMXYVk4FImwN2g

## ファイル構成

```
├── index.html          # メインHTMLファイル
├── script.js           # WOFF初期化とアプリロジック
├── README.md           # このファイル
└── .gitignore          # Git除外設定
```

## 開発環境での実行

1. このリポジトリをクローン
2. HTTPサーバーで `index.html` を配信（ローカルファイルでは動作しません）
3. ブラウザでアクセス

例（Python使用）:
```bash
python -m http.server 8000
```

## デプロイ

このサンプルは GitHub Pages でホストされています:
https://[username].github.io/woff-sample-app

## 参考資料

- [WOFF Developer Documentation](https://developers.worksmobile.com/jp/reference/woff)
- [LINE WORKS Developer Console](https://developers.worksmobile.com/)

## ライセンス

このサンプルコードはMITライセンスの下で公開されています。