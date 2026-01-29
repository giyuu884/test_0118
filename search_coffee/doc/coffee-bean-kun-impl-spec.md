# コーヒー豆くん 実装詳細設計書

## 概要

本書は `coffee-bean-kun-spec.md`（要件定義）に基づき、
「どう実装するか」を具体化した詳細設計書である。

---

## 実装ステップ

```
ステップ1: 見た目を作る（HTML/CSS）
ステップ2: UIを動かす（JavaScript）
ステップ3: AIを繋げる（API連携）
```

---

## ステップ1: 見た目を作る

### 追加するHTML要素

```
site-header
└── .container
    ├── .eyebrow
    ├── h1
    ├── .lead
    ├── .note
    ├── .search-cta（既存の検索ボタン）
    └── .coffee-bean-kun-area（新規）★ここに追加
        ├── .trivia-display      ... 豆知識表示エリア
        └── .chat-button         ... 「会話する」ボタン

body末尾（</body>の直前）
└── .chat-modal-overlay（新規）
    └── .chat-modal
        ├── .chat-modal-header   ... タイトル＋閉じるボタン
        ├── .chat-messages       ... メッセージ表示エリア（スクロール可）
        └── .chat-input-area     ... 入力欄＋送信ボタン
```

### HTML追加箇所（差分イメージ）

```html
<!-- site-header内、.search-ctaの直後に追加 -->
<div class="coffee-bean-kun-area">
  <p class="trivia-display">
    <span class="trivia-label">☕ 今日の豆知識:</span>
    <span class="trivia-text" id="triviaText">読み込み中...</span>
  </p>
  <button class="chat-button" id="openChatModal">
    コーヒー豆くんと会話する
  </button>
</div>

<!-- body末尾、既存スクリプトの前に追加 -->
<div class="chat-modal-overlay" id="chatModal">
  <div class="chat-modal">
    <div class="chat-modal-header">
      <h2>コーヒー豆くんとチャット</h2>
      <button class="chat-modal-close" id="closeChatModal" aria-label="閉じる">&times;</button>
    </div>
    <div class="chat-messages" id="chatMessages">
      <!-- メッセージがここに追加される -->
    </div>
    <div class="chat-input-area">
      <input type="text" class="chat-input" id="chatInput" placeholder="メッセージを入力..." />
      <button class="chat-send-btn" id="chatSendBtn">送信</button>
    </div>
  </div>
</div>
```

### CSSの方針

- 既存の変数（`--accent`, `--bg`, `--surface`, `--line` 等）を使用
- チャットモーダルは `position: fixed` + `right: 0` で右側に固定配置
- 開閉アニメーションは `translateX(100%)` → `translateX(0)` で右からスライド

### CSS追加（主要部分）

```css
/* コーヒー豆くんエリア */
.coffee-bean-kun-area {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.trivia-display {
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  font-size: 14px;
  max-width: 100%;
}

.trivia-label {
  font-weight: 600;
  color: var(--accent);
}

.chat-button {
  padding: 12px 24px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.chat-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(181, 124, 77, 0.3);
}

/* チャットモーダル（右からスライド） */
.chat-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.chat-modal-overlay.is-active {
  opacity: 1;
  visibility: visible;
}

.chat-modal {
  position: fixed;
  top: 0;
  right: 0;
  width: min(400px, 100%);
  height: 100%;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.chat-modal-overlay.is-active .chat-modal {
  transform: translateX(0);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* メッセージの見た目 */
.chat-message {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.chat-message.user {
  align-self: flex-end;
  background: var(--accent);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-message.assistant {
  align-self: flex-start;
  background: var(--accent-soft);
  color: var(--text);
  border-bottom-left-radius: 4px;
}

.chat-message.loading {
  font-style: italic;
  color: var(--muted);
}
```

---

## ステップ2: UIを動かす

### 機能一覧

| 機能 | トリガー | 動作 |
|------|----------|------|
| モーダルを開く | 会話ボタンをクリック | モーダルを表示（右からスライドイン） |
| モーダルを閉じる | 閉じるボタン or オーバーレイクリック or ESCキー | モーダルを非表示 |
| メッセージ送信 | 送信ボタン or Enterキー | 入力内容を画面に表示 |

