import {
  type CaptionPresetStrategy,
  CaptionTrack,
  FontManager,
  type RelativePoint,
  TextClip,
  Timestamp,
  Transcript,
} from "@diffusionstudio/core";

export class TikTokCaptionPreset implements CaptionPresetStrategy {
  public readonly type = "caption";
  public readonly position: RelativePoint = { x: "50%", y: "75%" };

  public async apply(
    track: CaptionTrack,
    transcript: Transcript,
    offset: Timestamp
  ): Promise<void> {
    try {
      // Get FontManager from the global core object in browser context
      const { FontManager: FM, TextClip: TC } = (typeof window !==
        "undefined" &&
        (window as any).core) || { FontManager, TextClip };

      const font = await FM.load({
        family: "Inter",
        source:
          "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fjbvMwCp50BTca1ZL7W0Q5nw.woff2",
        weight: "700",
      });

      // iter accepts the config parameters count, duration, length
      // count: determines the number of words in a group
      // duration: determines the duration of a group
      // length: determines the number of characters in a group
      // use a range of values to randomize the output e.g. [2, 6]
      for (const words of Array.from(transcript.iter({ count: [1] }))) {
        await track.add(
          new TC({
            text: words.text,
            delay: words.start.add(offset),
            duration: words.duration,
            font,
            align: "left",
            baseline: "top",
            color: "#FFFFFF",
            leading: 1.4,
            fontSize: 16,
            stroke: {
              color: "#000000",
              width: 4,
              lineJoin: "round",
            },
            // shadow: {
            //   color: "#000000",
            //   blur: 3,
            //   opacity: 80,
            //   offsetX: 1.25,
            //   offsetY: 1.25,
            // },
            position: this.position,
          })
        );
      }
    } catch (error) {
      console.error("Error in TikTokCaptionPreset.apply:", error);
      throw error;
    }
  }

  public async applyTo(track: CaptionTrack): Promise<void> {
    // This is a minimal implementation since we handle the transcript directly in use-seed.ts
    await this.apply(track, new Transcript([]), new Timestamp(0));
  }
}
