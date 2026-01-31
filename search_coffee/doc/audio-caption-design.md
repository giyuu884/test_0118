# 設計書：音声・テロップ・シーン長動的調整機能

## 1. 概要

### 1.1 目的
現在のCoffeeVideo（コーヒー豆くん紹介動画）に以下の機能を追加する：
- 各シーンにナレーション音声を追加
- 音声に同期したテロップ（字幕）を表示
- 音声の長さに応じてシーンの長さを動的に調整

### 1.2 現状

```
┌─────────────────────────────────────────────────────────────┐
│ 現在の構造                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Root.tsx                                                   │
│  └── Composition (固定: 540フレーム = 18秒)                  │
│       └── CoffeeVideo.tsx                                   │
│            ├── Sequence (0-90)   → TitleScene               │
│            ├── Sequence (90-180) → MainPreviewScene         │
│            ├── Sequence (180-270)→ SearchFeatureScene       │
│            ├── Sequence (270-420)→ ChatFeatureScene         │
│            ├── Sequence (420-480)→ SummaryScene             │
│            └── Sequence (480-540)→ EndingScene              │
│                                                             │
│  問題点:                                                     │
│  - シーンの長さがハードコード（固定値）                        │
│  - 音声・テロップなし                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 目標構造

```
┌─────────────────────────────────────────────────────────────┐
│ 目標の構造                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  データ層                                                    │
│  └── scenes.json (各シーンの音声パス・テロップ定義)            │
│                                                             │
│  処理層                                                      │
│  └── calculateMetadata                                      │
│       ├── 音声ファイルの長さを取得                            │
│       ├── 各シーンのdurationInFramesを計算                   │
│       └── 合計のdurationInFramesを計算                       │
│                                                             │
│  表示層                                                      │
│  └── CoffeeVideo                                            │
│       └── 各シーン                                           │
│            ├── <Audio> (音声再生)                            │
│            ├── <SceneComponent> (映像)                       │
│            └── <CaptionOverlay> (テロップ)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. データ設計

### 2.1 ディレクトリ構成（変更後）

```
video/
├── public/
│   └── audio/                    # 【新規】音声ファイル
│       ├── scene1-title.mp3
│       ├── scene2-main-preview.mp3
│       ├── scene3-search.mp3
│       ├── scene4-chat.mp3
│       ├── scene5-summary.mp3
│       └── scene6-ending.mp3
│
├── src/
│   ├── data/                     # 【新規】データ定義
│   │   └── scenes.ts
│   │
│   ├── types/                    # 【新規】型定義
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── ChatBubble.tsx
│   │   ├── AnimatedText.tsx
│   │   └── CaptionOverlay.tsx    # 【新規】テロップ表示
│   │
│   ├── utils/                    # 【新規】ユーティリティ
│   │   └── getAudioDuration.ts
│   │
│   ├── scenes/                   # 既存（変更なし）
│   │   └── ...
│   │
│   ├── CoffeeVideo.tsx           # 【変更】propsから動的に生成
│   └── Root.tsx                  # 【変更】calculateMetadata追加
│
└── package.json                  # 【変更】依存関係追加
```

### 2.2 型定義

```typescript
// src/types/index.ts

/** テロップ1件の定義 */
export type CaptionItem = {
  text: string;      // 表示するテキスト
  startMs: number;   // 表示開始時間（ミリ秒、シーン内の相対時間）
  endMs: number;     // 表示終了時間（ミリ秒、シーン内の相対時間）
};

/** シーン1つの設定 */
export type SceneConfig = {
  id: string;                    // シーンID
  name: string;                  // シーン名（日本語）
  audioSrc: string;              // 音声ファイルパス
  captions: CaptionItem[];       // テロップ配列
};

/** 計算後のシーン情報（durationを含む） */
export type SceneWithDuration = SceneConfig & {
  durationInFrames: number;      // 計算されたフレーム数
  startFrame: number;            // 開始フレーム
};

/** CoffeeVideoコンポーネントに渡すprops */
export type CoffeeVideoProps = {
  scenes: SceneWithDuration[];
};
```

