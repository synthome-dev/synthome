import { Hono } from "hono";
import { executeRouter } from "./routes/execute";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/api/execute", executeRouter);

export default app;
