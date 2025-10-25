-- Add short_description column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS short_description TEXT;