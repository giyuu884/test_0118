import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TitleScene } from "./scenes/TitleScene";
import { MainPreviewScene } from "./scenes/MainPreviewScene";
import { SearchFeatureScene } from "./scenes/SearchFeatureScene";
import { ChatFeatureScene } from "./scenes/ChatFeatureScene";
import { SummaryScene } from "./scenes/SummaryScene";
import { EndingScene } from "./scenes/EndingScene";
import { CaptionOverlay } from "./components/CaptionOverlay";
import { colors, fonts } from "./styles/theme";
import { CoffeeVideoProps } from "./types";

// シーンコンポーネントのマッピング
const sceneComponents: Record<string, React.FC> = {
  title: TitleScene,
  mainPreview: MainPreviewScene,
  searchFeature: SearchFeatureScene,
  chatFeature: ChatFeatureScene,
  summary: SummaryScene,
  ending: EndingScene,
};

export const CoffeeVideo: React.FC<CoffeeVideoProps> = ({ scenes }) => {
  // scenesが空の場合（defaultProps）はフォールバック表示
  if (!scenes || scenes.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: colors.bg,
          fontFamily: fonts.main,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ color: colors.muted, fontSize: 24 }}>
          Loading scenes...
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        fontFamily: fonts.main,
      }}
    >
      {scenes.map((scene) => {
        const SceneComponent = sceneComponents[scene.id];

        if (!SceneComponent) {
          console.warn(`Unknown scene id: ${scene.id}`);
          return null;
        }

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
