import { interpolate, useCurrentFrame } from "remotion";
import { colors, fonts } from "../styles/theme";

type AnimatedTextProps = {
  text: string;
  startFrame?: number;
  duration?: number;
  style?: React.CSSProperties;
  type?: "fadeIn" | "typewriter" | "slideUp";
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  startFrame = 0,
  duration = 30,
  style,
  type = "fadeIn",
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  if (type === "typewriter") {
    const charsToShow = Math.floor(
      interpolate(relativeFrame, [0, duration], [0, text.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
    const displayText = text.slice(0, charsToShow);
    const showCursor = relativeFrame < duration + 10;

    return (
      <span style={{ ...style }}>
        {displayText}
        {showCursor && (
          <span
            style={{
              opacity: Math.floor(relativeFrame / 8) % 2 === 0 ? 1 : 0,
              color: colors.accent,
            }}
          >
            |
          </span>
        )}
      </span>
    );
  }

  if (type === "slideUp") {
    const opacity = interpolate(relativeFrame, [0, duration * 0.6], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const translateY = interpolate(relativeFrame, [0, duration], [30, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <span
        style={{
          ...style,
          opacity,
          transform: `translateY(${translateY}px)`,
          display: "inline-block",
        }}
      >
        {text}
      </span>
    );
  }

  // fadeIn
  const opacity = interpolate(relativeFrame, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <span style={{ ...style, opacity }}>{text}</span>;
};
