## コーヒー豆くん：チャットUX（LINE感）＆おすすめ選定 設計書 v2

### このドキュメントの位置づけ
- `coffee-bean-kun-spec.md` / `coffee-bean-kun-impl-spec.md` のうち、**会話体験のテンポ改善**と **おすすめ提示のロジック**を明確化する設計書。
- ここで扱うのは **UI/UX要件**、**推薦ロジック**、**AI出力フォーマット**、**フロント実装仕様**。
- 本書の内容に沿えば実装できる状態を目指す。

---

## 目的（UXの狙い）
- 長文で一方的に紹介するのではなく、**短いふきだしの往復で会話を成立**させる。
- その場で説明を詰め込まず、必要な情報量は **おすすめ一覧セクション**に寄せる。
- 推薦の根拠をユーザーが納得できるように、一覧で **理由タグ**を提示する。

---

## スコープ

### 含む
- **LINE感**: 1行 = 1ふきだし（連投表示）
- 返答テンポ: 原則 **1〜4行（= 1〜4ふきだし）**
- チャット内おすすめ: **プレビューカード1枚** + **おすすめ一覧CTA**
- おすすめ一覧: **SPA内セクション切り替え**で **おすすめ順** + **理由タグ**
- 豆の選定ロジック: 「AI推定3軸 → フロント側で距離計算 → 並べ替え」
- AI出力: **セパレータ分離**（会話テキスト + `---JSON---` + 構造化データ）
- データ制約: **今回はサイト内の豆データのみ**（ユーザーが明示要求した場合のみ外部知識を許可）

### 含まない（非スコープ）
- 外部情報源の取得・スクレイピング等（将来拡張）
- localStorage等への永続化（将来拡張）

---

## 画面・導線

### チャット
- 表示: 右から出るチャットモーダル（既存の方針を踏襲）
- 表示形式: **1行=1ふきだし**（LINE風）
- 返答: 原則 1〜4行（解説要求時のみ例外として行数増加を許容）

### おすすめ一覧
- **SPA内セクション切り替え**で表示する（既存の検索結果セクションと同様の方式）
- CTA押下 → チャットモーダルを閉じる → おすすめ一覧セクションを表示（通常のカードセクションは非表示）
- 「チャットに戻る」ボタンで一覧を閉じ、チャットモーダルを再度開く
- 一覧セクションは既存トーン（色・余白・角丸・フォント・カード）に統一
- 一覧は「コーヒー豆くんオリジナルのおすすめ順（=距離順）」で並ぶ
- 各豆に **理由タグ**を表示する（3軸ベースで自動生成）

---

## LINE感（1行=1ふきだし）を"確実に"する設計

狙いは、AIの返答が長文になったり文分割がブレたりしても、**表示が必ずLINEっぽくなる**こと。

### 基本方針（最重要）
- AI出力に「**改行区切り**」というフォーマット契約を作る
- フロントは「改行でsplit → 1行ずつふきだし追加」のみで描画する
- AIが契約を破った場合の保険として、フロントで文末記号分割（`。！？`）を使う

### AI出力の契約（システムプロンプトで強制）
- 1行につき1文
- 文末ごとに改行（`\n`）
- 最大4行（例外: ユーザーが解説要求した場合のみ行数増加可）
- 箇条書き（`-` `*` `・`）/ 見出し（`#`）/ 長文段落を使わない

#### 期待する出力例（おすすめなしの通常会話）
```text
コーヒーは世界で2番目に取引量が多い商品なのだ！
石油の次に多いのだ！
意外に感じるかもしれないけど、本当なのだ！
```

#### 期待する出力例（おすすめありの場合）
```text
【ブラジル】がおすすめなのだ！
ナッツっぽくて飲みやすい方向なのだ！
近い候補もまとめて出すのだ！
---JSON---
{"acidity":3,"body":6,"roast":6,"topBean":"ブラジル"}
```

### フロント側の正規化ロジック