### 2.3 シーンデータ定義

```typescript
// src/data/scenes.ts

import { SceneConfig } from "../types";

export const sceneConfigs: SceneConfig[] = [
  {
    id: "title",
    name: "タイトル",
    audioSrc: "audio/scene1-title.mp3",
    captions: [
      { text: "コーヒー豆くんへ", startMs: 0, endMs: 1200 },
      { text: "ようこそ", startMs: 1200, endMs: 2500 },
    ],
  },
  {
    id: "mainPreview",
    name: "メイン画面紹介",
    audioSrc: "audio/scene2-main-preview.mp3",
    captions: [
      { text: "アプリの画面はこちら", startMs: 0, endMs: 1500 },
      { text: "シンプルで使いやすいデザインです", startMs: 1500, endMs: 3500 },
    ],
  },
  {
    id: "searchFeature",
    name: "検索機能",
    audioSrc: "audio/scene3-search.mp3",
    captions: [
      { text: "検索機能で", startMs: 0, endMs: 1000 },
      { text: "好みのコーヒー豆を", startMs: 1000, endMs: 2000 },
      { text: "簡単に見つけられます", startMs: 2000, endMs: 3500 },
    ],
  },
  {
    id: "chatFeature",
    name: "AIチャット",
    audioSrc: "audio/scene4-chat.mp3",
    captions: [
      { text: "AIチャットで", startMs: 0, endMs: 1200 },
      { text: "あなたにぴったりの豆を", startMs: 1200, endMs: 2500 },
      { text: "提案します", startMs: 2500, endMs: 4000 },
    ],
  },
  {
    id: "summary",
    name: "特徴まとめ",
    audioSrc: "audio/scene5-summary.mp3",
    captions: [
      { text: "検索、チャット、お気に入り", startMs: 0, endMs: 2000 },
      { text: "3つの機能で快適に", startMs: 2000, endMs: 3500 },
    ],
  },
  {
    id: "ending",
    name: "エンディング",
    audioSrc: "audio/scene6-ending.mp3",
    captions: [
      { text: "今すぐ始めましょう", startMs: 0, endMs: 2000 },
    ],
  },
];
```

---

## 3. 処理フロー

### 3.1 全体フロー図

```
┌─────────────────────────────────────────────────────────────┐
│                     処理フロー                               │
└─────────────────────────────────────────────────────────────┘

  [1] Remotion起動
        │
        ▼
  [2] Root.tsx の calculateMetadata が実行される
        │
        ├──→ scenes.ts から sceneConfigs を読み込み
        │
        ├──→ 各シーンの音声ファイルの長さを取得
        │      audio/scene1-title.mp3      → 2.5秒
        │      audio/scene2-main-preview.mp3 → 4.0秒
        │      ...
        │
        ├──→ 秒数をフレーム数に変換（×30fps）
        │      2.5秒 → 75フレーム
        │      4.0秒 → 120フレーム
        │      ...
        │
        ├──→ 各シーンの開始フレームを計算
        │      scene1: startFrame=0
        │      scene2: startFrame=75
        │      scene3: startFrame=195
        │      ...
        │
        └──→ 合計フレーム数を計算 → durationInFrames
        │
        ▼
  [3] CoffeeVideo に props として渡される
        │
        ▼
  [4] 各シーンをレンダリング
        │
        ├──→ <Sequence from={startFrame} duration={durationInFrames}>
        │      ├── <Audio src={audioSrc} />
        │      ├── <SceneComponent />
        │      └── <CaptionOverlay captions={captions} />
        │    </Sequence>
        │
        ▼
  [5] 動画出力
```

### 3.2 calculateMetadata の処理詳細

