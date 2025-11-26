// import {
//   audioModel,
//   captions,
//   compose
// } from "@synthome/sdk";
import { Hono } from "hono";

const testRouter = new Hono();

testRouter.get("/", async (c) => {
  try {
    // console.log("Starting execution...");

    // const res = await compose(
    //   captions({
    //     model: audioModel("vaibhavs10/incredibly-fast-whisper", "replicate"),
    //     video: '',
    //   })
    // );

    return c.json({
      message: "Test endpoint is working!",
      // result: res.toJSON(),
    });
  } catch (error) {
    console.error("Error in /api/test:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
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
testRouter.post("/webhook", async (c) => {
  try {
    const body = await c.req.json();
    const signature = c.req.header("X-Webhook-Signature");

    console.log("=== Webhook Received ===");
    console.log("Signature:", signature);
    console.log("Payload:", JSON.stringify(body, null, 2));
    console.log("========================");

    return c.json({
      success: true,
      message: "Webhook received",
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /api/test/webhook:", error);
    return c.json(
      {
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export { testRouter };