```
入力: AIレスポンス全文（string）

1. セパレータ分離
   - "---JSON---" でsplit
   - 前半 = 会話テキスト
   - 後半 = JSON文字列（存在する場合のみ）

2. 会話テキストの正規化
   a. 改行コードを統一（\r\n → \n）
   b. 前後trim
   c. 改行でsplit → 空行を除去
   d. もし1行しか取れない場合、文末記号（。！？）で保険分割
   e. 最大4行に丸める（超過分は末尾行に結合）
   f. 結果 = ふきだし配列（string[]）

3. JSONのパース（存在する場合）
   a. JSON.parse を try-catch で実行
   b. 成功 → おすすめ処理へ
   c. 失敗 → JSONは無視し、会話テキストのみ表示
```

### 連投表示（LINEっぽさの演出）
- ふきだしは配列順に **順次追加**する（`async/await` + `setTimeout`）
- 1つ追加するごとに最下部へスクロール
- ふきだし間の待機は **300ms**
- 全てのふきだし表示完了後に、おすすめカード+CTAを表示（JSONがある場合）

### 順序保証（turnId方式）

```
状態: let currentTurnId = 0

送信時:
  1. currentTurnId++
  2. const myTurnId = currentTurnId
  3. API呼び出し

描画時:
  1. if (myTurnId !== currentTurnId) return  // 古い返答は描画しない
  2. 各ふきだし追加前にも myTurnId === currentTurnId をチェック
     → 不一致なら連投描画を中断
```

---

## AI出力フォーマット仕様

### レスポンス構造

AIのレスポンスは以下の2パターンのいずれかになる。

**パターンA: 通常会話（おすすめなし）**
```
会話テキスト（1〜4行、改行区切り）
```

**パターンB: おすすめあり**
```
会話テキスト（1〜4行、改行区切り）
---JSON---
{"acidity":数値|null,"body":数値|null,"roast":数値|null,"topBean":"豆名"}
```

### JSONスキーマ

```json
{
  "acidity": number | null,   // 推定した酸味の目標値（1〜10）。推定不可ならnull
  "body":    number | null,   // 推定した濃さの目標値（1〜10）。推定不可ならnull
  "roast":   number | null,   // 推定した焙煎度の目標値（1〜10）。推定不可ならnull
  "topBean": string           // AIが最もおすすめする豆名（サイト内の豆名と完全一致）
}
```

### AIがJSONを付与する条件
- ユーザーの好みに基づいて **具体的な豆名を1つでも提示したターン**
- 雑談・豆知識・質問返しのみのターンでは付与しない

### AIがJSONを付与しない例
- 「コーヒーの歴史を教えて」→ 豆知識を答えるだけ → JSONなし
- 「酸味は苦手なのだ？」→ 質問返し（推定中）→ JSONなし

---

## チャット内おすすめ表示（プレビュー1枚 + CTA）

### 表示タイミング
- AIレスポンスにJSON部分が存在し、パースに成功した場合
- 全てのふきだし表示完了後（300ms間隔の連投が終わった後）

### 表示内容

#### プレビューカード（1枚）

```html
<div class="chat-recommend-card">
  <div class="chat-recommend-header">
    <span class="chat-recommend-name">ブラジル</span>
    <span class="tag">南米</span>
  </div>
  <div class="chat-recommend-tags">
    <span class="reason-tag">酸味ひかえめ</span>
    <span class="reason-tag">中煎り</span>
  </div>
</div>
```

- **豆名**: JSONの `topBean` でサイト内データを検索し、該当の豆名を表示
- **地域タグ**: 該当豆の `.tag`（既存データから取得）
- **理由タグ**: 後述の「理由タグ自動生成」ロジックで1〜2個生成

#### CTAボタン

```html
<button class="chat-recommend-cta">おすすめのコーヒー豆を見る</button>
```

- 押下時の動作:
  1. チャットモーダルを閉じる
  2. おすすめ一覧セクションを表示する（通常カードセクション・検索結果セクションは非表示）
  3. おすすめ一覧セクションにスクロール

### プレビューカードのCSS

