import { SceneConfig } from "../types";

export const sceneConfigs: SceneConfig[] = [
  {
    id: "title",
    name: "タイトル",
    audioSrc: "audio/scene1-title.mp3",
    captions: [
      { text: "コーヒー豆ビギナーズガイドへ", startMs: 0, endMs: 1200 },
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
    captions: [{ text: "今すぐ始めましょう", startMs: 0, endMs: 2000 }],
  },
];
