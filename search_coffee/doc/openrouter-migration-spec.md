# OpenRouter移行 設計書

## 概要

Gemini API直接呼び出しをやめ、OpenRouter経由でAIモデルを利用するように変更する。

**目的:** API制限の緩和（Gemini直接: 5 RPM → OpenRouter経由: 20 RPM）

**方針:**
- 段階的に実装し、各ステップ完了後に動作確認する
- 動くことを最優先にする（リネームより動作を先に）

```
現在:  フロントエンド → /api/gemini → Gemini API（Google直接）
変更後: フロントエンド → /api/gemini → OpenRouter API → Gemini（中継）
```

> **注意:** APIルートのパス `/api/gemini` はリネームしない。
> Vercelのルーティングはファイル名に依存するため、ファイル名変更はリスクが高い。
> 中身だけOpenRouter呼び出しに差し替える。

---

## 使用モデル

**`google/gemini-2.0-flash-exp:free`**（無料枠）

| 項目 | 値 |
|------|-----|
| 料金 | 無料（$0） |
| RPM | 20（現在の4倍） |
| 日次上限 | 50リクエスト/日（$10チャージで1,000/日に緩和） |
| 応答速度 | Flash系で高速 |
| リスク | 実験版のため予告なく停止の可能性 |

モデルIDは環境変数 `OPENROUTER_MODEL` で管理し、将来の切り替えに備える。

---

## フォーマット対応表

OpenRouterはOpenAI互換フォーマットを使用する。Gemini形式との対応を以下に示す。

| 項目 | Gemini形式（現在） | OpenAI形式（変更後） |
|------|---------------------|---------------------|
| メッセージ配列キー | `contents` | `messages` |
| ユーザー発話 | `{ role: 'user', parts: [{ text: '...' }] }` | `{ role: 'user', content: '...' }` |
| AI応答 | `{ role: 'model', parts: [{ text: '...' }] }` | `{ role: 'assistant', content: '...' }` |
| システム指示 | `systemInstruction: { parts: [{ text: '...' }] }` | `messages[0]: { role: 'system', content: '...' }` |
| レスポンス取得 | `candidates[0].content.parts[0].text` | `choices[0].message.content` |
| モデル指定 | エンドポイントURLに含む | リクエストボディの `model` フィールド |
| 認証 | URLクエリパラメータ `?key=xxx` | ヘッダー `Authorization: Bearer xxx` |

---

## 実装ステップ（全4ステップ）

```
ステップ1: バックエンド書き換え（api/gemini.js）     ← まずここだけ変える
ステップ2: フロントエンド書き換え（index.html）       ← APIフォーマット変更
ステップ3: レート制限の緩和と変数リネーム（index.html）← 動作確認後に整理
ステップ4: 不要ファイル削除と環境変数の整理           ← 最後にクリーンアップ
```

各ステップ完了後に必ず動作確認を行い、壊れていないことを確認してから次に進む。

---

## ステップ1: バックエンド書き換え

### 対象ファイル

`api/gemini.js`（全37行を全面書き換え）

### 変更内容

ファイル全体を以下の内容に置き換える:

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

### 変更ポイント（差分）

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| 環境変数 | `process.env.GEMINI_API_KEY` | `process.env.OPENROUTER_API_KEY` |
| エンドポイント | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` | `https://openrouter.ai/api/v1/chat/completions` |
| 認証方式 | URLクエリ `?key=${apiKey}` | ヘッダー `Authorization: Bearer ${apiKey}` |
| 追加ヘッダー | なし | `HTTP-Referer`, `X-Title`（OpenRouter推奨） |
| モデル指定 | URLに含まれていた | `body.model` で指定（デフォルト: 環境変数から取得） |
| エラーメッセージ | `'Failed to call Gemini API'` | `'Failed to call OpenRouter API'` |

### このステップの検証

**このステップ単体ではフロントエンドはまだ動かない**（リクエスト形式が不一致のため）。
検証はステップ2と合わせて行う。

