import { SceneConfig } from "../types";

export const sceneConfigs: SceneConfig[] = [
  {
    id: "title",
    name: "タイトル",
    audioSrc: "audio/scene1-title.wav",
    captions: [
      { text: "コーヒー豆ビギナーズガイドへ", startMs: 0, endMs: 1200 },
      { text: "ようこそなのだ！", startMs: 1200, endMs: 2500 },
    ],
  },
  {
    id: "mainPreview",
    name: "メイン画面紹介",
    audioSrc: "audio/scene2-main-preview.wav",
    captions: [
      { text: "アプリの画面はこちらなのだ", startMs: 0, endMs: 1500 },
      { text: "シンプルで使いやすいのだ！", startMs: 1500, endMs: 3500 },
    ],
  },
  {
    id: "searchFeature",
    name: "検索機能",
    audioSrc: "audio/scene3-search.wav",
    captions: [
      { text: "検索機能で", startMs: 0, endMs: 1000 },
      { text: "好みのコーヒー豆を", startMs: 1000, endMs: 2000 },
      { text: "簡単に見つけられるのだ！", startMs: 2000, endMs: 3500 },
    ],
  },
  {
    id: "chatFeature",
    name: "AIチャット",
    audioSrc: "audio/scene4-chat.wav",
    captions: [
      { text: "AIチャットで", startMs: 0, endMs: 1200 },
      { text: "ぴったりの豆を", startMs: 1200, endMs: 2500 },
      { text: "提案するのだ！", startMs: 2500, endMs: 4000 },
    ],
  },
  {
    id: "summary",
    name: "特徴まとめ",
    audioSrc: "audio/scene5-summary.wav",
    captions: [
      { text: "検索、チャット、お気に入り", startMs: 0, endMs: 2000 },
      { text: "3つの機能で快適なのだ！", startMs: 2000, endMs: 3500 },
    ],
  },
  {
    id: "ending",
    name: "エンディング",
    audioSrc: "audio/scene6-ending.wav",
    captions: [{ text: "今すぐ始めるのだ！", startMs: 0, endMs: 2000 }],
  },
];
