-- Migration: 20261021_init_aurix_schema.sql
-- Description: Core Schema for AURIX Cyber Platform with strict RLS enforcement.

-- 1. PROFILES TABLE (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEVICES TABLE (Target iOS Devices paired to a master account)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    os_version TEXT NOT NULL,
    connection_status TEXT CHECK (connection_status IN ('online', 'offline', 'pending_setup')) DEFAULT 'pending_setup',
    last_seen_at TIMESTAMPTZ,
    paired_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PAIRING REQUESTS TABLE (Temporary 6-digit one-time codes)
CREATE TABLE IF NOT EXISTS public.pairing_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL, -- SHA256 hashed code
    status TEXT CHECK (status IN ('pending', 'consumed', 'expired')) DEFAULT 'pending',
    attempts INT DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEVICE PERMISSIONS TABLE (Tracks iOS vs Owner Granular Permissions)
CREATE TABLE IF NOT EXISTS public.device_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    location_granted BOOLEAN DEFAULT FALSE,
    screen_share_granted BOOLEAN DEFAULT FALSE,
    camera_granted BOOLEAN DEFAULT FALSE,
    mic_granted BOOLEAN DEFAULT FALSE,
    user_consent_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_device_permission UNIQUE (device_id)
);

-- 5. LOCATION UPDATES TABLE (Ephemeral GPS data)
CREATE TABLE IF NOT EXISTS public.location_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    battery_level FLOAT,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUDIT EVENTS TABLE (Security & Consent Logs)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- SECURITY POLICIES (Users can ONLY access their own data)

-- Profiles Policy
CREATE POLICY "Users access own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Devices Policy
CREATE POLICY "Users access own devices" ON public.devices
    FOR ALL USING (auth.uid() = owner_id);

-- Pairing Requests Policy
CREATE POLICY "Users manage own pairing requests" ON public.pairing_requests
    FOR ALL USING (auth.uid() = account_id);

-- Device Permissions Policy
CREATE POLICY "Users manage own device permissions" ON public.device_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE public.devices.id = public.device_permissions.device_id
            AND public.devices.owner_id = auth.uid()
        )
    );

-- Location Updates Policy
CREATE POLICY "Users access own device location updates" ON public.location_updates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE public.devices.id = public.location_updates.device_id
            AND public.devices.owner_id = auth.uid()
        )
    );

-- Audit Events Policy
CREATE POLICY "Users access own audit events" ON public.audit_events
    FOR ALL USING (auth.uid() = account_id);

-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
CREATE INDEX idx_devices_owner ON public.devices(owner_id);
CREATE INDEX idx_location_device_timestamp ON public.location_updates(device_id, timestamp DESC);
CREATE INDEX idx_pairing_code_status ON public.pairing_requests(code_hash, status);
  
