import { AbsoluteFill, Sequence } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { MainPreviewScene } from "./scenes/MainPreviewScene";
import { SearchFeatureScene } from "./scenes/SearchFeatureScene";
import { ChatFeatureScene } from "./scenes/ChatFeatureScene";
import { SummaryScene } from "./scenes/SummaryScene";
import { EndingScene } from "./scenes/EndingScene";
import { colors, fonts } from "./styles/theme";

export const CoffeeVideo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        fontFamily: fonts.main,
      }}
    >
      {/* シーン1: タイトル (0:00-0:03) */}
      <Sequence from={0} durationInFrames={90}>
        <TitleScene />
      </Sequence>

      {/* シーン2: メイン画面紹介 (0:03-0:06) */}
      <Sequence from={90} durationInFrames={90}>
        <MainPreviewScene />
      </Sequence>

      {/* シーン3: 検索機能 (0:06-0:09) */}
      <Sequence from={180} durationInFrames={90}>
        <SearchFeatureScene />
      </Sequence>

      {/* シーン4: AIチャット (0:09-0:14) */}
      <Sequence from={270} durationInFrames={150}>
        <ChatFeatureScene />
      </Sequence>

      {/* シーン5: 特徴まとめ (0:14-0:16) */}
      <Sequence from={420} durationInFrames={60}>
        <SummaryScene />
      </Sequence>

      {/* シーン6: エンディング (0:16-0:18) */}
      <Sequence from={480} durationInFrames={60}>
        <EndingScene />
      </Sequence>
    </AbsoluteFill>
  );
};
