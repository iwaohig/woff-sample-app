// WOFF SDK設定
const WOFF_ID = '0O28XJpjf0AcsU7wXpLE3w';

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
        console.log('WOFF SDK初期化開始...');
        updateInitStatus('loading', 'WOFF SDKを初期化しています...');
        
        // WOFF SDKがロードされるまで待機
        await waitForWoffSDK();
        
        // 1. WOFF SDK初期化
        await woff.init({
            woffId: WOFF_ID
        });
        
        isWoffInitialized = true;
        console.log('WOFF SDK初期化完了');
        
        // 2. ユーザー情報取得
        await loadUserProfile();
        
        // 3. 初期化完了表示
        updateInitStatus('success', '✅ WOFF SDK初期化完了');
        showUserInfo();
        
        // 4. デバッグ情報表示
        showDebugInfo();
        
        console.log('アプリケーション初期化完了');
        
    } catch (error) {
        console.error('WOFF SDK初期化エラー:', error);
        updateInitStatus('error', `❌ 初期化エラー: ${error.message}`);
        showError(error.message);
    }
}

// WOFF SDKがロードされるまで待機
async function waitForWoffSDK() {
    return new Promise((resolve, reject) => {
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
            reject(new Error('WOFF SDKの読み込みがタイムアウトしました'));
        }, 10000);
    });
}

// ユーザープロフィール読み込み
async function loadUserProfile() {
    try {
        if (woff.isInClient() || woff.isLoggedIn()) {
            const profile = await woff.getProfile();
            currentUser = profile;
            console.log('ユーザー情報取得完了:', profile);
            
            // デバッグ情報をタイトルに表示
            document.title = `WOFF Sample - ${profile.displayName}`;
        } else {
            console.log('外部ブラウザでの動作 - ユーザー情報は取得されません');
            currentUser = { displayName: 'ゲストユーザー' };
            document.title = 'WOFF Sample - ゲストユーザー';
        }
    } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
        currentUser = { displayName: 'エラー' };
        document.title = 'WOFF Sample - エラー';
    }
}

// 初期化状態更新
function updateInitStatus(type, message) {
    const statusEl = document.getElementById('initStatus');
    
    // クラスをリセット
    statusEl.className = 'init-status';
    
    if (type === 'loading') {
        statusEl.classList.add('init-loading');
        statusEl.innerHTML = `
            <div class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            ${message}
        `;
    } else if (type === 'success') {
        statusEl.classList.add('init-success');
        statusEl.innerHTML = message;
    } else if (type === 'error') {
        statusEl.classList.add('init-error');
        statusEl.innerHTML = message;
    }
}

// ユーザー情報表示
function showUserInfo() {
    const userInfoEl = document.getElementById('userInfo');
    const displayNameEl = document.getElementById('displayName');
    const isInClientEl = document.getElementById('isInClient');
    const isLoggedInEl = document.getElementById('isLoggedIn');
    const woffIdEl = document.getElementById('woffId');
    
    if (currentUser) {
        displayNameEl.textContent = currentUser.displayName || '-';
    }
    
    if (typeof woff !== 'undefined') {
        isInClientEl.textContent = woff.isInClient() ? 'はい' : 'いいえ';
        isLoggedInEl.textContent = woff.isLoggedIn() ? 'はい' : 'いいえ';
    }
    
    woffIdEl.textContent = WOFF_ID;
    
    userInfoEl.style.display = 'block';
}

// エラー情報表示
function showError(message) {
    const errorInfoEl = document.getElementById('errorInfo');
    const errorMessageEl = document.getElementById('errorMessage');
    
    errorMessageEl.textContent = message;
    errorInfoEl.style.display = 'block';
}

// デバッグ情報表示
function showDebugInfo() {
    const debugInfoEl = document.getElementById('debugInfo');
    const currentUrlEl = document.getElementById('currentUrl');
    const userAgentEl = document.getElementById('userAgent');
    
    currentUrlEl.textContent = window.location.href;
    userAgentEl.textContent = navigator.userAgent;
    
    debugInfoEl.style.display = 'block';
}

// グローバルエラーハンドリング
window.addEventListener('error', function(event) {
    console.error('グローバルエラー:', event.error);
    showError('予期しないエラーが発生しました。ページを再読み込みしてください。');
});

// Promise拒否のハンドリング
window.addEventListener('unhandledrejection', function(event) {
    console.error('未処理のPromise拒否:', event.reason);
    showError('処理中にエラーが発生しました。');
});