// import {
//   compose,
//   executeFromPlan,
//   fal,
//   generateAudio,
//   generateImage,
//   generateVideo,
//   merge,
//   replicate,
// } from "@synthome/sdk";
import { Hono } from "hono";

const testRouter = new Hono();

/**
 * GET /api/test
 *
 * Simple test endpoint to verify blocking execution behavior
 */
testRouter.get("/", async (c) => {
  try {
    console.log("Starting execution...");

    // console.log(e);

    // const execution = await compose(
    //   generateVideo({
    //     model: fal("veed/fabric-1.0"),
    //     audio: generateAudio({}),
    //     prompt: "A serene landscape with mountains",
    //     duration: 5,
    //     image: generateImage({
    //       model: replicate("bytedance/seedream-4"),
    //       prompt:
    //         "A man staning in the desert",
    //     }),
    //   }),
    //   generateVideo({
    //     model: replicate("bytedance/seedance-1-pro"),
    //     prompt: "A serene landscape with mountains",
    //     duration: 5,
    //     image: generateImage({
    //       model: replicate("bytedance/seedream-4"),
    //       prompt:
    //         "A futuristic cityscape at sunset, vibrant colors, high detail",
    //     }),
    //   }),
    //   merge()
    // ).execute();

    // No need to call waitForCompletion() - execute() already waited!

    return c.json({
      success: true,
      //   executionId: execution.id,
      //   status: execution.status,
      //   result: execution.result,
    });
  } catch (error) {
    console.error("Error in /api/test:", error);
    return c.json(
      {
        error: "Video generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/test/webhook
 *
 * Test endpoint to receive webhooks
 */
// testRouter.post("/webhook", async (c) => {
//   try {
//     const body = await c.req.json();
//     const signature = c.req.header("X-Webhook-Signature");

//     console.log("=== Webhook Received ===");
//     console.log("Signature:", signature);
//     console.log("Payload:", JSON.stringify(body, null, 2));
//     console.log("========================");

//     return c.json({
//       success: true,
//       message: "Webhook received",
//       receivedAt: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Error in /api/test/webhook:", error);
//     return c.json(
//       {
//         error: "Webhook processing failed",
//         message: error instanceof Error ? error.message : "Unknown error",
//       },
//       500
//     );
//   }
// });

// /**
//  * GET /api/test/webhook-async
//  *
//  * Test non-blocking execution with webhook
//  */
// testRouter.get("/webhook-async", async (c) => {
//   try {
//     console.log("Starting async execution with webhook...");

//     const webhookUrl = `${Bun.env.API_BASE_URL || "http://localhost:3100"}/api/test/webhook`;
//     console.log("Webhook URL:", webhookUrl);

//     // const execution = await compose(
//     //   generateImage({
//     //     model: replicate("bytedance/seedream-4"),
//     //     prompt: "A serene mountain landscape with a lake",
//     //   })
//     // ).execute({
//     //   webhook: webhookUrl,
//     //   webhookSecret: "test-secret-123",
//     // });

//     console.log("Execution submitted (non-blocking)");
//     console.log("Execution ID:", execution.id)
//   } catch (error) {
//     console.error("Error in /api/test/webhook-async:", error);
//     return c.json(
//       {
//         error: "Execution failed",
//         message: error instanceof Error ? error.message : "Unknown error",
//       },
//       500
//     );
//   }
// });

// /**
//  * GET /api/test/execute-from-plan
//  *
//  * Test executeFromPlan() - round-trip from compose -> toJSON -> executeFromPlan
//  */
// testRouter.get("/execute-from-plan", async (c) => {
//   try {
//     console.log("=== Testing executeFromPlan() ===");

//     // Step 1: Create a pipeline and get the JSON
//     const pipeline = compose(
//       generateImage({
//         model: replicate("bytedance/seedream-4"),
//         prompt: "A beautiful sunset over the ocean",
//       })
//     );

//     const plan = pipeline.toJSON();
//     console.log("Execution Plan:", JSON.stringify(plan, null, 2));

//     // Step 2: Execute from the plan (blocking mode)
//     console.log("Executing from plan...");
//     const execution = await executeFromPlan(plan);

//     console.log("Execution completed!");
//     console.log("Status:", execution.status);
//     console.log("Result:", execution.result);

//     return c.json({
//       success: true,
//       message: "executeFromPlan() works!",
//       executionId: execution.id,
//       status: execution.status,
//       result: execution.result,
//       plan,
//     });
//   } catch (error) {
//     console.error("Error in /api/test/execute-from-plan:", error);
//     return c.json(
//       {
//         error: "executeFromPlan failed",
//         message: error instanceof Error ? error.message : "Unknown error",
//       },
//       500
//     );
//   }
// });

// /**
//  * POST /api/test/execute-from-plan
//  *
//  * Test executeFromPlan() with custom JSON input
//  */
// testRouter.post("/execute-from-plan", async (c) => {
//   try {
//     const { plan, options } = await c.req.json();

//     console.log("=== Executing Custom Plan ===");
//     console.log("Plan:", JSON.stringify(plan, null, 2));

//     const execution = await executeFromPlan(plan, options);

//     console.log("Execution completed!");
//     console.log("Status:", execution.status);

//     return c.json({
//       success: true,
//       executionId: execution.id,
//       status: execution.status,
//       result: execution.result,
//     });
//   } catch (error) {
//     console.error("Error in POST /api/test/execute-from-plan:", error);
//     return c.json(
//       {
//         error: "executeFromPlan failed",
//         message: error instanceof Error ? error.message : "Unknown error",
//       },
//       500
//     );
//   }
// });

export { testRouter };
