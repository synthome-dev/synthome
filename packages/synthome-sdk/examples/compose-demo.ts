import {
  addSubtitles,
  compose,
  generateVideo,
  lipSync,
  merge,
  reframe,
  replicate,
} from "../src/index.js";

console.log("=== Test 1: Simple Pipeline ===");
const simple = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A skier glides over snow",
    duration: 5,
    aspectRatio: "16:9",
  }),
  reframe({ aspectRatio: "9:16" }),
  addSubtitles(),
);


console.log(JSON.stringify(simple.toJSON(), null, 2));

console.log("\n=== Test 2: Multiple Scenes with Merge ===");
const multiScene = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Scene 1",
    duration: 5,
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Scene 2",
    duration: 5,
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Scene 3",
    duration: 5,
  }),
  merge({ transition: "crossfade" }),
  lipSync({ audioUrl: "https://example.com/audio.mp3" }),
);

console.log(JSON.stringify(multiScene.toJSON(), null, 2));

console.log(
  "\n=== Test 3: PIPELINE REUSE - Product Demo with Different Languages ===",
);

const productDemo = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Product showcase scene 1",
    duration: 3,
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Product showcase scene 2",
    duration: 3,
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Product showcase scene 3",
    duration: 3,
  }),
  merge({ transition: "crossfade" }),
);

console.log("Base Product Demo:");
console.log(JSON.stringify(productDemo.toJSON(), null, 2));

const frenchVersion = compose(
  productDemo,
  lipSync({ audioUrl: "https://example.com/french.mp3" }),
  addSubtitles({ language: "fr" }),
);

const spanishVersion = compose(
  productDemo,
  lipSync({ audioUrl: "https://example.com/spanish.mp3" }),
  addSubtitles({ language: "es" }),
);

const germanVersion = compose(
  productDemo,
  lipSync({ audioUrl: "https://example.com/german.mp3" }),
  addSubtitles({ language: "de" }),
);

console.log("\nFrench Version (extends productDemo):");
console.log(JSON.stringify(frenchVersion.toJSON(), null, 2));

console.log("\nSpanish Version (extends productDemo):");
console.log(JSON.stringify(spanishVersion.toJSON(), null, 2));

console.log("\nGerman Version (extends productDemo):");
console.log(JSON.stringify(germanVersion.toJSON(), null, 2));

console.log("\n✅ Pipeline Reuse Works!");
console.log(
  "You can now create a base pipeline and extend it in multiple ways.",
);
