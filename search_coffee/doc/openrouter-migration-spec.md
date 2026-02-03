# OpenRouter移行 設計書

## 概要

Gemini API直接呼び出しをやめ、OpenRouter経由でAIモデルを利用するように変更する。
目的はAPI制限（現在5 RPM）の緩和。

---

## OpenRouterとは

複数のAIプロバイダー（Google, OpenAI, Meta等）のAPIを**1つの統一インターフェースで中継するサービス**。

```
現在:  サイト → Gemini API（Google直接）
変更後: サイト → OpenRouter → Gemini API（中継）
```

- OpenAI互換のAPIフォーマットを採用（業界標準）
- モデルは `model` パラメータで指定するだけで切り替え可能
- 認証は `Authorization: Bearer <APIキー>` ヘッダー

---

## 使用モデル

**`google/gemini-2.0-flash-exp:free`**（無料）

選定理由:
- 完全無料（課金不要）
- 日本語の自然さがGemini系で安定している
- Flash系で応答が高速

制限事項:
- 50リクエスト/日（$10以上チャージすると1,000/日に緩和）
- 20 RPM（現在の5 RPMより大幅に緩和）
- 実験版のため予告なく利用不可になるリスクがある
- データトレーニングへのオプトインが必要

設計上、モデルIDは環境変数化し、将来の切り替えに備える。

---

## 実装ステップ

```
ステップ1: バックエンド書き換え（api/gemini.js）
ステップ2: フロントエンド書き換え（index.html）
ステップ3: 環境変数・設定ファイル更新
ステップ4: Vercel環境変数の設定
```

---

## ステップ1: バックエンド書き換え

### 対象ファイル: `api/gemini.js`

現在のコードはGemini APIを直接呼んでいる。
これをOpenRouter APIを呼ぶように全面書き換える。

### 変更前（現在）

```javascript
export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  // ...
}
```

