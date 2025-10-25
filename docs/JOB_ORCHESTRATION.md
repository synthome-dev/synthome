# Job Orchestration Architecture

## How Jobs are Executed: Parallel vs Sequential

### Overview

The SDK creates an **execution plan** (JSON) that defines jobs and their dependencies. The backend uses **PgBoss** (PostgreSQL-based job queue) to orchestrate execution.

## Example: Understanding Job Dependencies

### Scenario 1: Sequential Jobs (One after Another)

```typescript
const pipeline = compose()
  .generateVideo({ prompt: "A cat" }) // Job 1
  .addSubtitles({ text: "Meow!" }) // Job 2 (depends on Job 1)
  .reframe({ aspectRatio: "9:16" }); // Job 3 (depends on Job 2)
```

**Execution Plan:**

```json
{
  "jobs": [
    { "id": "job1", "operation": "generateVideo", "params": {...} },
    { "id": "job2", "operation": "addSubtitles", "params": {...}, "dependsOn": ["job1"] },
    { "id": "job3", "operation": "reframe", "params": {...}, "dependsOn": ["job2"] }
  ],
  "rootJobIds": ["job1"]
}
```

**Timeline:**

```
job1 (generateVideo) → job2 (addSubtitles) → job3 (reframe)
  5min                    2min                   1min
```

---

### Scenario 2: Parallel Jobs (Multiple Videos at Once)

```typescript
const pipeline = compose()
  .generateVideo({ prompt: "A cat" }) // Job 1 - runs immediately
  .generateVideo({ prompt: "A dog" }) // Job 2 - runs immediately (parallel!)
  .merge({ transition: "fade" }); // Job 3 - waits for Job 1 AND Job 2
```

**Execution Plan:**

```json
{
  "jobs": [
    { "id": "job1", "operation": "generateVideo", "params": {"prompt": "A cat"} },
    { "id": "job2", "operation": "generateVideo", "params": {"prompt": "A dog"} },
    { "id": "job3", "operation": "merge", "params": {...}, "dependsOn": ["job1", "job2"] }
  ],
  "rootJobIds": ["job1", "job2"]
}
```

**Timeline:**

```
job1 (cat video) ──┐
  5min             │
                   ├──→ job3 (merge)
job2 (dog video) ──┘       2min
  5min
```

Both videos generate in parallel (5min total), then merge (2min) = **7min total** instead of 12min sequential!

---

## How PgBoss Handles This

### 1. Job Creation (Step 3 - Orchestrator)

```typescript
// In ExecutionOrchestrator
for (const job of executionPlan.jobs) {
  const dependencies = (job.dependsOn || [])
    .map((depId) => jobMapping.get(depId)) // Convert SDK job IDs to PgBoss IDs
    .filter(Boolean);

  const pgBossJobId = await jobManager.emitWithDependencies(
    "pipeline:generate-video",
    { executionId, jobId: job.id, ...job.params },
    dependencies, // ← PgBoss waits for these jobs to complete
  );

  jobMapping.set(job.id, pgBossJobId);
}
```

### 2. Dependency Waiting (BaseJob)

```typescript
// From packages/jobs/src/core/base-job.ts (lines 41-94)
async emitWithDependencies(data, dependencies) {
  // PgBoss polls dependency jobs every 5 seconds
  for (const depId of dependencyIds) {
    while (!completed) {
      const depJob = await this.boss.getJobById(depId);

      if (depJob.state === "completed") {
        completed = true;  // ✅ Dependency done
      } else if (depJob.state === "failed") {
        throw new Error();  // ❌ Cancel this job
      } else {
        await sleep(5000);  // ⏳ Wait 5 seconds, check again
      }
    }
  }

  // All dependencies complete → run the actual job
  await this.work(data);
}
```

### 3. Parallel Execution

When jobs have NO dependencies or DIFFERENT dependencies, PgBoss runs them in parallel:

```
Workers Pool (5 concurrent workers):
┌─────────────────────────────────┐
│ Worker 1: job1 (generateVideo)  │
│ Worker 2: job2 (generateVideo)  │  ← Running simultaneously!
│ Worker 3: idle                  │
│ Worker 4: idle                  │
│ Worker 5: idle                  │
└─────────────────────────────────┘
```

From `base-job.ts` line 21:

```typescript
await this.boss.work(
  this.type,
  {
    teamSize: 5, // 5 workers
    teamConcurrency: 5, // Each can run 5 jobs
  },
  this.work.bind(this),
);
```

---

## Real-World Example: Social Media Variants

```typescript
// Generate base video once
const base = compose().generateVideo({ prompt: "Product demo", duration: 30 });

const baseExec = await base.execute();

// Create 3 variants in parallel (reuse base video)
const instagram = compose(base).reframe({ aspectRatio: "1:1" });
const tiktok = compose(base).reframe({ aspectRatio: "9:16" });
const youtube = compose(base).addSubtitles({ text: "Subscribe!" });

// All 3 execute in parallel, each depends on baseExec
await Promise.all([
  instagram.execute({ baseExecutionId: baseExec.id }),
  tiktok.execute({ baseExecutionId: baseExec.id }),
  youtube.execute({ baseExecutionId: baseExec.id }),
]);
```

**Execution Timeline:**

```
baseExec (generateVideo) → 5min
             ↓
    ┌────────┼────────┐
    ↓        ↓        ↓
  job1     job2     job3    ← All run in parallel (1min each)
 (1:1)    (9:16)  (subs)
```

**Total time: 6min** (instead of 8min sequential)

---

## Database Tracking

### executions table

```
id: "exec_abc123"
status: "in_progress"
executionPlan: { jobs: [...] }
```

### execution_jobs table

```
┌─────────┬──────────────┬────────┬──────────┬──────────────┐
│ jobId   │ executionId  │ status │ operation│ dependencies │
├─────────┼──────────────┼────────┼──────────┼──────────────┤
│ job1    │ exec_abc123  │ done   │ generate │ []           │
│ job2    │ exec_abc123  │ done   │ generate │ []           │
│ job3    │ exec_abc123  │ active │ merge    │ [job1, job2] │ ← Waiting
└─────────┴──────────────┴────────┴──────────┴──────────────┘
```

---

## Key Points

1. **Automatic Parallelization**: SDK detects when jobs can run in parallel (no dependencies between them)

2. **Dependency Management**: PgBoss polls and waits for dependencies before starting dependent jobs

3. **Worker Pool**: 5 workers × 5 concurrency = 25 jobs can run simultaneously

4. **Execution Reuse**: `baseExecutionId` lets you reuse completed jobs to save time/cost

5. **Failure Handling**: If a dependency fails, all dependent jobs are cancelled

## Questions?

- How does retry work if a job fails?
- How long does it poll before timing out?
- Can we increase worker count for more parallelism?
