-- Migration: Create blog campaign SaaS schema v2 (Updated based on revised user flow)
-- Creates all necessary tables for the blog campaign system based on revised user flow requirements

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table (extends Supabase auth.users) - Updated structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('advertiser', 'influencer')),
    auth_method TEXT NOT NULL CHECK (auth_method IN ('email', 'external')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencer profiles table - Redesigned to include SNS information
CREATE TABLE IF NOT EXISTS public.influencer_profiles (
    id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    birth_date DATE NOT NULL,
    sns_channel_name TEXT NOT NULL,
    sns_channel_url TEXT NOT NULL,
    follower_count INTEGER NOT NULL DEFAULT 0 CHECK (follower_count >= 0),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Advertiser profiles table - Enhanced with additional business information
CREATE TABLE IF NOT EXISTS public.advertiser_profiles (
    id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_number TEXT NOT NULL UNIQUE,
    representative_name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns table (체험단) - Added early termination functionality
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    mission TEXT NOT NULL,
    benefits TEXT NOT NULL,
    location TEXT NOT NULL,
    recruitment_count INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    early_termination_date DATE,
    early_termination_reason TEXT,
    status TEXT NOT NULL DEFAULT '모집중' CHECK (status IN ('모집중', '조기종료', '모집종료', '선정완료')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Applications table (체험단 지원)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    influencer_id UUID NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
    motivation TEXT NOT NULL,
    visit_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT '신청완료' CHECK (status IN ('신청완료', '선정', '반려')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_id, influencer_id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_status ON public.influencer_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_influencer_followers ON public.influencer_profiles(follower_count);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_date_range ON public.campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_early_termination ON public.campaigns(early_termination_date);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_campaign ON public.applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_influencer ON public.applications(influencer_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_influencer_profiles_updated_at
    BEFORE UPDATE ON public.influencer_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertiser_profiles_updated_at
    BEFORE UPDATE ON public.advertiser_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.user_profiles IS '사용자 기본 프로필 정보 (Supabase Auth와 연동, 인증 방식 포함)';
COMMENT ON TABLE public.influencer_profiles IS '인플루언서 추가 프로필 정보 (생년월일 + SNS 정보 통합)';
COMMENT ON TABLE public.advertiser_profiles IS '광고주 회사 프로필 정보 (확장된 비즈니스 정보)';
COMMENT ON TABLE public.campaigns IS '체험단(캠페인) 정보 (조기종료 기능 포함)';
COMMENT ON TABLE public.applications IS '체험단 지원 정보';

-- Disable RLS as per workspace rules
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.influencer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advertiser_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications DISABLE ROW LEVEL SECURITY;
