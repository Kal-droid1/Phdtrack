-- Add priority column to watchlist table
ALTER TABLE watchlist
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal'
CHECK (priority IN ('urgent', 'high', 'normal', 'low'));

-- Add pinned column to watchlist table
ALTER TABLE watchlist
ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
