/** テロップ1件の定義 */
export type CaptionItem = {
  text: string;
  startMs: number;
  endMs: number;
};

/** シーン1つの設定 */
export type SceneConfig = {
  id: string;
  name: string;
  audioSrc: string;
  captions: CaptionItem[];
};

/** 計算後のシーン情報（durationを含む） */
export type SceneWithDuration = SceneConfig & {
  durationInFrames: number;
  startFrame: number;
};

/** CoffeeVideoコンポーネントに渡すprops */
export type CoffeeVideoProps = {
  scenes: SceneWithDuration[];
};
