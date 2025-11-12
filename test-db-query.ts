import { db, executions, eq } from "@repo/db";

const executionId = "kltcrvq4x-TpMLFQIgpSX";

const [execution] = await db
  .select()
  .from(executions)
  .where(eq(executions.id, executionId))
  .limit(1);

console.log("Execution found:", execution);

if (!execution) {
  console.log("NOT FOUND - checking all executions:");
  const allExecutions = await db.select().from(executions).limit(10);
  console.log("Recent executions:", allExecutions.map(e => ({ id: e.id, status: e.status })));
}

process.exit(0);
