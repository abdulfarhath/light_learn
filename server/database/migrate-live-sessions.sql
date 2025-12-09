-- Migration: Add live_sessions table for focus mode state persistence
-- Created: 2025-12-09

-- Create live_sessions table
CREATE TABLE IF NOT EXISTS live_sessions (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL UNIQUE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    focus_timer_seconds INTEGER DEFAULT 1500,
    focus_timer_active BOOLEAN DEFAULT FALSE,
    focus_timer_visible BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_live_sessions_room_id ON live_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_teacher_id ON live_sessions(teacher_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_live_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_live_sessions_updated_at
    BEFORE UPDATE ON live_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_live_sessions_updated_at();

COMMENT ON TABLE live_sessions IS 'Stores live session state including focus mode timer';
COMMENT ON COLUMN live_sessions.room_id IS 'Unique room identifier for the live session';
COMMENT ON COLUMN live_sessions.focus_timer_seconds IS 'Current focus timer value in seconds';
COMMENT ON COLUMN live_sessions.focus_timer_active IS 'Whether the focus timer is currently running';
COMMENT ON COLUMN live_sessions.focus_timer_visible IS 'Whether the focus timer is visible to students';

