import PgBoss from "pg-boss";

let boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (!boss) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    boss = new PgBoss({
      connectionString,
      schema: "pgboss",
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
      expireInHours: 24,
      archiveCompletedAfterSeconds: 900, // 15 minutes
      deleteAfterDays: 7,
      monitorStateIntervalSeconds: 30,
      maintenanceIntervalSeconds: 120,
    });

    boss.on("error", (error: Error) => {
      console.error("[PgBoss] Error:", error);
    });

    // boss.on("monitor-states", (states) => {
    //   console.log("[PgBoss] Monitor states:", {
    //     all: states.all,
    //     created: states.created,
    //     retry: states.retry,
    //     active: states.active,
    //     completed: states.completed,
    //     expired: states.expired,
    //     cancelled: states.cancelled,
    //     failed: states.failed,
    //   });
    // });
  }

  return boss;
}

export async function startBoss(): Promise<void> {
  const instance = await getBoss();
  await instance.start();
  console.log("[PgBoss] Started successfully");
}

export async function stopBoss(): Promise<void> {
  if (boss) {
    await boss.stop();
    console.log("[PgBoss] Stopped successfully");
    boss = null;
  }
}
