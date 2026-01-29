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
└── coffee-bean-kun-area（新規）
    ├── trivia-display      ... 豆知識表示エリア
    └── chat-button         ... 「会話する」ボタン

body末尾
└── chat-modal（新規）
    ├── modal-header        ... タイトル＋閉じるボタン
    ├── chat-messages       ... メッセージ表示エリア（スクロール可）
    └── chat-input-area     ... 入力欄＋送信ボタン
```

### CSSの方針

- 既存の変数（`--accent`, `--bg` 等）を使用
- チャットモーダルは `position: fixed` で右からスライド
- 既存の検索モーダル（`.modal-overlay`）を参考にする

---

## ステップ2: UIを動かす

### 機能一覧

| 機能 | トリガー | 動作 |
|------|----------|------|
| モーダルを開く | 会話ボタンをクリック | モーダルを表示（右からスライドイン） |
| モーダルを閉じる | 閉じるボタン or オーバーレイクリック | モーダルを非表示 |
| メッセージ送信 | 送信ボタン or Enterキー | 入力内容を画面に表示 |

### 状態管理

```javascript
// モーダルの開閉状態
let isChatOpen = false;

// 会話履歴（配列）
let chatHistory = [];
```

---

## ステップ3: AIを繋げる

### データフロー

```
1. ユーザー入力
   └─→ 入力欄から文字列を取得

2. 履歴に追加
   └─→ chatHistory.push({ role: "user", parts: [...] })

3. リクエスト作成
   └─→ { contents: chatHistory, systemInstruction: {...} }

4. API送信
   └─→ fetch() で Gemini API に POST

5. レスポンス解析
   └─→ data.candidates[0].content.parts[0].text を取得

6. 履歴に追加
   └─→ chatHistory.push({ role: "model", parts: [...] })

7. 画面に表示
   └─→ チャットエリアにメッセージを追加
```

### APIリクエスト形式

```javascript
{
  "contents": [
    { "role": "user", "parts": [{ "text": "ユーザーの発言" }] },
    { "role": "model", "parts": [{ "text": "AIの返答" }] },
    // ... 履歴が続く
  ],
  "systemInstruction": {
    "parts": [{
      "text": "あなたは「コーヒー豆くん」です。一人称は「コーヒー豆くん」、語尾は「〜なのだ」で話してください。コーヒーに関する質問に答えたり、おすすめの豆を紹介してください。ユーザーが英語で話しかけたら英語で返答してください。"
    }]
  }
}
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

### ファイル構成

```
search_coffee/
├── index.html
├── styles.css
├── config.js        ← APIキーを記載（Git管理外）
├── config.sample.js ← サンプル（Git管理対象）
└── doc/
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
  // API呼び出し
} catch (error) {
  // エラーメッセージをチャットに表示
  // 「うまく返事できなかったのだ...」のような口調で
}
```

### ユーザーへのフィードバック

```
・送信中: 「考え中なのだ...」と表示
・成功時: AIの返答を表示
・失敗時: エラーメッセージを表示（コーヒー豆くんの口調で）
```

---

## 豆知識機能

### 動作

```
1. ページ読み込み時にGemini APIを呼び出し
2. 「コーヒーに関する豆知識を1つ教えて」とリクエスト
3. 返答を豆知識エリアに表示
```

### 注意点

```
・ページ読み込み時に毎回API呼び出しが発生
・エラー時はデフォルトの豆知識を表示（ハードコード）
```

---

## ファイル構成（最終）

```
search_coffee/
├── index.html       ... 既存 + コーヒー豆くんUI追加
├── styles.css       ... 既存 + チャットモーダルのスタイル追加
├── config.js        ... APIキー（Git管理外）
├── config.sample.js ... APIキーのサンプル
└── doc/
    ├── coffee-bean-kun-spec.md      ... 要件定義
    ├── coffee-bean-kun-impl-spec.md ... 本書（実装詳細）
    └── search-modal-spec.md         ... 検索機能の仕様
```

---

## 実装チェックリスト

### ステップ1: HTML/CSS
- [ ] ヘッダーに豆知識エリアを追加
- [ ] 会話ボタンを追加
- [ ] チャットモーダルのHTMLを追加
- [ ] チャットモーダルのCSSを追加

### ステップ2: UI動作
- [ ] モーダル開閉の実装
- [ ] メッセージ入力・表示の実装
- [ ] 送信ボタンの動作（API未接続）

### ステップ3: API連携
- [ ] config.js の作成
- [ ] .gitignore への追加
- [ ] API送信関数の実装
- [ ] 履歴管理の実装
- [ ] エラーハンドリングの実装
- [ ] 豆知識自動取得の実装