### 変更後

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured' });
  }

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  try {
    const body = req.body;
    // モデル未指定の場合はデフォルトを使用
    if (!body.model) {
      body.model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers.referer || req.headers.origin || '',
        'X-Title': 'Coffee Bean Guide'
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const retryAfter = response.headers.get('retry-after');
      if (retryAfter) {
        res.setHeader('Retry-After', retryAfter);
      }
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to call OpenRouter API' });
  }
}
```

### 変更ポイント

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| エンドポイント | `generativelanguage.googleapis.com/...` | `openrouter.ai/api/v1/chat/completions` |
| 認証 | URLクエリ `?key=xxx` | ヘッダー `Authorization: Bearer xxx` |
| 環境変数 | `GEMINI_API_KEY` | `OPENROUTER_API_KEY` |
| モデル指定 | URLに含む | リクエストボディの `model` フィールド |
| 追加ヘッダー | なし | `HTTP-Referer`, `X-Title` |

---

## ステップ2: フロントエンド書き換え

### 対象ファイル: `index.html`

Gemini独自形式 → OpenAI互換形式にフォーマットを変更する。

### 2-1. SYSTEM_INSTRUCTION の形式変更

**変更前:**
```javascript
const SYSTEM_INSTRUCTION = {
  parts: [{
    text: `あなたは「コーヒー豆くん」です。...`
  }]
};
```

**変更後:**
```javascript
const SYSTEM_PROMPT = `あなたは「コーヒー豆くん」です。...`;
```

Gemini形式では `{ parts: [{ text }] }` というオブジェクトだったが、
OpenAI形式では単なる文字列として保持し、messagesの先頭に `{ role: "system" }` として渡す。

### 2-2. chatHistory の形式変更

**変更前（Gemini形式）:**
```javascript
chatHistory.push({ role: 'user', parts: [{ text: message }] });
chatHistory.push({ role: 'model', parts: [{ text: rawResponse }] });
```

**変更後（OpenAI形式）:**
```javascript
chatHistory.push({ role: 'user', content: message });
chatHistory.push({ role: 'assistant', content: rawResponse });
```

- `parts: [{ text }]` → `content` （直接文字列）
- ロール名 `model` → `assistant`

### 2-3. APIリクエストの形式変更

**変更前:**
```javascript
const data = await scheduleGeminiTask(() => postGeminiWithRetry({
  contents: chatHistory,
  systemInstruction: SYSTEM_INSTRUCTION
}));
```

**変更後:**
```javascript
const data = await scheduleAPITask(() => postAPIWithRetry({
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    ...chatHistory
  ]
}));
```

- `contents` → `messages`
- `systemInstruction` → messagesの先頭に `{ role: 'system' }` として挿入

### 2-4. レスポンスの読み取り変更

**変更前:**
```javascript
data.candidates?.[0]?.content?.parts?.[0]?.text
```

**変更後:**
```javascript
data.choices?.[0]?.message?.content
```

### 2-5. 豆知識取得（fetchTrivia）の形式変更

**変更前:**
```javascript
const data = await scheduleGeminiTask(() => postGeminiWithRetry({
  contents: [{
    role: 'user',
    parts: [{ text: 'コーヒーに関する豆知識を...' }]
  }]
}));
const triviaResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
```

**変更後:**
```javascript
const data = await scheduleAPITask(() => postAPIWithRetry({
  messages: [
    { role: 'user', content: 'コーヒーに関する豆知識を...' }
  ]
}));
const triviaResponse = data.choices?.[0]?.message?.content;
```

### 2-6. レート制限パラメータの緩和

OpenRouterの無料枠は20 RPMのため、最小間隔を大幅に短縮できる。

**変更前:**
```javascript
const GEMINI_RPM_LIMIT = 5;
const GEMINI_MIN_INTERVAL_MS = Math.ceil(60_000 / GEMINI_RPM_LIMIT) + 500; // 12.5s
```

**変更後:**
```javascript
const API_RPM_LIMIT = 20;
const API_MIN_INTERVAL_MS = Math.ceil(60_000 / API_RPM_LIMIT) + 500; // 3.5s
```

### 2-7. 関数名・変数名のリネーム

Gemini固有の名前を汎用名に変更する。

| 変更前 | 変更後 |
|--------|--------|
| `GEMINI_RPM_LIMIT` | `API_RPM_LIMIT` |
| `GEMINI_MIN_INTERVAL_MS` | `API_MIN_INTERVAL_MS` |
| `geminiQueue` | `apiQueue` |
| `nextGeminiAllowedAt` | `nextAPIAllowedAt` |
| `scheduleGeminiTask()` | `scheduleAPITask()` |
| `postGeminiWithRetry()` | `postAPIWithRetry()` |
| `callGeminiAPI()` | `callChatAPI()` |
| `SYSTEM_INSTRUCTION` | `SYSTEM_PROMPT` |

---

## ステップ3: 環境変数・設定ファイル更新

### `.env`（ローカル開発用）

**変更前:**
```
GEMINI_API_KEY=xxxxx
```

**変更後:**
```
OPENROUTER_API_KEY=sk-or-xxxxx
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

### `config.sample.js`

このファイルはフロントエンドから直接APIキーを使うためのものだったが、
現在はバックエンド（Vercel Functions）経由でAPIを呼んでおり不要。
削除する。

---

## ステップ4: Vercel環境変数の設定

Vercelダッシュボードで以下を設定:

1. `GEMINI_API_KEY` を削除
2. `OPENROUTER_API_KEY` を追加（値: OpenRouterで発行したAPIキー）
3. `OPENROUTER_MODEL` を追加（値: `google/gemini-2.0-flash-exp:free`）

---

## フォーマット対応表（まとめ）

| 項目 | Gemini形式（変更前） | OpenAI形式（変更後） |
|------|---------------------|---------------------|
| メッセージ配列 | `contents` | `messages` |
| ユーザー発話 | `{ role: 'user', parts: [{ text }] }` | `{ role: 'user', content }` |
| AI応答 | `{ role: 'model', parts: [{ text }] }` | `{ role: 'assistant', content }` |
| システム指示 | `systemInstruction: { parts: [{ text }] }` | `messages[0]: { role: 'system', content }` |
| レスポンス取得 | `candidates[0].content.parts[0].text` | `choices[0].message.content` |
| モデル指定 | エンドポイントURLに含む | `body.model` |
| 認証 | `?key=API_KEY` | `Authorization: Bearer API_KEY` |

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `api/gemini.js` | 全面書き換え（OpenRouter API呼び出し） |
| `index.html` | リクエスト/レスポンス形式変更、変数リネーム、レート制限緩和 |
| `.env` | 環境変数名変更 |
| `config.sample.js` | 削除 |