### 状態管理

```javascript
// モーダルの開閉状態
let isChatOpen = false;

// 会話履歴（配列）
let chatHistory = [];

// 送信中フラグ（重複送信防止）
let isSending = false;
```

### 入力バリデーション

```javascript
// 空文字・空白のみの場合は送信しない
const message = chatInput.value.trim();
if (!message) return;
```

### 送信中の状態管理

```javascript
// 送信開始時
isSending = true;
chatSendBtn.disabled = true;
chatInput.disabled = true;

// 送信完了時（成功・失敗問わず）
isSending = false;
chatSendBtn.disabled = false;
chatInput.disabled = false;
chatInput.focus();
```

### 自動スクロール

```javascript
// 新メッセージ追加後に最下部へスクロール
chatMessages.scrollTop = chatMessages.scrollHeight;
```

### ステップ2でのモック動作（API未接続時）

```javascript
// ユーザーメッセージを表示後、固定のモック応答を返す
function mockResponse() {
  return "API連携はまだなのだ...ステップ3で実装するのだ！";
}
```

---

## ステップ3: AIを繋げる

### Gemini API 詳細

| 項目 | 値 |
|------|------|
| エンドポイント | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` |
| モデル | `gemini-2.0-flash`（高速・無料枠が大きい） |
| 認証 | URLパラメータ `?key=YOUR_API_KEY` |

### データフロー

```
1. ユーザー入力
   └─→ 入力欄から文字列を取得（トリム済み）

2. バリデーション
   └─→ 空文字チェック、送信中チェック

3. UI更新
   └─→ ユーザーメッセージを表示、「考え中なのだ...」表示

4. 履歴に追加
   └─→ chatHistory.push({ role: "user", parts: [...] })

5. リクエスト作成
   └─→ { contents: chatHistory, systemInstruction: {...} }

6. API送信
   └─→ fetch() で Gemini API に POST

7. レスポンス解析
   └─→ data.candidates[0].content.parts[0].text を取得

8. 履歴に追加
   └─→ chatHistory.push({ role: "model", parts: [...] })

9. 画面に表示
   └─→ 「考え中」を削除し、AIの返答を追加
   └─→ 自動スクロール
```

### APIリクエスト形式

```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: chatHistory,
      systemInstruction: {
        parts: [{
          text: "あなたは「コーヒー豆くん」です。一人称は「コーヒー豆くん」、語尾は「〜なのだ」で話してください。コーヒーに関する質問に答えたり、おすすめの豆を紹介してください。ユーザーが英語で話しかけたら英語で返答してください。"
        }]
      }
    })
  }
);
```

### APIレスポンス形式

```javascript
{
  "candidates": [{
    "content": {
      "role": "model",
      "parts": [{ "text": "AIの返答テキスト" }]
    }
  }]
}
```

---

## 履歴管理

### 保存場所

| 方式 | 採用 | 理由 |
|------|------|------|
| JavaScriptの配列 | ○ | シンプル、要件（リロードで消える）に合致 |
| localStorage | × | 今回は不要（将来の拡張で検討） |
| サーバーDB | × | フロントエンドのみの構成 |

### 仕組み

```
・Gemini APIはステートレス（何も記憶しない）
・文脈を理解させるには、毎回すべての履歴を送信する
・履歴はページ内の配列に保持、リロードでリセット
```

---

## APIキー管理

### 方針

```
・HTMLやメインJSに直接書かない
・別ファイル（config.js）に分離
・config.js は .gitignore に追加してGit管理外とする
```

### セキュリティに関する注意

```
※ 本サイトは学習用のため、APIキーがクライアント側に存在することを許容する。
   本番環境では、サーバーサイドでAPIキーを管理し、
   バックエンドを経由してAPIを呼び出す構成を推奨。
```

### ファイル構成

```
search_coffee/
├── index.html
├── styles.css
├── config.js        ← APIキーを記載（Git管理外）
├── config.sample.js ← サンプル（Git管理対象）
└── doc/
```

### config.js の読み込み

```html
<!-- body末尾、メインスクリプトの前に配置 -->
<script src="config.js"></script>
<script>
  // メインスクリプト（既存 + コーヒー豆くん機能）
