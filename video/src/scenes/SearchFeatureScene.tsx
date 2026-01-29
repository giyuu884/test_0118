import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { colors, fonts, shadows } from "../styles/theme";

export const SearchFeatureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // モーダルの表示 (0-30f)
  const modalScale = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.5 },
  });
  const modalOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ハイライトアニメーション (30-60f)
  const highlightIndex = Math.floor(
    interpolate(frame, [30, 60], [0, 3], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // テキストのフェードイン (60-90f)
  const textOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [60, 80], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const criteria = [
    { label: "酸味", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], selected: 5 },
    { label: "味の濃さ", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], selected: 6 },
    { label: "焙煎度", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], selected: 7 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* 検索モーダル */}
      <div
        style={{
          width: 600,
          backgroundColor: colors.surface,
          borderRadius: 20,
          boxShadow: shadows.modal,
          opacity: modalOpacity,
          transform: `scale(${modalScale})`,
          overflow: "hidden",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px 28px 16px",
            borderBottom: `1px solid ${colors.line}`,
          }}
        >
          <h2
            style={{
              fontSize: 24,
              fontFamily: fonts.main,
              fontWeight: fonts.weight.semibold,
              color: colors.text,
              margin: 0,
            }}
          >
            コーヒー豆を検索
          </h2>
          <div
            style={{
              width: 36,
              height: 36,
              backgroundColor: colors.accentSoft,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              color: "#5f4b39",
            }}
          >
            ×
          </div>
        </div>

        {/* 検索条件 */}
        <div style={{ padding: "24px 28px" }}>
          {criteria.map((criterion, criterionIndex) => (
            <div key={criterion.label} style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 16,
                  fontFamily: fonts.main,
                  fontWeight: fonts.weight.semibold,
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                {criterion.label}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {criterion.values.map((value) => {
                  const isSelected = value === criterion.selected;
                  const isHighlighted =
                    criterionIndex === highlightIndex && isSelected;

                  return (
                    <div
                      key={value}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontFamily: fonts.main,
                        fontWeight: fonts.weight.medium,
                        transition: "all 0.2s",
                        ...(isSelected
                          ? {
                              backgroundColor: colors.accent,
                              color: "#fff",
                              border: `2px solid ${colors.accent}`,
                              transform: isHighlighted ? "scale(1.15)" : "scale(1)",
                              boxShadow: isHighlighted
                                ? "0 4px 12px rgba(181, 124, 77, 0.4)"
                                : "none",
                            }
                          : {
                              backgroundColor: colors.surface,
                              color: colors.text,
                              border: `2px solid ${colors.line}`,
                            }),
                      }}
                    >
                      {value}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            padding: "16px 28px 24px",
            borderTop: `1px solid ${colors.line}`,
          }}
        >
          <button
            style={{
              padding: "14px 28px",
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize: 16,
              fontFamily: fonts.main,
              fontWeight: fonts.weight.medium,
              border: `2px solid ${colors.line}`,
              borderRadius: 10,
            }}
          >
            戻る
          </button>
          <button
            style={{
              padding: "14px 28px",
              background: "linear-gradient(135deg, #c6905f, #9c6a3f)",
              color: "#fff",
              fontSize: 16,
              fontFamily: fonts.main,
              fontWeight: fonts.weight.semibold,
              border: "none",
              borderRadius: 10,
            }}
          >
            検索する
          </button>
        </div>
      </div>

      {/* 説明テキスト */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: "50%",
          transform: `translateX(-50%) translateY(${textY}px)`,
          opacity: textOpacity,
        }}
      >
        <p
          style={{
            fontSize: 36,
            fontFamily: fonts.main,
            fontWeight: fonts.weight.semibold,
            color: "#fff",
            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            margin: 0,
          }}
        >
          好みの条件で豆を探せる
        </p>
      </div>
    </AbsoluteFill>
  );
};
