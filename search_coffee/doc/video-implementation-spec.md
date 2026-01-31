# コーヒー豆ビギナーズガイド 紹介動画 実装設計書

## 1. 概要

### 目的
コーヒー豆ビギナーズガイドの機能と魅力を伝える紹介動画を、Remotionを使用して作成する。

### 基本仕様e
| 項目 | 値 |
|------|-----|
| 動画の長さ | 18秒 |
| フレームレート | 30fps |
| 総フレーム数 | 540フレーム |
| 解像度 | 1920×1080（16:9） |
| 出力形式 | MP4 |
| 雰囲気 | 洗練・ミニマル |

---

## 2. ディレクトリ構成

```
test_0118/
├── search_coffee/           # 既存サイト
│   ├── index.html
│   ├── styles.css
│   └── doc/
│       └── video-implementation-spec.md  ← 本ドキュメント
│
└── video/                   # Remotionプロジェクト（新規作成）
    ├── package.json
    ├── tsconfig.json
    ├── remotion.config.ts
    ├── src/
    │   ├── Root.tsx                      # エントリーポイント
    │   ├── CoffeeVideo.tsx               # メインコンポジション
    │   ├── scenes/
    │   │   ├── TitleScene.tsx            # タイトル画面
    │   │   ├── MainPreviewScene.tsx      # メイン画面紹介
    │   │   ├── SearchFeatureScene.tsx    # 検索機能紹介
    │   │   ├── ChatFeatureScene.tsx      # AIチャット紹介
    │   │   ├── SummaryScene.tsx          # 特徴まとめ
    │   │   └── EndingScene.tsx           # エンディング
    │   ├── components/
    │   │   ├── CoffeeCard.tsx            # 豆カードコンポーネント
    │   │   ├── ChatBubble.tsx            # チャット吹き出し
    │   │   └── AnimatedText.tsx          # テキストアニメーション
    │   └── styles/
    │       └── theme.ts                  # カラー・フォント定義
    └── public/
        └── screenshots/                  # サイトのスクリーンショット
            ├── main-view.png
            ├── coffee-cards.png
            ├── search-modal.png
            └── chat-modal.png
```

---

## 3. 動画構成（タイムライン）

### 全体構成（18秒 = 540フレーム）

| シーン | 時間 | フレーム | 内容 |
|--------|------|----------|------|
| 1. タイトル | 0:00-0:03 | 0-90 | サイト名 + コーヒーアイコン |
| 2. メイン画面 | 0:03-0:06 | 90-180 | サイト全体 → カードにズーム |
| 3. 検索機能 | 0:06-0:09 | 180-270 | 検索モーダル + 説明テキスト |
| 4. AIチャット | 0:09-0:14 | 270-420 | チャット画面 + 会話デモ |
| 5. 特徴まとめ | 0:14-0:16 | 420-480 | 3つのキーポイント |
| 6. エンディング | 0:16-0:18 | 480-540 | URL + キャッチコピー |

---

## 4. 各シーンの詳細設計

### シーン1: タイトル（0:00-0:03）

**目的**: サイト名を印象的に表示

**演出**:
- 背景: `#f6f5f2`（サイトの背景色）
- 中央にコーヒーカップアイコンがフェードイン（0-30f）
- タイトル「コーヒー豆ビギナーズガイド」がスプリングアニメーションで登場（30-60f）
- サブタイトル「あなたの好みの豆が見つかる」がフェードイン（60-90f）

**コンポーネント**: `TitleScene.tsx`

```tsx
// 実装例
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
const scale = spring({ frame: frame - 30, fps, config: { damping: 12, mass: 0.5 } });
```

---

### シーン2: メイン画面紹介（0:03-0:06）

**目的**: サイトの全体像を見せる

**演出**:
- サイトのスクリーンショットが左からスライドイン（90-120f）
- 軽いシャドウ付きのフレーム内に表示
- ゆっくり上方向にスクロール風アニメーション（120-150f）
- コーヒー豆カード部分にズームイン（150-180f）

**素材**: `main-view.png`, `coffee-cards.png`

**コンポーネント**: `MainPreviewScene.tsx`

```tsx
// 画像の読み込み例
import { Img, staticFile } from "remotion";

<Img src={staticFile("screenshots/main-view.png")} />
```

---

### シーン3: 検索機能（0:06-0:09）

**目的**: 検索機能の便利さを伝える

**演出**:
- 検索モーダルのスクリーンショットが中央に表示（180-210f）
- 条件選択ボタンが順番にハイライト（アニメーション）（210-240f）
- テキスト「好みの条件で豆を探せる」がフェードイン（240-270f）

**素材**: `search-modal.png`