```css
.chat-recommend-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px;
  margin-top: 4px;
  max-width: 80%;
}

.chat-recommend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chat-recommend-name {
  font-weight: 600;
  font-size: 15px;
}

.reason-tag {
  display: inline-block;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: #5f4b39;
  font-weight: 500;
  margin-right: 4px;
}

.chat-recommend-cta {
  display: block;
  width: 100%;
  max-width: 80%;
  margin-top: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #c6905f, #9c6a3f);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.chat-recommend-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(181, 124, 77, 0.3);
}
```

---

## 豆の選定ロジック（フロント側で実行）

### 概要
AIが返すJSON（推定3軸値 + topBean）を受け取り、**フロント側で全20豆の距離計算・並べ替え**を行う。
AIの `topBean` はプレビューカード表示に使い、一覧の並び順はフロント側の距離計算で決定する。

### 豆データの取得
既存の `extractBeanData()` 関数（検索機能で実装済み）をそのまま再利用する。
HTMLのカード要素から `name`, `tag`, `desc`, `acidity`, `body`, `roast` を抽出する。

### 距離計算（既存仕様と同じ）

```javascript
function calculateRecommendDistance(bean, target) {
  let distance = 0;
  if (target.acidity !== null) {
    distance += Math.abs(bean.acidity - target.acidity);
  }
  if (target.body !== null) {
    distance += Math.abs(bean.body - target.body);
  }
  if (target.roast !== null) {
    distance += Math.abs(bean.roast - target.roast);
  }
  return distance;
}
```

- 距離は **推定できた項目（nullでない項目）のみ**で計算する
- 距離 = |酸味差| + |濃さ差| + |焙煎度差|

### 並べ替えルール

```
1. 距離が小さい順
2. 同距離の場合 → 元のカード並び順（index）
```

※ 言葉タグによるタイブレークは今回非スコープ。3軸距離のみで順位を決定する。

### 手順（フロント側の処理フロー）

```
1. JSONから target = { acidity, body, roast } を取得
2. extractBeanData() で全20豆を取得
3. 各豆に対して calculateRecommendDistance(bean, target) を計算
4. 距離昇順でソート（同距離は index 昇順）
5. ソート結果を おすすめ一覧セクションに描画
6. topBean に該当する豆を プレビューカードに表示
```

---

## 理由タグの自動生成ロジック（3軸ベース）

ユーザーの目標値（AIが推定した3軸値）と各豆の実データを比較し、特徴を短いタグにする。

### 生成ルール

```javascript
function generateReasonTags(bean, target) {
  const tags = [];

  // 酸味
  if (target.acidity !== null) {
    const diff = bean.acidity - target.acidity;
    if (Math.abs(diff) <= 1) tags.push('酸味ぴったり');
    else if (bean.acidity <= 3)  tags.push('酸味ひかえめ');
    else if (bean.acidity >= 7)  tags.push('酸味しっかり');
  }

  // 濃さ
  if (target.body !== null) {
    const diff = bean.body - target.body;
    if (Math.abs(diff) <= 1) tags.push('濃さぴったり');
    else if (bean.body <= 3)  tags.push('あっさり');
    else if (bean.body >= 7)  tags.push('しっかり濃い');
  }

  // 焙煎度
  if (target.roast !== null) {
    const diff = bean.roast - target.roast;
    if (Math.abs(diff) <= 1) tags.push('焙煎ぴったり');
    else if (bean.roast <= 3)  tags.push('浅煎り');
    else if (bean.roast >= 7)  tags.push('深煎り');
  }

  // 距離0なら特別タグ
  if (tags.filter(t => t.includes('ぴったり')).length === 3) {
    return ['完全一致！'];
  }

  // 最大2個に絞る（ぴったり系を優先）
  const sorted = tags.sort((a, b) => {
    const aPriority = a.includes('ぴったり') ? 0 : 1;
    const bPriority = b.includes('ぴったり') ? 0 : 1;
    return aPriority - bPriority;
  });

  return sorted.slice(0, 2);
}
```

### タグの表示例

