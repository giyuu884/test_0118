import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { CaptionItem } from "../types";

type Props = {
  captions: CaptionItem[];
};

export const CaptionOverlay: React.FC<Props> = ({ captions }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {captions.map((caption, index) => {
        const startFrame = Math.floor((caption.startMs / 1000) * fps);
        const endFrame = Math.floor((caption.endMs / 1000) * fps);
        const durationInFrames = endFrame - startFrame;

        if (durationInFrames <= 0) {
          return null;
        }

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <CaptionText text={caption.text} durationInFrames={durationInFrames} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const FADE_FRAMES = 8;

const CaptionText: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, FADE_FRAMES, durationInFrames - FADE_FRAMES, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 80,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          color: "#ffffff",
          fontSize: 48,
          fontWeight: 600,
          padding: "16px 32px",
          borderRadius: 8,
          opacity,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
