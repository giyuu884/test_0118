import { Input, ALL_FORMATS, UrlSource } from "mediabunny";

const DEFAULT_DURATION = 3; // デフォルト3秒

export const getAudioDuration = async (src: string): Promise<number> => {
  try {
    const input = new Input({
      formats: ALL_FORMATS,
      source: new UrlSource(src, {
        getRetryDelay: () => null,
      }),
    });

    const durationInSeconds = await input.computeDuration();
    return durationInSeconds;
  } catch (error) {
    console.warn(`Failed to get duration for ${src}, using default ${DEFAULT_DURATION}s`);
    return DEFAULT_DURATION;
  }
};
