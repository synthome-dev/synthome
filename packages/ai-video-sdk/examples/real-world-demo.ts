import {
  addSubtitles,
  compose,
  generateVideo,
  lipSync,
  merge,
  reframe,
  replicate,
} from "../src/index.js";

const productDemo = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Hero shot of smartphone on marble surface, cinematic lighting",
    duration: 3,
    aspectRatio: "16:9",
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Close-up of phone screen showing app interface, smooth animation",
    duration: 4,
    aspectRatio: "16:9",
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Person using phone outdoors, natural lighting, happy expression",
    duration: 3,
    aspectRatio: "16:9",
  }),
  merge({ transition: "crossfade" }),
  lipSync({ audioUrl: "https://cdn.example.com/voiceover.mp3" }),
  addSubtitles({ language: "en", style: "bold" }),
);

const createSocialMediaVariants = () => {
  const baseScenes = [
    generateVideo({
      model: replicate("bytedance/seedance-1-pro"),
      prompt: "Hero shot of smartphone on marble surface, cinematic lighting",
      duration: 3,
      aspectRatio: "16:9",
    }),
    generateVideo({
      model: replicate("bytedance/seedance-1-pro"),
      prompt:
        "Close-up of phone screen showing app interface, smooth animation",
      duration: 4,
      aspectRatio: "16:9",
    }),
    generateVideo({
      model: replicate("bytedance/seedance-1-pro"),
      prompt: "Person using phone outdoors, natural lighting, happy expression",
      duration: 3,
      aspectRatio: "16:9",
    }),
  ];

  const instagramReel = compose(
    ...baseScenes,
    merge({ transition: "crossfade" }),
    lipSync({ audioUrl: "https://cdn.example.com/voiceover.mp3" }),
    addSubtitles({ language: "en", style: "bold" }),
    reframe({ aspectRatio: "9:16" }),
  );

  const linkedinSquare = compose(
    ...baseScenes,
    merge({ transition: "crossfade" }),
    lipSync({ audioUrl: "https://cdn.example.com/voiceover.mp3" }),
    addSubtitles({ language: "en", style: "bold" }),
    reframe({ aspectRatio: "1:1" }),
  );

  return {
    instagram: instagramReel,
    linkedin: linkedinSquare,
  };
};

const socialMediaVariants = createSocialMediaVariants();

console.log("=== Product Demo Pipeline ===\n");
console.log(JSON.stringify(productDemo.toJSON(), null, 2));

console.log("\n\n=== Instagram Reel Variant ===\n");
console.log(JSON.stringify(socialMediaVariants.instagram.toJSON(), null, 2));

console.log("\n\n=== LinkedIn Square Variant ===\n");
console.log(JSON.stringify(socialMediaVariants.linkedin.toJSON(), null, 2));

console.log("\n\n💡 Usage Example:");
console.log(`
// Execute all variants in parallel
const results = await Promise.all([
  socialMediaVariants.instagram.execute({ apiKey: "..." }),
  socialMediaVariants.linkedin.execute({ apiKey: "..." })
]);

// With progress tracking
socialMediaVariants.instagram.onProgress((status) => {
  console.log(\`Instagram: \${status.progress}%\`);
});

await socialMediaVariants.instagram.execute();
`);
