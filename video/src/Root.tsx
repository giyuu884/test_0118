import { Composition, CalculateMetadataFunction, staticFile } from "remotion";
import { CoffeeVideo } from "./CoffeeVideo";
import { sceneConfigs } from "./data/scenes";
import { getAudioDuration } from "./utils/getAudioDuration";
import { CoffeeVideoProps, SceneWithDuration } from "./types";

const FPS = 30;
const SCENE_PADDING_FRAMES = 15; // シーン間の余白（0.5秒）

const calculateMetadata: CalculateMetadataFunction<CoffeeVideoProps> = async ({
  abortSignal,
}) => {
  // 各シーンの音声の長さを並列で取得
  const durations = await Promise.all(
    sceneConfigs.map((scene) => getAudioDuration(staticFile(scene.audioSrc)))
  );

  // abortSignalをチェック
  if (abortSignal?.aborted) {
    throw new Error("Calculation aborted");
  }

  // 各シーンのフレーム数と開始フレームを計算
  let currentFrame = 0;
  const scenes: SceneWithDuration[] = sceneConfigs.map((scene, index) => {
    const durationInSeconds = durations[index];
    const durationInFrames =
      Math.ceil(durationInSeconds * FPS) + SCENE_PADDING_FRAMES;
    const startFrame = currentFrame;

    currentFrame += durationInFrames;

    return {
      ...scene,
      durationInFrames,
      startFrame,
    };
  });

  // 合計フレーム数
  const totalDurationInFrames = currentFrame;

  return {
    durationInFrames: totalDurationInFrames,
    props: { scenes },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CoffeeVideo"
      component={CoffeeVideo}
      durationInFrames={540}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ scenes: [] }}
      calculateMetadata={calculateMetadata}
    />
  );
};
