import {
  addSubtitles,
  compose,
  generateVideo,
  lipSync,
  merge,
  replicate,
} from "../src/index.js";

console.log("=== Execution with Dependencies Demo ===\n");

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

console.log("1. Base Product Demo JSON:");
console.log(JSON.stringify(productDemo.toJSON(), null, 2));
console.log("");

const frenchPipeline = compose(
  productDemo,
  lipSync({ audioUrl: "https://example.com/french.mp3" }),
  addSubtitles({ language: "fr" }),
);

console.log(
  "2. French Version JSON (would include baseExecutionId at execution time):",
);
const frenchPlan = frenchPipeline.toJSON();
const frenchPayload = {
  ...frenchPlan,
  baseExecutionId: "exec_base_123",
  webhook: {
    url: "https://api.example.com/webhook/french",
    secret: "secret123",
  },
};
console.log(JSON.stringify(frenchPayload, null, 2));
console.log("");

console.log("3. Backend Processing Flow:");
console.log("   Step 1: Client executes base pipeline");
console.log("     POST /api/execute");
console.log("     Body: { jobs: [...] }");
console.log("     Response: { executionId: 'exec_base_123' }");
console.log("");
console.log("   Step 2: Client executes French variant");
console.log("     POST /api/execute");
console.log("     Body: {");
console.log("       jobs: [...],");
console.log("       baseExecutionId: 'exec_base_123',");
console.log("       webhook: { url: '...', secret: '...' }");
console.log("     }");
console.log("     Response: { executionId: 'exec_french_456' }");
console.log("");
console.log("   Step 3: Backend creates jobs");
console.log("     - Finds base execution 'exec_base_123'");
console.log("     - Gets final job from base: 'job4' (the merge)");
console.log("     - Creates French jobs that depend on 'job4'");
console.log("     - Jobs wait for base to complete");
console.log("");
console.log("   Step 4: When French pipeline completes");
console.log("     - Backend POSTs to webhook:");
console.log("     {");
console.log('       "executionId": "exec_french_456",');
console.log('       "status": "completed",');
console.log('       "video": {');
console.log('         "url": "https://cdn.example.com/french-video.mp4",');
console.log('         "duration": 9,');
console.log('         "aspectRatio": "16:9"');
console.log("       }");
console.log("     }");
console.log("");

console.log("=== Example Client Usage ===\n");
console.log("```typescript");
console.log("// Execute base");
console.log("const baseExec = await productDemo.execute();");
console.log("console.log(baseExec.id); // 'exec_base_123'");
console.log("");
console.log("// Execute variants with webhooks");
console.log("await frenchPipeline.execute({");
console.log("  baseExecutionId: baseExec.id,");
console.log("  webhook: 'https://api.example.com/webhook/french',");
console.log("});");
console.log("");
console.log("await spanishPipeline.execute({");
console.log("  baseExecutionId: baseExec.id,");
console.log("  webhook: 'https://api.example.com/webhook/spanish',");
console.log("});");
console.log("");
console.log("// Backend handles:");
console.log("// 1. Execute base jobs");
console.log("// 2. When base completes, start French & Spanish in parallel");
console.log("// 3. Send webhooks when each variant completes");
console.log("```");
console.log("");
console.log("✅ Execution dependency system ready for backend implementation!");
