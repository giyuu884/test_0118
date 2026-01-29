import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { colors, fonts, shadows } from "../styles/theme";
import { ChatBubble } from "../components/ChatBubble";

export const ChatFeatureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // チャットモーダルのスライドイン (0-30f)
  const slideX = interpolate(frame, [0, 30], [400, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const modalOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 説明テキストのフェードイン (120-150f)
  const textOpacity = interpolate(frame, [120, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [120, 140], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "flex-end",
      }}
    >
      {/* チャットモーダル */}
      <div
        style={{
          width: 480,
          height: "100%",
          backgroundColor: colors.surface,
          display: "flex",
          flexDirection: "column",
          opacity: modalOpacity,
          transform: `translateX(${slideX}px)`,
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: `1px solid ${colors.line}`,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontFamily: fonts.main,
              fontWeight: fonts.weight.semibold,
              color: colors.text,
              margin: 0,
            }}
          >
            コーヒー豆くんとチャット
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

        {/* チャットメッセージ */}
        <div
          style={{
            flex: 1,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            overflow: "hidden",
          }}
        >
          {/* ユーザーメッセージ (30-60f) */}
          <ChatBubble
            message="初心者におすすめの豆は？"
            isUser={true}
            startFrame={30}
            typewriter={true}
            typewriterDuration={30}
          />

          {/* コーヒー豆くんの返答 (60-120f) */}
          <ChatBubble
            message="ブラジル産がおすすめなのだ！バランスが良く、酸味も控えめで飲みやすいのだ"
            isUser={false}
            startFrame={60}
            typewriter={true}
            typewriterDuration={50}
          />
        </div>

        {/* 入力エリア */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: 20,
            borderTop: `1px solid ${colors.line}`,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "14px 20px",
              border: `2px solid ${colors.accent}`,
              borderRadius: 999,
              fontSize: 16,
              fontFamily: fonts.main,
              color: colors.muted,
            }}
          >
            メッセージを入力...
          </div>
          <button
            style={{
              padding: "14px 24px",
              backgroundColor: colors.accent,
              color: "#fff",
              fontSize: 16,
              fontFamily: fonts.main,
              fontWeight: fonts.weight.semibold,
              border: "none",
              borderRadius: 999,
            }}
          >
            送信
          </button>
        </div>
      </div>

      {/* 説明テキスト */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 200,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <p
          style={{
            fontSize: 42,
            fontFamily: fonts.main,
            fontWeight: fonts.weight.bold,
            color: "#fff",
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            margin: 0,
          }}
        >
          AIがあなたの疑問に答えます
        </p>
      </div>
    </AbsoluteFill>
  );
};
