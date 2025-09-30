-- 0001_core_schema.sql
-- 블로그 체험단 SaaS: 최소 스키마 마이그레이션
-- 요구사항: idempotent, BEGIN/EXCEPTION 처리, 모든 테이블 updated_at + 업데이트 트리거, RLS 비활성화

-- 확장 설치 (gen_random_uuid 사용). 존재 시 건너뜀.
DO $$
BEGIN
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
      CREATE EXTENSION pgcrypto;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgcrypto extension check/create failed: %', SQLERRM;
  END;
END$$;

-- ENUM 타입들 생성 (존재 시 생략)
DO $$
BEGIN
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
      CREATE TYPE user_role_enum AS ENUM ('influencer', 'advertiser');
    END IF;
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'user_role_enum skipped: %', SQLERRM; END;

  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_status_enum') THEN
      CREATE TYPE channel_status_enum AS ENUM ('pending', 'verified', 'failed');
    END IF;
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'channel_status_enum skipped: %', SQLERRM; END;

  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_verification_enum') THEN
      CREATE TYPE profile_verification_enum AS ENUM ('pending', 'verified', 'failed');
    END IF;
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'profile_verification_enum skipped: %', SQLERRM; END;

  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status_enum') THEN
      CREATE TYPE campaign_status_enum AS ENUM ('recruiting', 'closed');
    END IF;
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'campaign_status_enum skipped: %', SQLERRM; END;

  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status_enum') THEN
      CREATE TYPE application_status_enum AS ENUM ('applied', 'selected', 'rejected');
    END IF;
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'application_status_enum skipped: %', SQLERRM; END;
END$$;

-- updated_at 트리거 함수 (업데이트 시각 자동 반영)
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- users 테이블
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role user_role_enum NOT NULL,
  verification_method TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_users') THEN
    CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END $$;

-- influencer_profiles
CREATE TABLE IF NOT EXISTS public.influencer_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  date_of_birth DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.influencer_profiles DISABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_influencer_profiles') THEN
    CREATE TRIGGER set_updated_at_influencer_profiles
    BEFORE UPDATE ON public.influencer_profiles
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END $$;

-- influencer_channels
CREATE TABLE IF NOT EXISTS public.influencer_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  url TEXT NOT NULL,
  status channel_status_enum NOT NULL DEFAULT 'pending',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_influencer_channel UNIQUE (user_id, channel_type, url)
);
ALTER TABLE public.influencer_channels DISABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_influencer_channels') THEN
    CREATE TRIGGER set_updated_at_influencer_channels
    BEFORE UPDATE ON public.influencer_channels
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END $$;

-- advertiser_profiles
CREATE TABLE IF NOT EXISTS public.advertiser_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  business_location TEXT NOT NULL,
  category TEXT NOT NULL,
  business_registration_number TEXT NOT NULL,
  verification_status profile_verification_enum NOT NULL DEFAULT 'pending',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_business_registration_number UNIQUE (business_registration_number)
);
ALTER TABLE public.advertiser_profiles DISABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_advertiser_profiles') THEN
    CREATE TRIGGER set_updated_at_advertiser_profiles
    BEFORE UPDATE ON public.advertiser_profiles
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END $$;

-- campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  benefits TEXT NOT NULL,
  mission TEXT NOT NULL,
  store TEXT NOT NULL,
  recruit_count INTEGER NOT NULL CHECK (recruit_count > 0),
  status campaign_status_enum NOT NULL DEFAULT 'recruiting',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_campaign_period CHECK (start_date <= end_date)
);
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_campaigns') THEN
    CREATE TRIGGER set_updated_at_campaigns
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END $$;

-- applications
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  planned_visit_date DATE NOT NULL,
  status application_status_enum NOT NULL DEFAULT 'applied',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_application UNIQUE (campaign_id, influencer_id)
);
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_applications') THEN
    CREATE TRIGGER set_updated_at_applications
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END $$;

-- audit_logs (최소 이벤트 기록)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_audit_logs') THEN
    CREATE TRIGGER set_updated_at_audit_logs
    BEFORE UPDATE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END $$;

