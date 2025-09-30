import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CampaignCreateInputSchema,
  campaignCreateErrorCodes,
  type CampaignCreateErrorCode,
  AdvertiserCampaignsResponseSchema,
} from './schema';
import type { ErrorResult, SuccessResult } from '@/backend/http/response';

export interface CampaignCreateInput {
  title: string;
  description: string;
  mission: string;
  benefits: string;
  location: string;
  recruitmentCount: number;
  startDate: string;
  endDate: string;
}

export interface CampaignCreateResult {
  id: string;
  title: string;
  description: string;
  mission: string;
  benefits: string;
  location: string;
  recruitmentCount: number;
  startDate: string;
  endDate: string;
  status: '모집중' | '모집종료' | '선정완료' | '조기종료';
  createdAt: string;
  updatedAt: string;
}

/**
 * 체험단 생성 서비스 로직
 */
export async function createCampaign(
  supabase: SupabaseClient,
  userId: string,
  input: CampaignCreateInput
): Promise<SuccessResult<CampaignCreateResult> | ErrorResult<CampaignCreateErrorCode, unknown>> {
  // 입력값 검증
  const validation = CampaignCreateInputSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: campaignCreateErrorCodes.INVALID_INPUT,
        message: '입력값이 올바르지 않습니다.',
        details: validation.error.format(),
      },
    };
  }

  // 광고주 프로필 확인 (권한 체크)
  const { data: advertiserProfile } = await supabase
    .from('advertiser_profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!advertiserProfile) {
    return {
      ok: false,
      error: {
        code: campaignCreateErrorCodes.ADVERTISER_PROFILE_NOT_FOUND,
        message: '광고주 프로필이 필요합니다.',
      },
    };
  }

  // DB 입력 변환 및 생성
  const payload = {
    advertiser_id: userId,
    title: validation.data.title,
    description: validation.data.description,
    mission: validation.data.mission,
    benefits: validation.data.benefits,
    location: validation.data.location,
    recruitment_count: validation.data.recruitmentCount,
    start_date: validation.data.startDate,
    end_date: validation.data.endDate,
    status: '모집중' as const,
  };

  const { data, error } = await supabase
    .from('campaigns')
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: {
        code: campaignCreateErrorCodes.CAMPAIGN_CREATION_FAILED,
        message: '체험단 생성에 실패했습니다.',
      },
    };
  }

  const result: CampaignCreateResult = {
    id: data.id,
    title: data.title,
    description: data.description,
    mission: data.mission,
    benefits: data.benefits,
    location: data.location,
    recruitmentCount: data.recruitment_count,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return {
    ok: true,
    data: result,
  };
}

export interface AdvertiserCampaignsInput {
  page?: number;
  limit?: number;
}

export async function getAdvertiserCampaigns(
  supabase: SupabaseClient,
  userId: string,
  { page = 1, limit = 10 }: AdvertiserCampaignsInput = {},
): Promise<SuccessResult<unknown> | ErrorResult<CampaignCreateErrorCode, unknown>> {
  // 광고주 프로필 확인
  const { data: advertiserProfile } = await supabase
    .from('advertiser_profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!advertiserProfile) {
    return {
      ok: false,
      error: {
        code: campaignCreateErrorCodes.ADVERTISER_PROFILE_NOT_FOUND,
        message: '광고주 프로필이 필요합니다.',
      },
    };
  }

  const offset = (page - 1) * limit;

  // 목록 조회 + 지원자 수 포함 (applications(id) 길이로 계산)
  const { data: campaigns, error: listError } = await supabase
    .from('campaigns')
    .select('id, title, status, recruitment_count, start_date, end_date, created_at, applications(id)')
    .eq('advertiser_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (listError) {
    return {
      ok: false,
      error: {
        code: campaignCreateErrorCodes.CAMPAIGNS_FETCH_FAILED,
        message: '캠페인 목록 조회에 실패했습니다.',
      },
    };
  }

  const { count: total } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('advertiser_id', userId);

  const mapped = (campaigns ?? []).map((c: any) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    recruitmentCount: c.recruitment_count,
    startDate: c.start_date,
    endDate: c.end_date,
    createdAt: c.created_at,
    applicationCount: Array.isArray(c.applications) ? c.applications.length : 0,
  }));

  const payload = {
    campaigns: mapped,
    pagination: {
      page,
      limit,
      total: total ?? mapped.length,
      totalPages: total ? Math.ceil(total / limit) : 1,
      hasNext: total ? page * limit < total : false,
      hasPrev: page > 1,
    },
  };

  // 스키마 검증 (방어적)
  const parsed = AdvertiserCampaignsResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: campaignCreateErrorCodes.CAMPAIGNS_FETCH_FAILED,
        message: '캠페인 목록 데이터 형식이 올바르지 않습니다.',
        details: parsed.error.format(),
      },
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
}