---

## ステップ2: フロントエンド書き換え

### 対象ファイル

`index.html` のJavaScript部分（`<script>` タグ内のチャット機能IIFE）

### 変更箇所一覧

| # | 変更内容 | 現在の場所（目安） |
|---|----------|-------------------|
| 2-1 | `SYSTEM_INSTRUCTION` → `SYSTEM_PROMPT`（形式変更） | `const SYSTEM_INSTRUCTION = {` の定義部分 |
| 2-2 | `chatHistory` のpush形式（2箇所） | `chatHistory.push(` の各箇所 |
| 2-3 | `callGeminiAPI()` のリクエスト形式 | `async function callGeminiAPI()` |
| 2-4 | `fetchTrivia()` のリクエスト・レスポンス形式 | `async function fetchTrivia()` |

---

### 2-1. SYSTEM_INSTRUCTION → SYSTEM_PROMPT

**変更前:**
```javascript
const SYSTEM_INSTRUCTION = {
  parts: [{
    text: `あなたは「コーヒー豆くん」です。
...（プロンプト本文）...`
  }]
};
```

**変更後:**
```javascript
const SYSTEM_PROMPT = `あなたは「コーヒー豆くん」です。
...（プロンプト本文はそのまま維持）...`;
```

プロンプトの中身（テキスト内容）は一切変更しない。外側の `{ parts: [{ text: ... }] }` ラッパーを外して、単なる文字列にする。

具体的には:
1. `const SYSTEM_INSTRUCTION = {` → `const SYSTEM_PROMPT = \``
2. `parts: [{` と `text: \`` の2行を削除
3. 末尾の `}]` と `};` を `` `; `` に変更

---

### 2-2. chatHistory のpush形式（2箇所）

**箇所A: ユーザーメッセージ追加（sendMessage関数内）**

変更前:
```javascript
chatHistory.push({ role: 'user', parts: [{ text: message }] });
```
変更後:
```javascript
chatHistory.push({ role: 'user', content: message });
```

**箇所B: AI応答追加（sendMessage関数内）**

変更前:
```javascript
chatHistory.push({ role: 'model', parts: [{ text: rawResponse }] });
```
変更後:
```javascript
chatHistory.push({ role: 'assistant', content: rawResponse });
```

変更点:
- `parts: [{ text: ... }]` → `content: ...`（直接文字列）
- ロール名 `'model'` → `'assistant'`

---

### 2-3. callGeminiAPI のリクエスト・レスポンス形式

**変更前:**
```javascript
async function callGeminiAPI() {
  const data = await scheduleGeminiTask(() => postGeminiWithRetry({
    contents: chatHistory,
    systemInstruction: SYSTEM_INSTRUCTION
  }, { maxRetries: 3 }));
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'うまく返事できなかったのだ...';
}
```

**変更後:**
```javascript
async function callGeminiAPI() {
  const data = await scheduleGeminiTask(() => postGeminiWithRetry({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chatHistory
    ]
  }, { maxRetries: 3 }));
  return data.choices?.[0]?.message?.content || 'うまく返事できなかったのだ...';
}
```

変更点:
- `contents: chatHistory` → `messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...chatHistory]`
- `systemInstruction: SYSTEM_INSTRUCTION` → 削除（messagesの先頭にsystemロールとして統合）
- レスポンス: `data.candidates?.[0]?.content?.parts?.[0]?.text` → `data.choices?.[0]?.message?.content`

> **注意:** 関数名 `callGeminiAPI`、`scheduleGeminiTask`、`postGeminiWithRetry` はこのステップではリネームしない。
> まず動くことを確認してからステップ3でリネームする。

---

### 2-4. fetchTrivia のリクエスト・レスポンス形式

**変更前:**
```javascript
const data = await scheduleGeminiTask(() => postGeminiWithRetry({
  contents: [{
    role: 'user',
    parts: [{ text: 'コーヒーに関する豆知識を1つ、50文字以内で「〜なのだ」口調で教えて。' }]
  }]
}, { maxRetries: 2 }));

const triviaResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
```

**変更後:**
```javascript
const data = await scheduleGeminiTask(() => postGeminiWithRetry({
  messages: [
    { role: 'user', content: 'コーヒーに関する豆知識を1つ、50文字以内で「〜なのだ」口調で教えて。' }
  ]
}, { maxRetries: 2 }));

const triviaResponse = data.choices?.[0]?.message?.content;
```

変更点:
- `contents` → `messages`
- `{ role: 'user', parts: [{ text: '...' }] }` → `{ role: 'user', content: '...' }`
- レスポンス: `data.candidates?.[0]?.content?.parts?.[0]?.text` → `data.choices?.[0]?.message?.content`

---

### ステップ2の検証

以下の2つを確認する:

**検証1: 豆知識（自動）**
1. ページをリロードする
2. ヘッダーの「今日の豆知識」にAI生成テキストが表示されることを確認
3. （キャッシュが残っている場合は `localStorage.removeItem('coffeeTriviaCache:v1')` を実行してからリロード）

**検証2: チャット**
1. 「コーヒー豆くんと会話する」ボタンを押す
2. 「こんにちは」と入力して送信
3. コーヒー豆くんから「〜なのだ」口調の返答が来ることを確認
4. 「酸味が少なくて飲みやすいのが欲しい」と送信
5. おすすめの豆名とプレビューカードが表示されることを確認

両方が動作すればステップ3に進む。

---

## ステップ3: レート制限の緩和と変数リネーム

### 対象ファイル

`index.html`

### 変更内容

ステップ2で動作確認できた後、以下のリネームとパラメータ変更を行う。

### 3-1. レート制限定数の変更

**変更前:**
```javascript
const GEMINI_RPM_LIMIT = 5;
const GEMINI_MIN_INTERVAL_MS = Math.ceil(60_000 / GEMINI_RPM_LIMIT) + 500;
```

**変更後:**
```javascript
const API_RPM_LIMIT = 20;
const API_MIN_INTERVAL_MS = Math.ceil(60_000 / API_RPM_LIMIT) + 500; // 3.5s
```

効果: 最小リクエスト間隔が12.5秒 → 3.5秒に短縮される。

### 3-2. 変数・関数のリネーム

以下を一括置換する。**置換順序は問わない**（名前の衝突はない）。

| 変更前 | 変更後 | 出現箇所数（目安） |
|--------|--------|-------------------|
| `GEMINI_RPM_LIMIT` | `API_RPM_LIMIT` | 1 (定義) |
| `GEMINI_MIN_INTERVAL_MS` | `API_MIN_INTERVAL_MS` | 4 (定義1 + 使用3) |
| `geminiQueue` | `apiQueue` | 2 (定義1 + 使用1) |
| `nextGeminiAllowedAt` | `nextAPIAllowedAt` | 4 (定義1 + 使用3) |
| `scheduleGeminiTask` | `scheduleAPITask` | 4 (定義1 + 使用3) |
| `postGeminiWithRetry` | `postAPIWithRetry` | 4 (定義1 + 使用3) |
| `callGeminiAPI` | `callChatAPI` | 2 (定義1 + 使用1) |
| `SYSTEM_INSTRUCTION` | `SYSTEM_PROMPT` | ステップ2で変更済み |

### 3-3. コメントの更新

Gemini固有のコメントを汎用的な表現に修正する。

**変更前:**
```javascript
// ===== レート制限（RPM 5 対策）=====
// Gemini 2.5 Flash の上限が 5 RPM の場合、1リクエストあたり最低 12 秒は空ける必要がある。
// ページ初期化の「豆知識」 + チャット送信が合算で上限を超えないよう、同一ページ内のGemini呼び出しを直列化して間隔を空ける。
```

**変更後:**
```javascript
// ===== レート制限（RPM対策）=====
// OpenRouter経由のAPI呼び出しを直列化して最小間隔を空ける。
```

**変更前:**
```javascript
// 同一ページ内のGemini呼び出しを「キュー化」して、必ず最小間隔を空ける
```

**変更後:**
```javascript
// API呼び出しをキュー化して、必ず最小間隔を空ける
```

**変更前:**
```javascript
// 429 / 一時的な 5xx のときに指数バックオフして再試行
```

→ この行はそのまま維持（Gemini固有でなく汎用的な記述のため）。

**変更前:**
```javascript
throw lastError || new Error('Gemini request failed');
```

**変更後:**
```javascript
throw lastError || new Error('API request failed');
```

**変更前:**
```javascript
// --- Gemini API ---
```

**変更後:**
```javascript
// --- Chat API ---
```

### ステップ3の検証

ステップ2と同じ検証を再実行する。リネームによるtypo（変数名不一致）がないことを確認する。

ブラウザのDevToolsのConsoleタブを開き、エラーが出ていないことも確認する。

---

## ステップ4: 不要ファイル削除と環境変数の整理

### 4-1. config.sample.js の削除

このファイルはフロントエンドから直接APIキーを使う旧方式のためのもの。
現在はバックエンド（Vercel Functions）経由でAPIを呼んでおり不要。

```bash
git rm search_coffee/config.sample.js
```

### 4-2. .env の確認

`.env` ファイルが以下の内容であることを確認する（すでに設定済み）:

```
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

