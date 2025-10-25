-- Create executions table
CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  execution_plan JSONB NOT NULL,
  base_execution_id TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP
);

-- Create execution_jobs table
CREATE TABLE IF NOT EXISTS execution_jobs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES executions(id),
  job_id TEXT NOT NULL,
  pgboss_job_id TEXT NOT NULL,
  status TEXT NOT NULL,
  operation TEXT NOT NULL,
  dependencies JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_created_at ON executions(created_at);
CREATE INDEX IF NOT EXISTS idx_execution_jobs_execution_id ON execution_jobs(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_jobs_status ON execution_jobs(status);
