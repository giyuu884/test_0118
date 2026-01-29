import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from "remotion";
import { colors, fonts, shadows } from "../styles/theme";

export const MainPreviewScene: React.FC = () => {
  const frame = useCurrentFrame();

  // スクリーンショットのスライドイン (0-30f)
  const slideX = interpolate(frame, [0, 30], [-100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const slideOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // スクロールアニメーション (30-60f)
  const scrollY = interpolate(frame, [30, 60], [0, -80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // ズームイン (60-90f)
  const zoom = interpolate(frame, [60, 90], [1, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* デバイスフレーム */}
      <div
        style={{
          width: 1400,
          height: 850,
          backgroundColor: colors.surface,
          borderRadius: 20,
          boxShadow: shadows.modal,
          overflow: "hidden",
          opacity: slideOpacity,
          transform: `translateX(${slideX}px) scale(${zoom})`,
        }}
      >
        {/* ブラウザヘッダー */}
        <div
          style={{
            height: 50,
            backgroundColor: "#f1f1f1",
            borderBottom: `1px solid ${colors.line}`,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#ff5f57",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#febc2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#28c840",
            }}
          />
          <div
            style={{
              flex: 1,
              marginLeft: 16,
              height: 28,
              backgroundColor: "#fff",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: colors.muted,
              fontFamily: fonts.main,
            }}
          >
            coffee-guide.example.com
          </div>
        </div>

        {/* サイトコンテンツ */}
        <div
          style={{
            height: 800,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              transform: `translateY(${scrollY}px)`,
              padding: 40,
            }}
          >
            {/* ヘッダー */}
            <div style={{ marginBottom: 32, textAlign: "center" }}>
              <p
                style={{
                  fontSize: 14,
                  letterSpacing: "0.3em",
                  color: colors.muted,
                  fontFamily: fonts.main,
                  textTransform: "uppercase",
                }}
              >
                Coffee Beans Guide
              </p>
              <h1
                style={{
                  fontSize: 48,
                  fontFamily: fonts.main,
                  fontWeight: fonts.weight.bold,
                  color: colors.text,
                  margin: "12px 0",
                }}
              >
                コーヒー豆ビギナーズガイド
              </h1>
              <p
                style={{
                  fontSize: 18,
                  color: colors.muted,
                  fontFamily: fonts.main,
                }}
              >
                代表的な豆を「酸味・味の濃さ・焙煎度」を10段階でまとめました。
              </p>
            </div>

            {/* カードグリッド */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 20,
              }}
            >
              {["ブラジル", "コロンビア", "グアテマラ", "エチオピア"].map(
                (name, i) => (
                  <CoffeeCard key={name} name={name} index={i} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CoffeeCard: React.FC<{ name: string; index: number }> = ({
  name,
  index,
}) => {
  const regions: Record<string, string> = {
    ブラジル: "南米",
    コロンビア: "南米",
    グアテマラ: "中米",
    エチオピア: "アフリカ",
  };

  const descriptions: Record<string, string> = {
    ブラジル: "バランス型。ナッツの雰囲気で飲みやすい。",
    コロンビア: "カシスや赤ワインのような豊潤さ。万能タイプ。",
    グアテマラ: "ピスタチオのようなナッツ感とクリーンさ。",
    エチオピア: "紅茶のように華やか。フローラルな香り。",
  };

  const ratings: Record<string, number[]> = {
    ブラジル: [3, 6, 6],
    コロンビア: [5, 6, 6],
    グアテマラ: [5, 6, 5],
    エチオピア: [8, 4, 5],
  };

  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.line}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: shadows.card,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            fontSize: 20,
            fontFamily: fonts.main,
            fontWeight: fonts.weight.semibold,
            color: colors.text,
            margin: 0,
          }}
        >
          {name}
        </h3>
        <span
          style={{
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 999,
            backgroundColor: colors.accentSoft,
            color: "#5f4b39",
            fontWeight: fonts.weight.semibold,
            fontFamily: fonts.main,
          }}
        >
          {regions[name]}
        </span>
      </div>
      <p
        style={{
          fontSize: 14,
          color: colors.muted,
          fontFamily: fonts.main,
          marginBottom: 16,
        }}
      >
        {descriptions[name]}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {["酸味", "味の濃さ", "焙煎度"].map((label, i) => (
          <RatingBar
            key={label}
            label={label}
            value={ratings[name][i]}
          />
        ))}
      </div>
    </div>
  );
};

const RatingBar: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "70px 1fr 24px",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
      color: "#3f3f3f",
      fontFamily: fonts.main,
    }}
  >
    <span>{label}</span>
    <div
      style={{
        height: 8,
        borderRadius: 999,
        backgroundColor: "#f1efec",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${value * 10}%`,
          height: "100%",
          background: "linear-gradient(90deg, #c6905f, #9c6a3f)",
          borderRadius: 999,
        }}
      />
    </div>
    <span style={{ fontWeight: 600, color: "#5b4632" }}>{value}</span>
  </div>
);
