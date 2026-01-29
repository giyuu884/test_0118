import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { colors, fonts } from "../styles/theme";

export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // キャッチコピーのフェードイン (0-30f)
  const catchOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const catchScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  // URLの表示 (30-50f)
  const urlOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlY = interpolate(frame, [30, 45], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // 全体のフェードアウト (50-60f)
  const fadeOut = interpolate(frame, [50, 60], [1, 0], {
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
        gap: 40,
        opacity: fadeOut,
      }}
    >
      {/* コーヒーアイコン */}
      <div
        style={{
          fontSize: 80,
          opacity: catchOpacity,
        }}
      >
        ☕
      </div>

      {/* キャッチコピー */}
      <h1
        style={{
          fontSize: 64,
          fontFamily: fonts.main,
          fontWeight: fonts.weight.bold,
          color: colors.text,
          margin: 0,
          opacity: catchOpacity,
          transform: `scale(${catchScale})`,
          textAlign: "center",
        }}
      >
        はじめてのコーヒー選びに
      </h1>

      {/* URL */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
        }}
      >
        <p
          style={{
            fontSize: 28,
            fontFamily: fonts.main,
            fontWeight: fonts.weight.medium,
            color: colors.accent,
            margin: 0,
            padding: "12px 32px",
            backgroundColor: colors.accentSoft,
            borderRadius: 999,
          }}
        >
          coffee-guide.example.com
        </p>
        <p
          style={{
            fontSize: 18,
            fontFamily: fonts.main,
            fontWeight: fonts.weight.regular,
            color: colors.muted,
            margin: 0,
          }}
        >
          今すぐアクセス
        </p>
      </div>
    </AbsoluteFill>
  );
};
