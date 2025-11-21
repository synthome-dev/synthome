// import { compose, layers } from "@synthome/sdk";
// import { compose, layers } from "@synthome/sdk";
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

    // const res = await compose(
    //   layers([
    //     [
    //       {
    //         media: "https://files.cargocollective.com/c407508/Frame-14590.png",
    //       },
    //       {
    //         media:
    //           "https://pub-259ea830f6774f1d991b8a1eed10975c.r2.dev/Video%20(5).mp4",
    //       },
    //     ],
    //     {
    //       main: true,
    //       media:
    //         "https://pub-259ea830f6774f1d991b8a1eed10975c.r2.dev/Video%20(5).mp4",
    //       placement: "w-1/2 bottom-left",
    //       chromaKey: true,
    //     },
    //   ])
    // ).execute({
    //   apiUrl: `http://localhost:3101/api/execute`,
    //   apiKey:
    //     "sy_test_61aa4d7e73899492b513bc92ccfadbde67a9425bf1de65474c0d08e7263001c1",
    // });

    return c.json({
      success: true,
      // url: res.result?.url,
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