```typescript
// Root.tsx

import { CalculateMetadataFunction, staticFile } from "remotion";
import { sceneConfigs } from "./data/scenes";
import { getAudioDuration } from "./utils/getAudioDuration";
import { CoffeeVideoProps, SceneWithDuration } from "./types";

const FPS = 30;
const SCENE_PADDING_FRAMES = 15; // シーン間の余白（0.5秒）

export const calculateMetadata: CalculateMetadataFunction<
  CoffeeVideoProps
> = async () => {

  // 1. 各シーンの音声の長さを並列で取得
  const durations = await Promise.all(
    sceneConfigs.map((scene) =>
      getAudioDuration(staticFile(scene.audioSrc))
    )
  );

  // 2. 各シーンのフレーム数と開始フレームを計算
  let currentFrame = 0;
  const scenes: SceneWithDuration[] = sceneConfigs.map((scene, index) => {
    const durationInSeconds = durations[index];
    const durationInFrames = Math.ceil(durationInSeconds * FPS) + SCENE_PADDING_FRAMES;
    const startFrame = currentFrame;

    currentFrame += durationInFrames;

    return {
      ...scene,
      durationInFrames,
      startFrame,
    };
  });

  // 3. 合計フレーム数
  const totalDurationInFrames = currentFrame;

  return {
    durationInFrames: totalDurationInFrames,
    props: { scenes },
  };
};
```

---

## 4. コンポーネント設計

### 4.1 コンポーネント構成図

```
┌─────────────────────────────────────────────────────────────┐
│                   コンポーネント構成                          │
└─────────────────────────────────────────────────────────────┘

  RemotionRoot (Root.tsx)
  │
  └── Composition
       │  calculateMetadata で props を計算
       │
       └── CoffeeVideo (props: { scenes })
            │
            └── scenes.map((scene) => ...)
                 │
                 └── Sequence (from, durationInFrames)
                      │
                      ├── Audio (src: scene.audioSrc)
                      │    音声を再生
                      │
                      ├── SceneComponent (scene.id に応じて切替)
                      │    │  TitleScene
                      │    │  MainPreviewScene
                      │    │  SearchFeatureScene
                      │    │  ChatFeatureScene
                      │    │  SummaryScene
                      │    │  EndingScene
                      │
                      └── CaptionOverlay (captions: scene.captions)
                           │
                           └── captions.map((caption) => ...)
                                │
                                └── Sequence (from, duration)
                                     └── CaptionText (テロップ表示)
```

### 4.2 CaptionOverlay コンポーネント

```typescript
// src/components/CaptionOverlay.tsx

import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { CaptionItem } from "../types";
import { colors } from "../styles/theme";

type Props = {
  captions: CaptionItem[];
};

export const CaptionOverlay: React.FC<Props> = ({ captions }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {captions.map((caption, index) => {
        const startFrame = Math.floor((caption.startMs / 1000) * fps);
        const endFrame = Math.floor((caption.endMs / 1000) * fps);
        const durationInFrames = endFrame - startFrame;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <CaptionText text={caption.text} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const CaptionText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 80,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "#ffffff",
          fontSize: 48,
          fontWeight: 600,
          padding: "16px 32px",
          borderRadius: 8,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
```

### 4.3 CoffeeVideo コンポーネント（変更後）