`GEMINI_API_KEY` の行がある場合は削除する。

### 4-3. Vercel環境変数の設定

Vercelダッシュボード（Settings → Environment Variables）で以下を実施:

1. `GEMINI_API_KEY` を削除する
2. `OPENROUTER_API_KEY` を追加する（値: OpenRouterで発行したAPIキー `sk-or-...`）
3. `OPENROUTER_MODEL` を追加する（値: `google/gemini-2.0-flash-exp:free`）

### 4-4. .gitignore の確認

`config.js` がgitignoreに含まれていることを確認する（変更不要のはず）。

### ステップ4の検証

1. `vercel dev` またはデプロイ先でページを開く
2. ステップ2と同じ検証（豆知識 + チャット）を実行
3. 問題なければ移行完了

---

## 変更ファイル一覧（まとめ）

| ファイル | ステップ | 変更内容 |
|----------|---------|----------|
| `api/gemini.js` | 1 | 全面書き換え（OpenRouter API呼び出しに変更） |
| `index.html` | 2 | リクエスト・レスポンス形式をOpenAI互換に変更 |
| `index.html` | 3 | レート制限緩和、変数・関数・コメントのリネーム |
| `config.sample.js` | 4 | 削除 |
| `.env` | 4 | 確認（変更不要のはず） |
| Vercel環境変数 | 4 | `GEMINI_API_KEY`→削除、`OPENROUTER_API_KEY`/`OPENROUTER_MODEL`→追加 |

---

## トラブルシューティング

### 「うまく返事できなかったのだ...」と表示される

1. DevToolsのNetworkタブで `/api/gemini` のレスポンスを確認
2. 401エラー → `OPENROUTER_API_KEY` が未設定 or 無効
3. 400エラー → リクエストボディの形式が不正（`messages` ではなく `contents` を送っているなど）
4. 429エラー → レート制限に到達（リトライで自動回復するはず）
5. レスポンスは200だが表示されない → `data.choices[0].message.content` のパスが間違っている

### 豆知識が「読み込み中...」のまま

1. 上記と同じNetworkタブの確認
2. localStorageのキャッシュが古い形式で残っている可能性 → `localStorage.removeItem('coffeeTriviaCache:v1')` でクリアしてリロード

### OpenRouterの日次上限（50回）に到達した

- エラーレスポンスに `rate_limit` 関連のメッセージが含まれる
- 翌日まで待つか、OpenRouterアカウントに$10以上チャージして上限を1,000/日に緩和する