**コンポーネント**: `SearchFeatureScene.tsx`

---

### シーン4: AIチャット（0:09-0:14）

**目的**: コーヒー豆くんの魅力を伝える（最重要シーン）

**演出**:
- チャットモーダルのスクリーンショット表示（270-300f）
- ユーザーメッセージがタイプライター風に表示（300-330f）
  - 「初心者におすすめの豆は？」
- コーヒー豆くんの返答が吹き出しで表示（330-390f）
  - 「ブラジル産がおすすめです！バランスが良く、酸味も控えめで飲みやすいですよ」
- 「AIがあなたの疑問に答えます」テキスト（390-420f）

**コンポーネント**: `ChatFeatureScene.tsx`, `ChatBubble.tsx`

```tsx
// タイプライター効果の実装例
const text = "初心者におすすめの豆は？";
const charsToShow = Math.floor(interpolate(frame, [0, 30], [0, text.length], { extrapolateRight: "clamp" }));
const displayText = text.slice(0, charsToShow);
```

---

### シーン5: 特徴まとめ（0:14-0:16）

**目的**: サイトの価値を簡潔に伝える

**演出**:
- 3つのキーポイントが順番にスライドイン
  1. 「20種類のコーヒー豆」（420-440f）
  2. 「3つの評価軸で比較」（440-460f）
  3. 「AIアシスタント搭載」（460-480f）
- 各項目にアイコン付き

**コンポーネント**: `SummaryScene.tsx`

```tsx
// スタッガードアニメーションの例
const items = ["20種類のコーヒー豆", "3つの評価軸で比較", "AIアシスタント搭載"];
{items.map((item, i) => {
  const delay = i * 20; // 20フレームずつ遅延
  const x = interpolate(frame - delay, [0, 15], [100, 0], { extrapolateRight: "clamp" });
  return <div style={{ transform: `translateX(${x}px)` }}>{item}</div>;
})}
```

---

### シーン6: エンディング（0:16-0:18）

**目的**: サイトへの誘導

**演出**:
- キャッチコピー「はじめてのコーヒー選びに」がフェードイン（480-510f）
- URL表示（仮: `coffee-guide.example.com`）（510-530f）
- 全体がゆっくりフェードアウト（530-540f）

**コンポーネント**: `EndingScene.tsx`

---

## 5. スタイリングガイドライン

### カラーパレット（サイトから継承）

```typescript
// video/src/styles/theme.ts
export const colors = {
  bg: '#f6f5f2',           // 背景
  surface: '#ffffff',       // サーフェス
  text: '#1c1c1c',         // テキスト
  muted: '#6a6a6a',        // サブテキスト
  accent: '#b57c4d',       // アクセント（コーヒーブラウン）
  accentSoft: '#f2e7dc',   // ソフトアクセント
  line: '#e6e2dd',         // ボーダー
};
```

### フォント設定

```typescript
// video/src/styles/theme.ts
import { loadFont } from "@remotion/google-fonts/Inter";

// フォントをロード（Root.tsx で呼び出す）
export const { fontFamily } = loadFont();

export const fonts = {
  main: fontFamily,  // Interフォント
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};
```

### アニメーション指針

| 種類 | 用途 | 設定 |
|------|------|------|
| フェードイン | テキスト登場 | 20-30フレーム |
| スプリング | タイトル、強調 | `config: { damping: 12, mass: 0.5 }` |
| スライド | 画面遷移、要素登場 | 15-20フレーム、easeOut |
| タイプライター | チャットメッセージ | 1文字/2フレーム |

### アニメーション実装パターン

```typescript
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";

// フェードイン
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

// スプリングアニメーション
const scale = spring({
  frame,
  fps,
  config: { damping: 12, mass: 0.5 },
});

// イージング付きスライド
const x = interpolate(frame, [0, 20], [100, 0], {
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});
```

---

## 6. 実装手順

### Phase 1: 環境構築

```bash
# 1. videoディレクトリに移動（親ディレクトリで実行）
cd test_0118

# 2. Remotionプロジェクトを作成
npm create video@latest

# 対話形式で以下を入力:
# - Project name: video
# - Template: Blank

# 3. プロジェクトディレクトリに移動
cd video

# 4. 追加の依存関係をインストール
npm install @remotion/google-fonts

# 5. 開発サーバーを起動して動作確認
npm start
```

### Phase 2: 基本構造の作成

1. `src/styles/theme.ts` を作成

```typescript
// video/src/styles/theme.ts
import { loadFont } from "@remotion/google-fonts/Inter";

export const { fontFamily } = loadFont();

export const colors = {
  bg: '#f6f5f2',
  surface: '#ffffff',
  text: '#1c1c1c',
  muted: '#6a6a6a',
  accent: '#b57c4d',
  accentSoft: '#f2e7dc',
  line: '#e6e2dd',
};

export const fonts = {
  main: fontFamily,
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};
```

