import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles/theme";

type ChatBubbleProps = {
  message: string;
  isUser: boolean;
  startFrame?: number;
  typewriter?: boolean;
  typewriterDuration?: number;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  startFrame = 0,
  typewriter = false,
  typewriterDuration = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  // 出現アニメーション
  const scale = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 15, mass: 0.5 },
  });

  const opacity = interpolate(relativeFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // タイプライター効果
  let displayMessage = message;
  if (typewriter && relativeFrame >= 0) {
    const charsToShow = Math.floor(
      interpolate(relativeFrame, [0, typewriterDuration], [0, message.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
    displayMessage = message.slice(0, charsToShow);
  }

  const bubbleStyle: React.CSSProperties = {
    maxWidth: "70%",
    padding: "14px 20px",
    borderRadius: 20,
    fontSize: 24,
    lineHeight: 1.5,
    fontFamily: fonts.main,
    fontWeight: fonts.weight.regular,
    opacity,
    transform: `scale(${scale})`,
    ...(isUser
      ? {
          alignSelf: "flex-end",
          backgroundColor: colors.accent,
          color: "#fff",
          borderBottomRightRadius: 6,
        }
      : {
          alignSelf: "flex-start",
          backgroundColor: colors.accentSoft,
          color: colors.text,
          borderBottomLeftRadius: 6,
        }),
  };

  return <div style={bubbleStyle}>{displayMessage}</div>;
};