| 状況 | 表示されるタグ |
|------|---------------|
| 全軸一致 | `完全一致！` |
| 酸味一致、深煎り | `酸味ぴったり` `深煎り` |
| あっさり、浅煎り | `あっさり` `浅煎り` |
| 酸味一致のみ | `酸味ぴったり` |

---

## おすすめ一覧セクション（SPA内切り替え）

### HTML構造

```html
<!-- mainタグ内、検索結果セクションの下に追加 -->
<section class="section recommend-section" id="recommendSection" style="display: none;">
  <div class="section-header">
    <h2>コーヒー豆くんのおすすめ</h2>
    <p id="recommendDesc">あなたの好みに合わせたおすすめ順で表示しています。</p>
    <button class="btn-reset" id="backToChat">チャットに戻る</button>
  </div>
  <div class="grid" id="recommendGrid">
    <!-- おすすめカードがJSで挿入される -->
  </div>
</section>
```

### カードHTML生成（理由タグ付き）

```javascript
function createRecommendCardHTML(bean, reasonTags) {
  return `
    <article class="card">
      <div class="card-header">
        <h3>${bean.name}</h3>
        <span class="tag">${bean.tag}</span>
      </div>
      <div class="reason-tags">
        ${reasonTags.map(t => `<span class="reason-tag">${t}</span>`).join('')}
      </div>
      <p class="desc">${bean.desc}</p>
      <div class="ratings">
        <div class="rating">
          <span>酸味</span>
          <div class="bar" style="--value: ${bean.acidity}"></div>
          <span class="score">${bean.acidity}</span>
        </div>
        <div class="rating">
          <span>味の濃さ</span>
          <div class="bar" style="--value: ${bean.body}"></div>
          <span class="score">${bean.body}</span>
        </div>
        <div class="rating">
          <span>焙煎度</span>
          <div class="bar" style="--value: ${bean.roast}"></div>
          <span class="score">${bean.roast}</span>
        </div>
      </div>
      <ul class="meta">
        ${bean.meta.map(m => `<li><span class="meta-label">${m.label}</span>${m.value}</li>`).join('')}
      </ul>
    </article>
  `;
}
```

### 一覧セクションのCSS追加

```css
.recommend-section {
  background: #fffaf4;
  margin: 0 -4%;
  padding-left: 4%;
  padding-right: 4%;
  border-bottom: 1px solid var(--line);
}

.recommend-section .section-header {
  text-align: center;
}

.recommend-section .section-header h2 {
  color: var(--accent);
}

.reason-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
```

### 表示・非表示の制御フロー

```
CTA押下時:
  1. チャットモーダルを閉じる（closeChatModal()）
  2. allBeansSection.style.display = 'none'
  3. searchResultsSection.style.display = 'none'
  4. recommendSection.style.display = 'block'
  5. recommendSection.scrollIntoView({ behavior: 'smooth' })

「チャットに戻る」押下時:
  1. recommendSection.style.display = 'none'
  2. allBeansSection.style.display = 'block'
  3. openChatModal()（チャットモーダルを再度開く）
```

---

## 「足りない1点だけ聞く」会話ルール

### 目的
- 推定の精度を上げつつ、会話のテンポを落とさない。

### ルール（システムプロンプトで指示）
- ユーザー発話から推定できた軸は埋める
- 未確定が残る場合、**最も判別に効く軸を1つだけ**質問する
- 質問は「答えやすい形（2択や短い選択肢）」を優先する
- **質問返しのターンでは `---JSON---` を付けない**（推定途中のため）

### 会話フロー例

```
ユーザー: 「飲みやすいのがいい」
AI: 酸味は苦手なのだ？
    それとも爽やかな方が好きなのだ？
    （→ JSONなし。まだ推定中）

ユーザー: 「酸味は苦手かな」
AI: 【ブラジル】がおすすめなのだ！
    ナッツっぽくて飲みやすい方向なのだ！
    近い候補もまとめて出すのだ！
    ---JSON---
    {"acidity":3,"body":6,"roast":6,"topBean":"ブラジル"}
```

