import { Client } from "pg";

const client = new Client({
  connectionString:
    "postgresql://postgres:INfgootQxAdvYdVCMpwKpXolPeqDhJGu@shinkansen.proxy.rlwy.net:16245/railway",
});

await client.connect();

// Check if columns exist
const result = await client.query(`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'execution_jobs' 
  AND column_name IN ('provider_job_id', 'waiting_strategy', 'next_poll_at', 'poll_attempts')
`);

console.log("Existing async columns:", result.rows);

if (result.rows.length === 0) {
  console.log("\nColumns missing! Applying migration...");

  const migration = `
    ALTER TABLE execution_jobs 
    ADD COLUMN provider_job_id TEXT,
    ADD COLUMN provider_job_status TEXT,
    ADD COLUMN waiting_strategy TEXT,
    ADD COLUMN next_poll_at TIMESTAMP,
    ADD COLUMN poll_attempts INTEGER DEFAULT 0;
  `;

  await client.query(migration);
  console.log("Migration applied successfully!");
} else {
  console.log("All columns exist!");
}

await client.end();
