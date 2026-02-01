-- Supabase Schema for Automation Workflows
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CONVERSATIONS TABLE
-- Stores conversation state and history
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id TEXT UNIQUE NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    source TEXT NOT NULL CHECK (source IN ('meta', 'tiktok', 'gmail')),
    platform TEXT,
    stage TEXT DEFAULT 'new' CHECK (stage IN ('new', 'qualified', 'booking', 'closed')),
    intent TEXT,
    message_count INTEGER DEFAULT 0,
    last_message_id TEXT,
    last_reply_at TIMESTAMPTZ,
    booking_status TEXT,
    booking_id TEXT,
    history JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_sender_id ON conversations(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source);
CREATE INDEX IF NOT EXISTS idx_conversations_stage ON conversations(stage);

-- ============================================
-- MESSAGE_LOGS TABLE
-- Stores all inbound and outbound messages
-- ============================================
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id),
    message_id TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    source TEXT NOT NULL,
    content TEXT,
    stage TEXT,
    intent TEXT,
    delay_applied_ms INTEGER,
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for message lookups
CREATE INDEX IF NOT EXISTS idx_message_logs_conversation_id ON message_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_message_id ON message_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_direction ON message_logs(direction);

-- ============================================
-- BOOKING_LOGS TABLE
-- Stores booking attempts and results
-- ============================================
CREATE TABLE IF NOT EXISTS booking_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id),
    sender_id TEXT NOT NULL,
    source TEXT NOT NULL,
    booking_status TEXT NOT NULL CHECK (booking_status IN ('awaiting_info', 'link_sent', 'confirmed', 'cancelled', 'failed')),
    booking_id TEXT,
    booking_datetime TIMESTAMPTZ,
    booking_info JSONB,
    missing_fields JSONB,
    acuity_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for booking lookups
CREATE INDEX IF NOT EXISTS idx_booking_logs_conversation_id ON booking_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_status ON booking_logs(booking_status);
CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_id ON booking_logs(booking_id);

-- ============================================
-- HANDOFF_QUEUE TABLE
-- Stores conversations that need human attention
-- ============================================
CREATE TABLE IF NOT EXISTS handoff_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id),
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    source TEXT NOT NULL,
    reason TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'resolved')),
    assigned_to TEXT,
    last_message TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

-- Index for handoff queue
CREATE INDEX IF NOT EXISTS idx_handoff_queue_status ON handoff_queue(status);
CREATE INDEX IF NOT EXISTS idx_handoff_queue_priority ON handoff_queue(priority);

-- ============================================
-- UPDATED_AT TRIGGER
-- Automatically update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- Enable if you need access control
-- ============================================
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE booking_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE handoff_queue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Active conversations view
CREATE OR REPLACE VIEW v_active_conversations AS
SELECT
    c.*,
    COUNT(ml.id) as total_messages,
    MAX(ml.created_at) as last_activity
FROM conversations c
LEFT JOIN message_logs ml ON c.conversation_id = ml.conversation_id
WHERE c.stage != 'closed'
GROUP BY c.id;

-- Daily stats view
CREATE OR REPLACE VIEW v_daily_stats AS
SELECT
    DATE(created_at) as date,
    source,
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN stage = 'booking' OR booking_id IS NOT NULL THEN 1 END) as bookings,
    COUNT(CASE WHEN stage = 'closed' THEN 1 END) as closed
FROM conversations
GROUP BY DATE(created_at), source
ORDER BY date DESC;

-- Pending handoffs view
CREATE OR REPLACE VIEW v_pending_handoffs AS
SELECT
    h.*,
    c.stage,
    c.message_count,
    c.history
FROM handoff_queue h
JOIN conversations c ON h.conversation_id = c.conversation_id
WHERE h.status = 'pending'
ORDER BY
    CASE h.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
    END,
    h.created_at;
