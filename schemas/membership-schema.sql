-- ============================================
-- MEMBERSHIP CLUB - Supabase Schema Extension
-- Run this AFTER supabase-schema.sql
-- ============================================

-- ============================================
-- MEMBERS TABLE
-- Core member profiles with auth
-- ============================================
CREATE TABLE IF NOT EXISTS members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    address JSONB DEFAULT '{}'::jsonb,
    card_number TEXT UNIQUE,
    card_qr_data TEXT,
    membership_plan_id UUID,
    membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended', 'cancelled')),
    membership_start DATE,
    membership_end DATE,
    points INTEGER DEFAULT 0,
    vip_level TEXT DEFAULT 'bronze' CHECK (vip_level IN ('bronze', 'silver', 'gold', 'platinum')),
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES members(id),
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_card_number ON members(card_number);
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON members(membership_status);
CREATE INDEX IF NOT EXISTS idx_members_referral_code ON members(referral_code);

-- ============================================
-- MEMBERSHIP_PLANS TABLE
-- Available subscription plans
-- ============================================
CREATE TABLE IF NOT EXISTS membership_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    currency TEXT DEFAULT 'CAD',
    trial_days INTEGER DEFAULT 0,
    max_members INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    badge_color TEXT DEFAULT '#6C63FF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COURSES TABLE
-- Online courses and programs
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    thumbnail_url TEXT,
    category TEXT,
    instructor_name TEXT,
    instructor_avatar TEXT,
    duration_minutes INTEGER,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    required_plan_id UUID REFERENCES membership_plans(id),
    is_published BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);

-- ============================================
-- COURSE_LESSONS TABLE
-- Individual lessons within courses
-- ============================================
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT DEFAULT 'video' CHECK (content_type IN ('video', 'text', 'quiz', 'download')),
    content_url TEXT,
    content_body TEXT,
    duration_minutes INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_free_preview BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);

-- ============================================
-- MEMBER_COURSE_PROGRESS TABLE
-- Track member progress in courses
-- ============================================
CREATE TABLE IF NOT EXISTS member_course_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES course_lessons(id),
    progress_percent INTEGER DEFAULT 0,
    completed_lessons JSONB DEFAULT '[]'::jsonb,
    is_completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(member_id, course_id)
);

-- ============================================
-- PARTNERS TABLE
-- Partner businesses offering deals
-- ============================================
CREATE TABLE IF NOT EXISTS partners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    description TEXT,
    website_url TEXT,
    category TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTNER_OFFERS TABLE
-- Exclusive offers from partners
-- ============================================
CREATE TABLE IF NOT EXISTS partner_offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT CHECK (discount_type IN ('percent', 'fixed', 'freebie', 'vip_access')),
    discount_value DECIMAL(10,2),
    required_plan_id UUID REFERENCES membership_plans(id),
    required_vip_level TEXT,
    promo_code TEXT,
    valid_from DATE,
    valid_until DATE,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_offers_partner_id ON partner_offers(partner_id);

-- ============================================
-- OFFER_REDEMPTIONS TABLE
-- Track when members use offers
-- ============================================
CREATE TABLE IF NOT EXISTS offer_redemptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id),
    offer_id UUID NOT NULL REFERENCES partner_offers(id),
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- EVENTS TABLE
-- Community events (online + in-person)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    event_type TEXT CHECK (event_type IN ('online', 'in_person', 'hybrid')),
    location TEXT,
    event_url TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    required_plan_id UUID REFERENCES membership_plans(id),
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);

-- ============================================
-- EVENT_REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id),
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, member_id)
);

-- ============================================
-- COMMUNITY_POSTS TABLE
-- Forum / social feed
-- ============================================
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id),
    title TEXT,
    content TEXT NOT NULL,
    post_type TEXT DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'announcement', 'event')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNITY_COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POINTS_HISTORY TABLE
-- Gamification points tracking
-- ============================================
CREATE TABLE IF NOT EXISTS points_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id),
    points INTEGER NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROMO_CODES TABLE
-- Marketing promo codes
-- ============================================
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percent', 'fixed')),
    discount_value DECIMAL(10,2),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    applicable_plan_id UUID REFERENCES membership_plans(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REFERRALS TABLE
-- Referral program tracking
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES members(id),
    referred_id UUID NOT NULL REFERENCES members(id),
    reward_points INTEGER DEFAULT 100,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE
-- Payment records
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id),
    plan_id UUID REFERENCES membership_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'CAD',
    payment_method TEXT,
    stripe_payment_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    billing_period_start DATE,
    billing_period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'promo')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- Member dashboard view
CREATE OR REPLACE VIEW v_member_dashboard AS
SELECT
    m.id, m.first_name, m.last_name, m.email, m.avatar_url,
    m.card_number, m.membership_status, m.points, m.vip_level,
    mp.name as plan_name, mp.badge_color,
    m.membership_start, m.membership_end,
    (SELECT COUNT(*) FROM member_course_progress mcp WHERE mcp.member_id = m.id AND mcp.is_completed = TRUE) as courses_completed,
    (SELECT COUNT(*) FROM offer_redemptions orr WHERE orr.member_id = m.id) as offers_redeemed,
    (SELECT COUNT(*) FROM event_registrations er WHERE er.member_id = m.id) as events_attended
FROM members m
LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id;

-- Admin stats view
CREATE OR REPLACE VIEW v_admin_stats AS
SELECT
    (SELECT COUNT(*) FROM members WHERE membership_status = 'active') as active_members,
    (SELECT COUNT(*) FROM members WHERE created_at > NOW() - INTERVAL '30 days') as new_members_30d,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days') as revenue_30d,
    (SELECT COUNT(*) FROM courses WHERE is_published = TRUE) as active_courses,
    (SELECT COUNT(*) FROM partners WHERE is_active = TRUE) as active_partners,
    (SELECT COUNT(*) FROM events WHERE start_date > NOW()) as upcoming_events;

-- ============================================
-- SEED DATA - Default membership plans
-- ============================================
INSERT INTO membership_plans (name, slug, description, features, price_monthly, price_yearly, trial_days, badge_color, sort_order) VALUES
('Essentiel', 'essentiel', 'Accès aux fonctionnalités de base du club', '["Carte membre virtuelle", "Accès communauté", "3 cours par mois", "Offres partenaires de base"]', 19.99, 199.99, 7, '#6C63FF', 1),
('Premium', 'premium', 'Accès complet avec avantages exclusifs', '["Carte membre VIP", "Accès communauté", "Cours illimités", "Toutes les offres partenaires", "Événements exclusifs", "Support prioritaire"]', 39.99, 399.99, 14, '#FFD700', 2),
('Famille', 'famille', 'Membership pour toute la famille', '["Jusqu''à 4 membres", "Carte membre famille", "Cours illimités", "Toutes les offres partenaires", "Événements famille", "Activités enfants", "Support prioritaire"]', 59.99, 599.99, 14, '#FF6B6B', 3),
('Entreprise', 'entreprise', 'Solution pour les entreprises', '["Membres illimités", "Tableau de bord entreprise", "Cours personnalisés", "Partenariats exclusifs", "Événements corporatifs", "Gestionnaire dédié"]', 149.99, 1499.99, 30, '#2D3436', 4)
ON CONFLICT (slug) DO NOTHING;