2. `src/Root.tsx` にCompositionを定義

```typescript
// video/src/Root.tsx
import { Composition } from "remotion";
import { CoffeeVideo } from "./CoffeeVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CoffeeVideo"
      component={CoffeeVideo}
      durationInFrames={540}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

3. `src/CoffeeVideo.tsx` にメインコンポジションを作成

```typescript
// video/src/CoffeeVideo.tsx
import { AbsoluteFill, Sequence } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { MainPreviewScene } from "./scenes/MainPreviewScene";
import { SearchFeatureScene } from "./scenes/SearchFeatureScene";
import { ChatFeatureScene } from "./scenes/ChatFeatureScene";
import { SummaryScene } from "./scenes/SummaryScene";
import { EndingScene } from "./scenes/EndingScene";
import { colors } from "./styles/theme";

export const CoffeeVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <Sequence from={0} durationInFrames={90}>
        <TitleScene />
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <MainPreviewScene />
      </Sequence>
      <Sequence from={180} durationInFrames={90}>
        <SearchFeatureScene />
      </Sequence>
      <Sequence from={270} durationInFrames={150}>
        <ChatFeatureScene />
      </Sequence>
      <Sequence from={420} durationInFrames={60}>
        <SummaryScene />
      </Sequence>
      <Sequence from={480} durationInFrames={60}>
        <EndingScene />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### Phase 3: スクリーンショットの準備

1. サイトをブラウザで開く（`search_coffee/index.html`）
2. 以下のスクリーンショットを撮影（推奨サイズ: 1920×1080 または 16:9比率）:

| ファイル名 | 撮影対象 | 撮影のコツ |
|-----------|---------|-----------|
| `main-view.png` | サイト全体（ヘッダー + カード上部） | ブラウザ幅1920pxで撮影 |
| `coffee-cards.png` | コーヒー豆カード部分 | 4-6枚のカードが見える状態 |
| `search-modal.png` | 検索モーダル | モーダルを開いた状態で撮影 |
| `chat-modal.png` | チャットモーダル | 会話例が表示された状態 |

3. `video/public/screenshots/` に保存

### Phase 4: 各シーンの実装

1. `TitleScene.tsx` を実装
2. `MainPreviewScene.tsx` を実装
3. `SearchFeatureScene.tsx` を実装
4. `ChatFeatureScene.tsx` を実装（ChatBubble含む）
5. `SummaryScene.tsx` を実装
6. `EndingScene.tsx` を実装

### Phase 5: 統合とプレビュー

1. `CoffeeVideo.tsx` で全シーンをSequenceで統合
2. `npm start` でプレビュー確認
3. タイミング・アニメーションを調整

### Phase 6: レンダリング

```bash
# MP4として書き出し
npx remotion render CoffeeVideo out/coffee-intro.mp4

# 高品質設定でレンダリング
npx remotion render CoffeeVideo out/coffee-intro.mp4 --codec h264 --crf 18
```

---

## 7. 技術要件

### Remotion バージョン
- remotion: ^4.0.0（最新安定版を使用）
- @remotion/google-fonts: ^4.0.0

### 必要なパッケージ

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "remotion": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "@remotion/google-fonts": "^4.0.0"
  }
}
```

### 主要な使用API

| API | 用途 | インポート元 |
|-----|------|-------------|
| `useCurrentFrame()` | 現在のフレーム取得 | `remotion` |
| `useVideoConfig()` | 動画設定の取得（fps等） | `remotion` |
| `interpolate()` | 値の補間（アニメーション） | `remotion` |
| `spring()` | スプリングアニメーション | `remotion` |
| `Sequence` | シーンの配置・タイミング制御 | `remotion` |
| `AbsoluteFill` | 全画面レイアウト | `remotion` |
| `Img` | 画像の表示 | `remotion` |
| `staticFile()` | public内の静的ファイル参照 | `remotion` |
| `loadFont()` | Google Fontsの読み込み | `@remotion/google-fonts/*` |

---

## 8. 備考

### 将来の拡張案
- 多言語対応（英語版の作成）
- SNS用の縦型バージョン（9:16）
- 各機能の詳細説明動画（シリーズ化）

### 注意事項
- スクリーンショットは実際のサイトから取得すること
- フォント（Inter）のライセンス: SIL Open Font License（商用利用可）
- レンダリング時間の目安: 18秒動画で約1-2分
- 画像は `staticFile()` を使って参照すること（直接importは非推奨）