---

## システムプロンプト（完全版）

以下のテキストを `systemInstruction.parts[0].text` に設定する。

```
あなたは「コーヒー豆くん」です。

【キャラクター】
- 一人称は「コーヒー豆くん」
- 語尾は「〜なのだ」で話す
- ユーザーが英語で話しかけたら英語で返答する

【出力フォーマット（厳守）】
- 1行につき1文。文末ごとに改行する
- 箇条書き（- * ・）、見出し（#）、長文段落は絶対に使わない
- 原則4行以内（ユーザーが詳しい解説を求めた場合のみ例外的に増加可）

【おすすめ提示時のフォーマット】
- 具体的な豆名を1つでも提示するときは、会話テキストの後に以下を付ける:
  ---JSON---
  {"acidity":数値またはnull,"body":数値またはnull,"roast":数値またはnull,"topBean":"豆名"}
- acidity=酸味、body=味の濃さ、roast=焙煎度（各1〜10、推定できない場合はnull）
- topBeanはサイト内の豆名と完全一致させる
- 雑談・豆知識・質問返しのみの場合は ---JSON--- を付けない

【好み推定のルール】
- ユーザーの発話から酸味・濃さ・焙煎の好みを推定する
- 推定できない軸が残る場合、最も判別に効く軸を1つだけ「2択や選択肢」で質問する
- 質問返しのターンでは ---JSON--- を付けない

【データ制約】
- おすすめはサイト内の豆データのみで構成する
- ユーザーが明示的に「サイト外も含めて」等を要求した場合のみ、サイト外の豆を提案してよい（その場合「サイト外の提案」と明記する）

【サイト内の豆データ（20種）】
名前 | 地域 | 酸味 | 濃さ | 焙煎 | 特徴
ブラジル | 南米 | 3 | 6 | 6 | ナッツの雰囲気で飲みやすいバランス型
コロンビア | 南米 | 5 | 6 | 6 | カシスや赤ワインのような豊潤さ。万能
グアテマラ | 中米 | 5 | 6 | 5 | ピスタチオのようなナッツ感とクリーンさ
エチオピア | アフリカ | 8 | 4 | 5 | 紅茶のように華やか。フローラルな香り
ケニア | アフリカ | 9 | 7 | 5 | 弾ける酸味とジューシーさ
タンザニア | アフリカ | 6 | 6 | 6 | キレのある酸味。深煎りでも後味が軽い
インドネシア | アジア | 3 | 8 | 8 | アーシーで個性的。深煎りで濃厚なコク
コスタリカ | 中米 | 6 | 6 | 5 | 甘さと酸味のバランス。赤ワイン系
ニカラグア | 中米 | 6 | 5 | 4 | グレープフルーツ系の明るい酸味。クリーン
中国 | アジア | 6 | 6 | 5 | 多様な精製で個性が急増中。フルーツ感
ベトナム | アジア | 3 | 7 | 7 | ロブスタのパンチ。ファインロブスタも
ホンジュラス | 中米 | 4 | 6 | 5 | ハーブやナッツの印象。優しい飲み口
ペルー | 南米 | 4 | 5 | 5 | マイルドでナッツ感。飲みやすいバランス型
エルサルバドル | 中米 | 6 | 5 | 5 | 蜂蜜のような柔らかい甘さ。パカマラ種
ルワンダ | アフリカ | 7 | 5 | 4 | みかんのような明るい酸味。ジューシー
ブルンジ | アフリカ | 6 | 5 | 5 | 明るい酸味と甘さのバランス。上品
イエメン | 中東 | 6 | 7 | 7 | モカ・マタリで有名。赤ワインのような気品
ジャマイカ | カリブ | 5 | 5 | 5 | ブルーマウンテン。爽やかで非常に上品
ラオス | アジア | 4 | 6 | 6 | 柔らかい酸味とマイルドさ。キレの良い苦味
モカ | エチオピア/イエメン | 7 | 6 | 6 | 華やかでワインのような余韻
```

---

