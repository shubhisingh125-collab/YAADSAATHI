-- ============================================================================
-- YAADSAATHI SPRINT 6: MULTI-USER CLOUD DATABASE SCHEMA & ROW LEVEL SECURITY
-- Migration: 20260923000000_sprint6_multiuser_schema.sql
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE (Canonical User Profile linked to auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT DEFAULT '',
    preferred_name TEXT DEFAULT '',
    age INTEGER DEFAULT 70,
    preferred_language TEXT DEFAULT 'hi',
    secondary_language TEXT DEFAULT 'en',
    state_or_region TEXT DEFAULT 'ASSAM',
    sub_region TEXT DEFAULT '',
    home_address TEXT DEFAULT '',
    emergency_contact JSONB DEFAULT '{"name": "", "phone": "", "relation": ""}'::jsonb,
    doctor_contact JSONB DEFAULT '{"name": "", "phone": "", "clinic": ""}'::jsonb,
    font_scale NUMERIC(3, 2) DEFAULT 1.00,
    voice_replies_enabled BOOLEAN DEFAULT true,
    location_sharing_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON public.profiles
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. NER PROFILES (North Eastern Region cultural personalization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ner_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    state_or_region TEXT DEFAULT 'ASSAM',
    preferred_language TEXT DEFAULT 'as',
    sub_region_or_district TEXT DEFAULT '',
    cultural_preferences JSONB DEFAULT '[]'::jsonb,
    familiar_foods JSONB DEFAULT '[]'::jsonb,
    familiar_places JSONB DEFAULT '[]'::jsonb,
    familiar_objects JSONB DEFAULT '[]'::jsonb,
    festivals JSONB DEFAULT '[]'::jsonb,
    music JSONB DEFAULT '[]'::jsonb,
    family_memories JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_ner_profile UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_ner_profiles_user_id ON public.ner_profiles(user_id);

ALTER TABLE public.ner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ner_profiles_select_own" ON public.ner_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ner_profiles_insert_own" ON public.ner_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ner_profiles_update_own" ON public.ner_profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ner_profiles_delete_own" ON public.ner_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. PERSONAL MEMORIES (Meri Yaadein)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'STORY',
    type TEXT NOT NULL DEFAULT 'STORY',
    title TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    relationship TEXT DEFAULT '',
    location_context TEXT DEFAULT '',
    date_context TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    audio_url TEXT DEFAULT '',
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_category ON public.memories(user_id, category);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memories_select_own" ON public.memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "memories_insert_own" ON public.memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "memories_update_own" ON public.memories
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "memories_delete_own" ON public.memories
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 4. ROUTINES & REMINDERS (Daily Activity and Routine Tasks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    title_hindi TEXT DEFAULT '',
    title_english TEXT DEFAULT '',
    description TEXT DEFAULT '',
    period TEXT DEFAULT 'morning',
    scheduled_time TEXT DEFAULT '08:00 AM',
    time TEXT DEFAULT '08:00 AM',
    category TEXT DEFAULT 'activity',
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routines_user_id ON public.routines(user_id);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routines_select_own" ON public.routines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "routines_insert_own" ON public.routines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "routines_update_own" ON public.routines
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "routines_delete_own" ON public.routines
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. MEDICINES & MEDICATION SCHEDULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT DEFAULT '1 tablet',
    instructions TEXT DEFAULT '',
    scheduled_time TEXT NOT NULL DEFAULT '08:00',
    frequency TEXT DEFAULT 'Daily',
    active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'SCHEDULED',
    reminder_interval_minutes INTEGER DEFAULT 15,
    escalation_after_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicines_user_id ON public.medicines(user_id);

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medicines_select_own" ON public.medicines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medicines_insert_own" ON public.medicines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medicines_update_own" ON public.medicines
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medicines_delete_own" ON public.medicines
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 6. MEDICINE INTAKE HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medicine_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medicine_id UUID,
    medicine_name TEXT DEFAULT '',
    dosage TEXT DEFAULT '',
    date TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'TAKEN',
    confirmed_at TEXT,
    recorded_timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicine_history_user_id ON public.medicine_history(user_id);

ALTER TABLE public.medicine_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medicine_history_select_own" ON public.medicine_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medicine_history_insert_own" ON public.medicine_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medicine_history_update_own" ON public.medicine_history
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medicine_history_delete_own" ON public.medicine_history
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. COGNITIVE GAME SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    difficulty_level INTEGER DEFAULT 3,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_sessions_select_own" ON public.game_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "game_sessions_insert_own" ON public.game_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "game_sessions_update_own" ON public.game_sessions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "game_sessions_delete_own" ON public.game_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. COGNITIVE GAME RESULTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    game_id TEXT NOT NULL,
    cognitive_domain TEXT NOT NULL DEFAULT 'MEMORY',
    score INTEGER DEFAULT 0,
    accuracy NUMERIC(5, 2) DEFAULT 100.00,
    response_time NUMERIC(6, 2) DEFAULT 0.00,
    attempts INTEGER DEFAULT 1,
    mistakes INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    difficulty_level INTEGER DEFAULT 3,
    adaptive_recommendation JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_results_user_id ON public.game_results(user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_domain ON public.game_results(user_id, cognitive_domain);

ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_results_select_own" ON public.game_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "game_results_insert_own" ON public.game_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "game_results_update_own" ON public.game_results
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "game_results_delete_own" ON public.game_results
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 9. AGGREGATE COGNITIVE PROGRESS TELEMETRY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cognitive_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cognitive_domain TEXT NOT NULL,
    average_score INTEGER DEFAULT 0,
    average_accuracy NUMERIC(5, 2) DEFAULT 100.00,
    average_response_time NUMERIC(6, 2) DEFAULT 0.00,
    sessions_completed INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_domain_progress UNIQUE (user_id, cognitive_domain)
);

CREATE INDEX IF NOT EXISTS idx_cognitive_progress_user_id ON public.cognitive_progress(user_id);

ALTER TABLE public.cognitive_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cognitive_progress_select_own" ON public.cognitive_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cognitive_progress_insert_own" ON public.cognitive_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cognitive_progress_update_own" ON public.cognitive_progress
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cognitive_progress_delete_own" ON public.cognitive_progress
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 10. AI CONVERSATIONS (Saathi Assistant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Conversation',
    context_summary JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversations_select_own" ON public.ai_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_conversations_insert_own" ON public.ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_conversations_update_own" ON public.ai_conversations
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_conversations_delete_own" ON public.ai_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 11. AI MESSAGES (Saathi Dialogue History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    language TEXT DEFAULT 'hi',
    intent TEXT,
    confidence NUMERIC(4, 3),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON public.ai_messages(user_id);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_messages_select_own" ON public.ai_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_messages_insert_own" ON public.ai_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_messages_update_own" ON public.ai_messages
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_messages_delete_own" ON public.ai_messages
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 12. CAREGIVER RELATIONSHIPS (Consented Caregiver Linkages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.caregiver_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    caregiver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'family',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED')),
    permissions JSONB DEFAULT '{"view_meds": true, "view_location": true, "receive_alerts": true}'::jsonb,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_caregiver_pair UNIQUE (elder_user_id, caregiver_user_id)
);

CREATE INDEX IF NOT EXISTS idx_caregiver_elder ON public.caregiver_relationships(elder_user_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_user ON public.caregiver_relationships(caregiver_user_id);

ALTER TABLE public.caregiver_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "caregiver_relationships_select_involved" ON public.caregiver_relationships
    FOR SELECT USING (auth.uid() = elder_user_id OR auth.uid() = caregiver_user_id);

CREATE POLICY "caregiver_relationships_insert_elder" ON public.caregiver_relationships
    FOR INSERT WITH CHECK (auth.uid() = elder_user_id);

CREATE POLICY "caregiver_relationships_update_involved" ON public.caregiver_relationships
    FOR UPDATE USING (auth.uid() = elder_user_id OR auth.uid() = caregiver_user_id);

CREATE POLICY "caregiver_relationships_delete_involved" ON public.caregiver_relationships
    FOR DELETE USING (auth.uid() = elder_user_id OR auth.uid() = caregiver_user_id);

-- ============================================================================
-- 13. CAREGIVER ESCALATION ALERTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.caregiver_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    caregiver_id UUID,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caregiver_alerts_user_id ON public.caregiver_alerts(user_id);

ALTER TABLE public.caregiver_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "caregiver_alerts_select_own" ON public.caregiver_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "caregiver_alerts_insert_own" ON public.caregiver_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "caregiver_alerts_update_own" ON public.caregiver_alerts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "caregiver_alerts_delete_own" ON public.caregiver_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 14. AUTOMATED PROFILE PROVISIONING TRIGGER (auth.users -> profiles)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id,
        display_name,
        preferred_name,
        preferred_language,
        state_or_region,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'preferred_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'hi'),
        COALESCE(NEW.raw_user_meta_data->>'state_or_region', 'ASSAM'),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.ner_profiles (
        user_id,
        state_or_region,
        preferred_language,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'state_or_region', 'ASSAM'),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'as'),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
