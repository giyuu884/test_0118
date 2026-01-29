import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../styles/theme";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // コーヒーカップアイコンのフェードイン (0-30f)
  const iconOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const iconScale = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.8 },
  });

  // タイトルのスプリングアニメーション (30-60f)
  const titleProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, mass: 0.5 },
  });
  const titleOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // サブタイトルのフェードイン (60-90f)
  const subOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [60, 90], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #fff 0%, #f6f1ea 100%)",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* コーヒーカップアイコン */}
      <div
        style={{
          fontSize: 120,
          opacity: iconOpacity,
          transform: `scale(${iconScale})`,
        }}
      >
        ☕
      </div>

      {/* メインタイトル */}
      <h1
        style={{
          fontSize: 72,
          fontFamily: fonts.main,
          fontWeight: fonts.weight.bold,
          color: colors.text,
          margin: 0,
          opacity: titleOpacity,
          transform: `scale(${titleProgress})`,
        }}
      >
        コーヒー豆ビギナーズガイド
      </h1>

      {/* サブタイトル */}
      <p
        style={{
          fontSize: 32,
          fontFamily: fonts.main,
          fontWeight: fonts.weight.medium,
          color: colors.muted,
          margin: 0,
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
        }}
      >
        あなたの好みの豆が見つかる
      </p>
    </AbsoluteFill>
  );
};
