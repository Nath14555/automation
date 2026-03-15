-- ============================================
-- EXTENDED SCHEMA FOR AI MARKETING AGENCY
-- Run this AFTER supabase-schema.sql
-- ============================================

-- ============================================
-- LEADS TABLE
-- Central lead management
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    title TEXT,
    source TEXT NOT NULL,
    source_campaign TEXT,
    source_medium TEXT,
    lead_score INTEGER DEFAULT 0,
    qualification TEXT DEFAULT 'cold' CHECK (qualification IN ('cold', 'warm', 'hot')),
    lifecycle_stage TEXT DEFAULT 'subscriber' CHECK (lifecycle_stage IN ('subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist', 'churned')),
    tags JSONB DEFAULT '[]'::jsonb,
    enrichment_data JSONB DEFAULT '{}'::jsonb,
    utm_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_lifecycle ON leads(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_qualification ON leads(qualification);

-- ============================================
-- CONTENT_CALENDAR TABLE
-- Editorial calendar management
-- ============================================
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'article', 'video', 'story', 'reel', 'newsletter', 'ad')),
    platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok', 'linkedin', 'youtube', 'blog', 'email', 'google_ads')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('idea', 'draft', 'review', 'approved', 'scheduled', 'published')),
    content TEXT,
    variants JSONB DEFAULT '[]'::jsonb,
    hashtags JSONB DEFAULT '[]'::jsonb,
    visual_url TEXT,
    campaign_id UUID,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    performance JSONB DEFAULT '{}'::jsonb,
    created_by TEXT DEFAULT 'content-creator',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_calendar_platform ON content_calendar(platform);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled ON content_calendar(scheduled_at);

-- ============================================
-- CAMPAIGNS TABLE
-- Marketing campaign tracking
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('awareness', 'engagement', 'conversion', 'retention', 'winback')),
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'cancelled')),
    channels JSONB DEFAULT '[]'::jsonb,
    budget DECIMAL(10, 2) DEFAULT 0,
    spent DECIMAL(10, 2) DEFAULT 0,
    target_audience JSONB DEFAULT '{}'::jsonb,
    objectives JSONB DEFAULT '[]'::jsonb,
    kpis JSONB DEFAULT '{}'::jsonb,
    brief TEXT,
    start_date DATE,
    end_date DATE,
    performance JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(campaign_type);

-- ============================================
-- AD_PERFORMANCE TABLE
-- Advertising performance tracking
-- ============================================
CREATE TABLE IF NOT EXISTS ad_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id),
    platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'linkedin')),
    ad_set_id TEXT,
    ad_id TEXT,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend DECIMAL(10, 2) DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    ctr DECIMAL(8, 4) DEFAULT 0,
    cpc DECIMAL(8, 2) DEFAULT 0,
    cpa DECIMAL(8, 2) DEFAULT 0,
    roas DECIMAL(8, 2) DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_performance_campaign ON ad_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_performance_platform ON ad_performance(platform);
CREATE INDEX IF NOT EXISTS idx_ad_performance_date ON ad_performance(date);

-- ============================================
-- SEO_TRACKING TABLE
-- SEO position and performance tracking
-- ============================================
CREATE TABLE IF NOT EXISTS seo_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    keyword TEXT NOT NULL,
    url TEXT,
    position INTEGER,
    previous_position INTEGER,
    search_volume INTEGER,
    difficulty INTEGER,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_tracking_keyword ON seo_tracking(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_tracking_date ON seo_tracking(date);

-- ============================================
-- EMAIL_CAMPAIGNS TABLE
-- Email marketing tracking
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id),
    name TEXT NOT NULL,
    campaign_type TEXT CHECK (campaign_type IN ('sequence', 'newsletter', 'reengagement', 'promotion', 'transactional')),
    subject_line TEXT,
    subject_variants JSONB DEFAULT '[]'::jsonb,
    segment TEXT,
    segment_size INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    sent_at TIMESTAMPTZ,
    opens INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    unsubscribes INTEGER DEFAULT 0,
    bounces INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    open_rate DECIMAL(5, 4) DEFAULT 0,
    click_rate DECIMAL(5, 4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);

-- ============================================
-- REVIEWS TABLE
-- Online review tracking
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('google', 'facebook', 'trustpilot', 'yelp', 'other')),
    reviewer_name TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    response TEXT,
    response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'responded', 'escalated', 'ignored')),
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    review_date TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_platform ON reviews(platform);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(response_status);

-- ============================================
-- AGENT_LOGS TABLE
-- Track all AI agent actions
-- ============================================
CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    workflow_id TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'skipped')),
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    execution_time_ms INTEGER,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(8, 4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_workflow ON agent_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_logs(created_at);

-- ============================================
-- CHURN_SIGNALS TABLE
-- Client health and churn detection
-- ============================================
CREATE TABLE IF NOT EXISTS churn_signals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id),
    health_score INTEGER DEFAULT 100,
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    signals JSONB DEFAULT '[]'::jsonb,
    last_interaction TIMESTAMPTZ,
    days_since_interaction INTEGER,
    retention_action TEXT,
    retention_action_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_churn_signals_risk ON churn_signals(risk_level);
CREATE INDEX IF NOT EXISTS idx_churn_signals_lead ON churn_signals(lead_id);

-- ============================================
-- UPDATED_AT TRIGGERS for new tables
-- ============================================
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_calendar_updated_at
    BEFORE UPDATE ON content_calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
    BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_churn_signals_updated_at
    BEFORE UPDATE ON churn_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR AGENCY DASHBOARD
-- ============================================

-- Agent performance view
CREATE OR REPLACE VIEW v_agent_performance AS
SELECT
    agent_id,
    COUNT(*) as total_actions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    ROUND(AVG(execution_time_ms)) as avg_execution_ms,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost,
    MAX(created_at) as last_activity
FROM agent_logs
GROUP BY agent_id;

-- Pipeline overview view
CREATE OR REPLACE VIEW v_pipeline_overview AS
SELECT
    lifecycle_stage,
    qualification,
    COUNT(*) as total_leads,
    AVG(lead_score) as avg_score,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week
FROM leads
GROUP BY lifecycle_stage, qualification
ORDER BY
    CASE lifecycle_stage
        WHEN 'subscriber' THEN 1
        WHEN 'lead' THEN 2
        WHEN 'mql' THEN 3
        WHEN 'sql' THEN 4
        WHEN 'opportunity' THEN 5
        WHEN 'customer' THEN 6
        WHEN 'evangelist' THEN 7
        WHEN 'churned' THEN 8
    END;

-- Campaign ROI view
CREATE OR REPLACE VIEW v_campaign_roi AS
SELECT
    c.id,
    c.name,
    c.campaign_type,
    c.budget,
    c.spent,
    COALESCE(SUM(ap.revenue), 0) as total_revenue,
    COALESCE(SUM(ap.conversions), 0) as total_conversions,
    CASE WHEN c.spent > 0 THEN ROUND(COALESCE(SUM(ap.revenue), 0) / c.spent, 2) ELSE 0 END as roas
FROM campaigns c
LEFT JOIN ad_performance ap ON c.id = ap.campaign_id
GROUP BY c.id, c.name, c.campaign_type, c.budget, c.spent;