</script>
```

### config.js の内容

```javascript
const GEMINI_API_KEY = "ここにAPIキーを記載";
```

### config.sample.js の内容

```javascript
const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
```

---

## エラーハンドリング

### 想定されるエラー

| 種類 | HTTPステータス | 対応 |
|------|----------------|------|
| 認証エラー | 401 | 「設定を確認してください」と表示 |
| レート制限 | 429 | 「少し待ってから再試行」と表示 |
| サーバーエラー | 5xx | 「しばらく待って再試行」と表示 |
| ネットワークエラー | - | 「接続を確認してください」と表示 |

### 実装方針

```javascript
try {
  const response = await fetch(...);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  // 正常処理
} catch (error) {
  // エラーメッセージをチャットに表示
  addMessage('assistant', 'うまく返事できなかったのだ...もう一度試してほしいのだ。');
} finally {
  // 送信状態をリセット
  isSending = false;
  chatSendBtn.disabled = false;
  chatInput.disabled = false;
}
```

### ユーザーへのフィードバック

```
・送信中: 「考え中なのだ...」と表示（loadingクラス付き）
・成功時: AIの返答を表示
・失敗時: エラーメッセージを表示（コーヒー豆くんの口調で）
```

---

## 豆知識機能

### 動作

```
1. DOMContentLoaded イベント発火時にGemini APIを呼び出し
2. 「コーヒーに関する豆知識を1つ、50文字以内で教えて」とリクエスト
3. 返答を豆知識エリアに表示
```

### 豆知識取得用プロンプト

```javascript
const triviaPrompt = {
  contents: [{
    role: "user",
    parts: [{ text: "コーヒーに関する豆知識を1つ、50文字以内で「〜なのだ」口調で教えて。" }]
  }]
};
```

### デフォルト豆知識（API失敗時）

```javascript
const DEFAULT_TRIVIA = "コーヒーの木は赤道付近の「コーヒーベルト」と呼ばれる地域で栽培されているのだ！";
```

### 注意点

```
・ページ読み込み時に毎回API呼び出しが発生（無料枠に注意）
・エラー時はデフォルトの豆知識を表示
・豆知識取得中は「読み込み中...」を表示
```

---

## ファイル構成（最終）

```
search_coffee/
├── index.html       ... 既存 + コーヒー豆くんUI追加
├── styles.css       ... 既存 + チャットモーダルのスタイル追加
├── config.js        ... APIキー（Git管理外）
├── config.sample.js ... APIキーのサンプル
├── .gitignore       ... config.js を追加
└── doc/
    ├── coffee-bean-kun-spec.md      ... 要件定義
    ├── coffee-bean-kun-impl-spec.md ... 本書（実装詳細）
    └── search-modal-spec.md         ... 検索機能の仕様
```

---

## 実装チェックリスト

### ステップ1: HTML/CSS
- [ ] ヘッダーに豆知識エリアを追加（.search-ctaの下）
- [ ] 会話ボタンを追加
- [ ] チャットモーダルのHTMLを追加（body末尾）
- [ ] チャットモーダルのCSS追加（右からスライド）
- [ ] メッセージのスタイル追加（ユーザー: 右寄せ/アクセント色、AI: 左寄せ/ソフト色）

### ステップ2: UI動作
- [ ] モーダル開閉の実装（オーバーレイクリック、ESCキー対応）
- [ ] メッセージ入力・表示の実装
- [ ] 入力バリデーション（空文字チェック）
- [ ] 送信中の状態管理（ボタン・入力欄の無効化）
- [ ] 自動スクロールの実装
- [ ] モック応答の実装（API未接続時用）

### ステップ3: API連携
- [ ] config.js の作成
- [ ] config.sample.js の作成
- [ ] .gitignore への config.js 追加
- [ ] API送信関数の実装（gemini-2.0-flash）
- [ ] 履歴管理の実装
- [ ] エラーハンドリングの実装
- [ ] 豆知識自動取得の実装（DOMContentLoaded）
- [ ] デフォルト豆知識のフォールバック