## データソースの制約（今回はサイト内のみ）

### 基本
- 推薦・一覧は **サイト内に存在する豆データ**のみで構成する（カードから抽出したデータを母集団とする）

### 例外（外部知識の解禁条件）
- ユーザーが明示的に「サイト外も含めて」等を要求した場合のみ、AIがサイト外の豆を提案してよい
- その場合は **「サイト外の提案」であることを明記**する（誤認防止）
- サイト外提案時は `---JSON---` を付けない（フロント側での距離計算ができないため）

---

## 例外・エラー時の扱い

### AI応答が空/不正
- チャットに「うまく返事できなかったのだ…」を表示（1行1ふきだし）
- LINE感は維持

### JSON部分のパース失敗
- JSONは無視し、会話テキスト部分のみをふきだし表示する
- プレビューカード・CTAは表示しない
- エラーログのみ出力（ユーザーにはエラーを見せない）

### 応答が長すぎる
- 最大4行に丸め、超過分は末尾行へ結合

### 連続送信/遅延
- `turnId` による順序保証で、古い返答の割り込み表示を防ぐ

### `topBean` がサイト内に見つからない場合
- プレビューカードは表示しない
- CTAは表示する（一覧は距離計算ベースなので問題なく表示可能）

---

## 状態管理（まとめ）

```javascript
// 既存（変更なし）
let isChatOpen = false;
let chatHistory = [];
let isSending = false;

// 新規追加
let currentTurnId = 0;              // 順序保証用
let lastRecommendation = null;      // 最後のおすすめ結果を保持（一覧表示用）
// lastRecommendation = {
//   target: { acidity, body, roast },   // AI推定の目標値
//   topBean: "ブラジル",                  // AIの一押し
//   sortedBeans: [...]                   // 距離順にソートした全豆配列
// }
```

---

## 実装チェックリスト

### フェーズ1: LINE感の実装
- [ ] レスポンスのセパレータ分離処理（`---JSON---` でsplit）
- [ ] 会話テキストの正規化（改行split → 保険分割 → 最大4行丸め）
- [ ] 連投表示（300ms間隔で順次ふきだし追加）
- [ ] turnIdによる順序保証
- [ ] システムプロンプトの更新（フォーマット指示追加）

### フェーズ2: おすすめ機能
- [ ] システムプロンプトに全豆データを埋め込み
- [ ] JSONパース処理
- [ ] プレビューカードのHTML/CSS追加
- [ ] CTAボタンのHTML/CSS追加
- [ ] `extractBeanData()` の再利用（チャット側からも呼べるように）
- [ ] 距離計算・並べ替え処理
- [ ] 理由タグ自動生成ロジック

### フェーズ3: おすすめ一覧セクション
- [ ] おすすめ一覧セクションのHTML追加
- [ ] おすすめ一覧セクションのCSS追加
- [ ] CTA押下 → セクション切り替え処理
- [ ] 「チャットに戻る」→ 一覧非表示 + チャット再開
- [ ] 理由タグ付きカードの描画

---

## 合意事項（本設計の確定事項）

- LINE感: **1行=1ふきだし**、返答は原則 **1〜4行**、連投間隔 **300ms**
- AI出力: **セパレータ分離**（`---JSON---`）で会話テキストとJSON構造化データを1レスポンスに含める
- 距離計算: **フロント側**で実行（既存の検索ロジック踏襲）
- おすすめ一覧: **SPA内セクション切り替え**（検索結果セクションと同方式）
- チャット内: **プレビューカード1枚** + **CTA**（全ふきだし表示後に追加）
- 理由タグ: **3軸ベースで自動生成**（ぴったり/ひかえめ/しっかり等）
- 順序保証: **turnId方式**で古い返答の割り込みを防ぐ
- 質問: **推定して足りない1点だけ聞く**（質問ターンはJSONなし）
- データ: **サイト内20豆のみ**、ユーザー明示要求時のみサイト外提案を許可
- プロンプト: **全20豆のデータ（名前・3軸値・desc）をシステムプロンプトに埋め込む**