```typescript
// src/CoffeeVideo.tsx

import { AbsoluteFill, Sequence } from "remotion";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { CoffeeVideoProps, SceneWithDuration } from "./types";
import { CaptionOverlay } from "./components/CaptionOverlay";
import { colors, fonts } from "./styles/theme";

// シーンコンポーネントのマッピング
import { TitleScene } from "./scenes/TitleScene";
import { MainPreviewScene } from "./scenes/MainPreviewScene";
import { SearchFeatureScene } from "./scenes/SearchFeatureScene";
import { ChatFeatureScene } from "./scenes/ChatFeatureScene";
import { SummaryScene } from "./scenes/SummaryScene";
import { EndingScene } from "./scenes/EndingScene";

const sceneComponents: Record<string, React.FC> = {
  title: TitleScene,
  mainPreview: MainPreviewScene,
  searchFeature: SearchFeatureScene,
  chatFeature: ChatFeatureScene,
  summary: SummaryScene,
  ending: EndingScene,
};

export const CoffeeVideo: React.FC<CoffeeVideoProps> = ({ scenes }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        fontFamily: fonts.main,
      }}
    >
      {scenes.map((scene) => {
        const SceneComponent = sceneComponents[scene.id];

        return (
          <Sequence
            key={scene.id}
            from={scene.startFrame}
            durationInFrames={scene.durationInFrames}
            premountFor={30}
          >
            {/* 音声 */}
            <Audio src={staticFile(scene.audioSrc)} />

            {/* 映像 */}
            <SceneComponent />

            {/* テロップ */}
            <CaptionOverlay captions={scene.captions} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

---

## 5. 依存パッケージ

### 5.1 追加が必要なパッケージ

```bash
# 音声再生用
npx remotion add @remotion/media

# テロップ表示用（オプション：TikTokスタイルを使う場合）
npx remotion add @remotion/captions

# 音声の長さ取得用
npm install mediabunny
```

### 5.2 package.json（変更後）

```json
{
  "dependencies": {
    "@remotion/cli": "4.0.242",
    "@remotion/google-fonts": "4.0.242",
    "@remotion/media": "4.0.242",
    "@remotion/captions": "4.0.242",
    "mediabunny": "^1.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "remotion": "4.0.242"
  }
}
```

---

## 6. 実装手順

```
┌─────────────────────────────────────────────────────────────┐
│                      実装手順                                │
└─────────────────────────────────────────────────────────────┘

Phase 1: 準備
├── 1.1 音声ファイルを準備（VOICEVOX等で生成）
├── 1.2 public/audio/ に配置
└── 1.3 パッケージをインストール

Phase 2: 型・データ定義
├── 2.1 src/types/index.ts を作成
└── 2.2 src/data/scenes.ts を作成

Phase 3: ユーティリティ
└── 3.1 src/utils/getAudioDuration.ts を作成

Phase 4: コンポーネント実装
├── 4.1 src/components/CaptionOverlay.tsx を作成
├── 4.2 src/Root.tsx に calculateMetadata を追加
└── 4.3 src/CoffeeVideo.tsx を修正

Phase 5: 動作確認
├── 5.1 npm start でプレビュー確認
├── 5.2 音声・テロップのタイミング調整
└── 5.3 動画出力テスト
```

---

## 7. 音声ファイル仕様

| 項目 | 仕様 |
|------|------|
| フォーマット | MP3 または WAV |
| サンプルレート | 44100Hz 推奨 |
| ビットレート | 128kbps 以上 |
| 命名規則 | `scene{番号}-{シーン名}.mp3` |

---

## 8. 考慮事項

### 8.1 シーン間の余白
- 各シーンの終わりに0.5秒（15フレーム）の余白を設ける
- `SCENE_PADDING_FRAMES` 定数で調整可能

### 8.2 音声ファイルがない場合
- デフォルトの固定長（3秒）を使用するフォールバック処理を追加

### 8.3 テロップのスタイル
- 画面下部に表示
- 半透明の黒背景
- 白文字、48px、太字

---

## 9. ユーティリティ関数

### 9.1 getAudioDuration

```typescript
// src/utils/getAudioDuration.ts

import { Input, ALL_FORMATS, UrlSource } from "mediabunny";

export const getAudioDuration = async (src: string): Promise<number> => {
  try {
    const input = new Input({
      formats: ALL_FORMATS,
      source: new UrlSource(src, {
        getRetryDelay: () => null,
      }),
    });

    const durationInSeconds = await input.computeDuration();
    return durationInSeconds;
  } catch (error) {
    console.warn(`Failed to get duration for ${src}, using default`);
    return 3; // デフォルト3秒
  }
};
```
