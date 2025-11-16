import { elevenlabs, generateAudio } from "@synthome/sdk";

console.log("Testing ElevenLabs import...");

const model = elevenlabs("elevenlabs/turbo-v2.5", {
  apiKey: "test",
});

console.log("✓ elevenlabs() works");
console.log("Model:", model);

const operation = generateAudio({
  model,
  text: "Hello world",
  voiceId: "test-voice",
});

console.log("✓ generateAudio() works");
console.log("Operation:", operation);
