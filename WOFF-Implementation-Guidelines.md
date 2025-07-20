# WOFF実装時の留意事項

このドキュメントは、WOFF (Works Front-end Framework) アプリケーション開発時のトラブルシューティングと修正履歴をもとに作成された実装ガイドラインです。

## 目次

1. [WOFF SDK初期化関連](#1-woff-sdk初期化関連)
2. [ログイン・認証処理](#2-ログイン認証処理)
3. [アプリ間リンク設定](#3-アプリ間リンク設定)
4. [Developer Console設定](#4-developer-console設定)
5. [デバッグとエラーハンドリング](#5-デバッグとエラーハンドリング)
6. [API認証](#6-api認証)
7. [HTMLでのSDK読み込み](#7-htmlでのsdk読み込み)
8. [キャッシュ対策](#8-キャッシュ対策)
9. [環境別設定管理](#9-環境別設定管理)
10. [よくあるエラーパターンと対処法](#10-よくあるエラーパターンと対処法)
11. [推奨実装パターン](#11-推奨実装パターン)

---

## 1. WOFF SDK初期化関連

### ❌ よくある間違い

```javascript
// オブジェクトを渡す（エラーの原因）
await woff.init({
    woffId: { woffId: 'your-id' }
});

// ES6モジュールを使う（WOFF環境では問題）
import { WOFFSDKManager } from '../common/scripts/index.js';
```

### ✅ 正しい実装

```javascript
// シンプルにwoffIdのみ渡す
await woff.init({
    woffId: 'your-woff-id'
});

// 直接的なSDK呼び出し
const profile = await woff.getProfile();
const token = await woff.getAccessToken();
```

**ポイント:**
- `woff.init()`には文字列のwoffIdのみを渡す
- 複雑なラッパークラスは避け、直接SDKを呼び出す
- ES6モジュールではなく、グローバルな`woff`オブジェクトを使用

---

## 2. ログイン・認証処理

### ❌ 問題のあるパターン

```javascript
// 無限リダイレクトの原因
if (!woff.isInClient() && !woff.isLoggedIn()) {
    woff.login(); // これが他のページにリダイレクトする
    return;
}
```

### ✅ 推奨パターン

```javascript
// 外部ブラウザでもアプリを動作させる
if (!woff.isInClient() && !woff.isLoggedIn()) {
    console.log('外部ブラウザでの動作');
    // woff.login()は必要な場合のみ呼び出す
}
```

**ポイント:**
- `woff.login()`は予期しないリダイレクトを引き起こす可能性がある
- 外部ブラウザでもアプリが動作するように設計する
- ログイン状態をチェックしてから適切な処理を行う

---

## 3. アプリ間リンク設定

### ❌ 相対パスリンク

```html
<!-- これではWOFF環境で正常に動作しない -->
<a href="list.html">申請一覧</a>
<a href="index.html">新規申請</a>
```

### ✅ WOFF URLを使用

```html
<!-- 正しいWOFF間リンク -->
<a href="https://woff.worksmobile.com/woff/other-woff-id">他のアプリ</a>
```

**例:**
```html
<!-- 有給休暇申請フォームから申請一覧へ -->
<a href="https://woff.worksmobile.com/woff/3ZHy-bIIOXEdYm8zSkLFNQ" class="btn btn-sm btn-outline-primary">申請一覧</a>

<!-- 申請一覧から新規申請へ -->
<a href="https://woff.worksmobile.com/woff/-5G8zjBHKSNjyxEzJ3gKCQ" class="btn btn-primary btn-sm">新規申請</a>
```

**ポイント:**
- 相対パスは使用しない
- 必ず完全なWOFF URLを使用する
- 各アプリには異なるWOFF IDが必要

---

## 4. Developer Console設定

### 重要な設定項目

| 設定項目 | 説明 | 注意点 |
|----------|------|--------|
| **Default URL/ランディングページ** | アプリ起動時の初期ページ | 意図したページ（index.html等）に設定 |
| **Endpoint URL** | アプリのホスティング先 | 正しいCloudFrontドメインを指定 |
| **WOFF ID** | アプリの一意識別子 | アプリごとに異なるIDを使用 |

### 設定例

```
アプリ名: 有給休暇申請フォーム
WOFF ID: -5G8zjBHKSNjyxEzJ3gKCQ
Endpoint URL: https://din1ybludbjvt.cloudfront.net
Default URL: index.html

アプリ名: 休暇申請一覧
WOFF ID: 3ZHy-bIIOXEdYm8zSkLFNQ
Endpoint URL: https://din1ybludbjvt.cloudfront.net/list.html
Default URL: list.html
```

---

## 5. デバッグとエラーハンドリング

### モバイル環境でのデバッグ

```javascript
// コンソールが見えない環境用
document.title = `Debug: userId=${userId}, token=${token ? 'ok' : 'null'}`;

// 詳細エラー情報を画面に表示
function showErrorState(message) {
    document.getElementById('errorMessage').textContent = message;
    // エラー詳細をタイトルにも表示
    document.title = `Error: ${message}`;
}

// 環境情報表示（デバッグ用）
function displayEnvironmentInfo() {
    const os = woff.getOS();
    const version = woff.getVersion();
    const isInClient = woff.isInClient();
    
    console.log('=== 環境情報 ===');
    console.log('OS:', os);
    console.log('WOFF SDKバージョン:', version);
    console.log('LINE WORKS内ブラウザ:', isInClient);
    console.log('ユーザー:', currentUser);
}
```

**ポイント:**
- モバイルアプリ内ブラウザではコンソールが確認できない
- タイトルバーを活用してデバッグ情報を表示
- エラーメッセージは詳細に記録する

---

## 6. API認証

### 正しいアクセストークン使用

```javascript
async function getAccessToken() {
    try {
        if (isWoffInitialized && (woff.isInClient() || woff.isLoggedIn())) {
            return await woff.getAccessToken();
        }
        return null;
    } catch (error) {
        console.warn('アクセストークン取得警告:', error);
        return null;
    }
}

// API呼び出し時
async function callAPI(endpoint, data = null) {
    const accessToken = await getAccessToken();
    
    const response = await fetch(endpoint, {
        method: data ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        ...(data ? { body: JSON.stringify(data) } : {})
    });
    
    if (!response.ok) {
        throw new Error(`API呼び出しエラー: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}
```

**ポイント:**
- アクセストークンの取得に失敗してもアプリを停止させない
- APIリクエストには必ずAuthorizationヘッダーを付与
- エラーハンドリングを適切に実装

---

## 7. HTMLでのSDK読み込み

### 必須のSDK script tag

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WOFF Application</title>
    <!-- CSS files -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <!-- Application content -->
    
    <!-- WOFF SDK - 必ずbodyの最後、他のscriptより前に配置 -->
    <script charset="utf-8" src="https://static.worksmobile.net/static/wm/woff/edge/3.7.1/sdk.js"></script>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom JS - WOFF SDKの後に配置 -->
    <script src="your-app-script.js"></script>
</body>
</html>
```

### SDK読み込み待機

```javascript
// WOFF SDKがロードされるまで待機
async function waitForWoffSDK() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (typeof woff !== 'undefined') {
                clearInterval(checkInterval);
                console.log('WOFF SDKが読み込まれました');
                resolve();
            }
        }, 100); // 100msごとにチェック
        
        // タイムアウト設定（10秒）
        setTimeout(() => {
            clearInterval(checkInterval);
            throw new Error('WOFF SDKの読み込みがタイムアウトしました');
        }, 10000);
    });
}
```

**ポイント:**
- WOFF SDKは他のスクリプトより先に読み込む
- SDKの読み込み完了を待ってから初期化を開始
- タイムアウト処理を実装してエラーハンドリングを行う

---

## 8. キャッシュ対策

### CloudFrontキャッシュ無効化

```bash
# 更新後は必ずキャッシュ無効化
aws cloudfront create-invalidation --distribution-id YOUR-DISTRIBUTION-ID --paths "/*"

# 特定ファイルのみ無効化
aws cloudfront create-invalidation --distribution-id YOUR-DISTRIBUTION-ID --paths "/script.js" "/list.js"
```

### S3デプロイ時のContent-Type指定

```bash
# HTMLファイル
aws s3 cp index.html s3://your-bucket/index.html --content-type "text/html"

# JavaScriptファイル
aws s3 cp script.js s3://your-bucket/script.js --content-type "application/javascript"

# CSSファイル
aws s3 cp style.css s3://your-bucket/style.css --content-type "text/css"
```

**ポイント:**
- ファイル更新後は必ずCloudFrontキャッシュを無効化
- 適切なContent-Typeを指定してアップロード
- キャッシュ無効化の完了を待ってからテスト

---

## 9. 環境別設定管理

### 開発・本番環境の分離

```javascript
// 環境判定
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

// 環境別WOFF ID
const WOFF_CONFIG = {
    development: {
        woffId: 'dev-woff-id',
        apiEndpoint: 'https://dev-api.example.com'
    },
    production: {
        woffId: 'prod-woff-id',
        apiEndpoint: 'https://api.example.com'
    }
};

const config = isDevelopment ? WOFF_CONFIG.development : WOFF_CONFIG.production;
const WOFF_ID = config.woffId;
const API_ENDPOINT = config.apiEndpoint;
```

### 開発環境でのモックデータ

```javascript
// デバッグ用：開発環境での動作確認
if (isDevelopment) {
    console.log('=== 開発環境での実行 ===');
    
    // モックデータでテスト
    setTimeout(() => {
        document.getElementById('applicant').value = 'テストユーザー';
        document.getElementById('department').value = '開発部';
        document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('endDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('leaveType').value = '全日';
        document.querySelector('input[value="私用"]').checked = true;
        document.getElementById('detailReason').value = 'テスト申請です';
        document.getElementById('emergencyContact').value = '090-1234-5678';
    }, 1000);
}
```

---

## 10. よくあるエラーパターンと対処法

| エラーメッセージ | 原因 | 対処法 |
|------------------|------|--------|
| `woff is not defined` | SDK読み込み失敗 | script tagの順序確認、SDK URLの確認 |
| `Invalid parameter included` | 初期化パラメータ誤り | woffIdのみ渡す、オブジェクト構造確認 |
| 無限リダイレクト | `woff.login()`呼び出し | ログイン処理をコメントアウト |
| `Cannot find module` | ES6モジュール使用 | 直接SDK呼び出しに変更 |
| `The requested module does not provide an export` | モジュールエクスポート名誤り | エクスポート名の大文字小文字確認 |
| 申請データ取得失敗 | 認証トークン不足 | アクセストークンを適切に付与 |
| `Cannot read properties of undefined` | DOM要素が見つからない | 要素IDの確認、DOM読み込み完了待ち |

### エラー発生時のチェックリスト

1. **WOFF SDK読み込み確認**
   - [ ] script tagが正しく配置されているか
   - [ ] SDKのバージョンが正しいか
   - [ ] 他のスクリプトより前に読み込まれているか

2. **初期化パラメータ確認**
   - [ ] woffIdが文字列で渡されているか
   - [ ] 余計なオブジェクト階層がないか
   - [ ] WOFF IDが正しいか

3. **認証関連確認**
   - [ ] アクセストークンが取得できているか
   - [ ] APIリクエストにAuthorizationヘッダーが付与されているか
   - [ ] ログイン処理が適切か

4. **環境設定確認**
   - [ ] Developer Consoleの設定が正しいか
   - [ ] Endpoint URLが正しいか
   - [ ] Default URLが意図したページか

---

## 11. 推奨実装パターン

### シンプルで確実な初期化

```javascript
// WOFF SDK設定
const WOFF_ID = 'your-woff-id';
const API_ENDPOINT = 'your-api-endpoint';

// グローバル変数
let isWoffInitialized = false;
let currentUser = null;

// DOM読み込み完了時の処理
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// アプリケーション初期化
async function initializeApp() {
    try {
        showLoading('WOFF SDKを初期化しています...');
        console.log('WOFF SDK初期化開始...');
        
        // 1. WOFF SDK初期化
        await woff.init({
            woffId: WOFF_ID
        });
        
        isWoffInitialized = true;
        console.log('WOFF SDK初期化完了');
        
        // 2. ユーザー情報取得
        await loadUserProfile();
        
        // 3. 外部ブラウザ対応
        if (!woff.isInClient() && !woff.isLoggedIn()) {
            console.log('外部ブラウザでの動作');
            // 必要に応じてログイン処理
        }
        
        // 4. 環境情報表示（デバッグ用）
        displayEnvironmentInfo();
        
        // 5. イベントリスナー設定
        setupEventListeners();
        
        // 6. データ読み込み
        await loadData();
        
        hideLoading();
        
    } catch (error) {
        console.error('WOFF SDK初期化エラー:', error);
        showErrorMessage('アプリケーションの初期化に失敗しました: ' + error.message);
        hideLoading();
    }
}

// ユーザープロフィール読み込み
async function loadUserProfile() {
    try {
        if (woff.isInClient() || woff.isLoggedIn()) {
            const profile = await woff.getProfile();
            currentUser = profile;
            console.log('ユーザー情報取得完了:', profile);
            
            // デバッグ情報をタイトルに表示
            document.title = `${document.title} - ${profile.displayName}`;
        }
    } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
        document.title = `${document.title} - ゲストユーザー`;
    }
}

// アクセストークン取得
async function getAccessToken() {
    try {
        if (isWoffInitialized && (woff.isInClient() || woff.isLoggedIn())) {
            return await woff.getAccessToken();
        }
        return null;
    } catch (error) {
        console.warn('アクセストークン取得警告:', error);
        return null;
    }
}
```

### エラーハンドリングのベストプラクティス

```javascript
// グローバルエラーハンドリング
window.addEventListener('error', function(event) {
    console.error('グローバルエラー:', event.error);
    showErrorMessage('予期しないエラーが発生しました。ページを再読み込みしてください。');
});

// Promise拒否のハンドリング
window.addEventListener('unhandledrejection', function(event) {
    console.error('未処理のPromise拒否:', event.reason);
    showErrorMessage('処理中にエラーが発生しました。');
});

// UI状態管理関数
function showLoading(message) {
    const loader = document.createElement('div');
    loader.id = 'global-loading';
    loader.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 20px 40px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 15px;
    `;
    loader.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <span>${message}</span>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('global-loading');
    if (loader) {
        loader.remove();
    }
}

function showErrorMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => {
        alert.remove();
    }, 8000);
}
```

---

## まとめ

WOFF アプリケーションの開発では、以下の点が特に重要です：

1. **シンプルな実装:** 複雑なラッパークラスを避け、直接SDKを使用
2. **適切な初期化:** woffIdのみを渡し、段階的に初期化
3. **エラーハンドリング:** モバイル環境を考慮したデバッグ手法
4. **認証処理:** アクセストークンの適切な管理
5. **キャッシュ対策:** 更新時の確実なキャッシュ無効化

これらの留意事項を押さえることで、WOFF アプリケーションの開発時のトラブルを大幅に減らし、安定したアプリケーションを構築できます。

---

*このドキュメントは2025年7月20日に作成されました。WOFF SDKのバージョンアップに伴い、内容が変更される可能性があります。*