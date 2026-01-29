import { loadFont } from "@remotion/google-fonts/Inter";

// フォントをロード
const { fontFamily } = loadFont();

export const colors = {
  bg: "#f6f5f2",
  surface: "#ffffff",
  text: "#1c1c1c",
  muted: "#6a6a6a",
  accent: "#b57c4d",
  accentSoft: "#f2e7dc",
  line: "#e6e2dd",
  accentGradient: "linear-gradient(135deg, #c6905f, #9c6a3f)",
};

export const fonts = {
  main: fontFamily,
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const shadows = {
  card: "0 14px 40px rgba(0, 0, 0, 0.06)",
  modal: "0 20px 60px rgba(0, 0, 0, 0.2)",
};
