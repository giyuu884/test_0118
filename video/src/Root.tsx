import { Composition } from "remotion";
import { CoffeeVideo } from "./CoffeeVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CoffeeVideo"
      component={CoffeeVideo}
      durationInFrames={540}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
