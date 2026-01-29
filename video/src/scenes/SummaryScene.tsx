import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { colors, fonts } from "../styles/theme";

export const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { icon: "☕", text: "20種類のコーヒー豆", delay: 0 },
    { icon: "📊", text: "3つの評価軸で比較", delay: 20 },
    { icon: "🤖", text: "AIアシスタント搭載", delay: 40 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #fff 0%, #f6f1ea 100%)",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {/* タイトル */}
      <h2
        style={{
          fontSize: 36,
          fontFamily: fonts.main,
          fontWeight: fonts.weight.medium,
          color: colors.muted,
          margin: 0,
          marginBottom: 24,
          opacity: interpolate(frame, [0, 15], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        3つの特徴
      </h2>

      {/* キーポイント */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {items.map((item, i) => {
          const itemFrame = frame - item.delay;

          const x = interpolate(itemFrame, [0, 20], [80, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const opacity = interpolate(itemFrame, [0, 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const scale = spring({
            frame: itemFrame,
            fps,
            config: { damping: 15, mass: 0.5 },
          });

          return (
            <div
              key={item.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "24px 48px",
                backgroundColor: colors.surface,
                borderRadius: 20,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                border: `1px solid ${colors.line}`,
                opacity,
                transform: `translateX(${x}px) scale(${Math.min(scale, 1)})`,
              }}
            >
              <span style={{ fontSize: 48 }}>{item.icon}</span>
              <span
                style={{
                  fontSize: 32,
                  fontFamily: fonts.main,
                  fontWeight: fonts.weight.semibold,
                  color: colors.text,
                }}
              >
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
