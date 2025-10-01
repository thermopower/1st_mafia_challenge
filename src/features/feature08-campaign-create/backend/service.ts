import type { SupabaseClient } from '@supabase/supabase-js';
import { addMonths, startOfMonth } from 'date-fns';
import { z } from 'zod';
import {
  AdvertiserCampaignsResponseSchema,
  CampaignCreateInputSchema,
  CampaignCreateResponseSchema,
  CampaignDeleteResponseSchema,
  CampaignDetailResponseSchema,
  CampaignUpdateInputSchema,
  campaignCreateErrorCodes,
  type CampaignCreateErrorCode,
} from './schema';
import { failure, success, type ErrorResult, type SuccessResult } from '@/backend/http/response';

const mapCampaignRecordToDetail = (campaign: Record<string, unknown>) => ({
  id: String(campaign.id ?? ''),
  title: String(campaign.title ?? ''),
  description: String(campaign.description ?? ''),
  mission: String(campaign.mission ?? ''),
  benefits: String(campaign.benefits ?? ''),
  location: String(campaign.location ?? ''),
  recruitmentCount: Number(campaign.recruitment_count ?? 0),
  startDate: String(campaign.start_date ?? ''),
  endDate: String(campaign.end_date ?? ''),
  status: String(campaign.status ?? ''),
  createdAt: String(campaign.created_at ?? ''),
  updatedAt: String(campaign.updated_at ?? ''),
});

const validateAdvertiserProfile = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<ErrorResult<CampaignCreateErrorCode, unknown> | null> => {
  const { data: advertiserProfile } = await supabase
    .from('advertiser_profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!advertiserProfile) {
    return failure(
      403,
      campaignCreateErrorCodes.ADVERTISER_PROFILE_NOT_FOUND,
      '광고주 프로필이 필요합니다.',
    );
  }

  return null;
};

const campaignCanBeEdited = (status: string) => status === '모집중';

export type CampaignWriteInput = z.infer<typeof CampaignCreateInputSchema>;

export async function createCampaign(
  supabase: SupabaseClient,
  userId: string,
  input: CampaignWriteInput,
): Promise<SuccessResult<unknown> | ErrorResult<CampaignCreateErrorCode, unknown>> {
  const validation = CampaignCreateInputSchema.safeParse(input);
  if (!validation.success) {
    return failure(
      400,
      campaignCreateErrorCodes.INVALID_INPUT,
      '입력값이 올바르지 않습니다.',
      validation.error.format(),
    );
  }

  const profileValidation = await validateAdvertiserProfile(supabase, userId);
  if (profileValidation) {
    return profileValidation;
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = addMonths(monthStart, 1);
  const { count: monthlyCount, error: monthlyCountError } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('advertiser_id', userId)
    .gte('created_at', monthStart.toISOString())
    .lt('created_at', nextMonthStart.toISOString());

  if (monthlyCountError) {
    return failure(
      500,
      campaignCreateErrorCodes.CAMPAIGNS_FETCH_FAILED,
      '캠페인 생성 한도를 확인하지 못했습니다.',
      monthlyCountError.message,
    );
  }

  if ((monthlyCount ?? 0) >= 10) {
    return failure(
      400,
      campaignCreateErrorCodes.CAMPAIGN_LIMIT_EXCEEDED,
      '한 달에 최대 10개의 체험단만 등록할 수 있습니다.',
    );
  }

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

  const { data, error } = await supabase.from('campaigns').insert(payload).select().single();

  if (error || !data) {
    return failure(500, campaignCreateErrorCodes.CAMPAIGN_CREATION_FAILED, '체험단 생성에 실패했습니다.');
  }

  const parsed = CampaignCreateResponseSchema.safeParse(mapCampaignRecordToDetail(data));
  if (!parsed.success) {
    return failure(
      500,
      campaignCreateErrorCodes.CAMPAIGN_CREATION_FAILED,
      '생성된 체험단 데이터가 올바르지 않습니다.',
      parsed.error.format(),
    );
  }

  return success(parsed.data, 201);
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
  const profileValidation = await validateAdvertiserProfile(supabase, userId);
  if (profileValidation) {
    return profileValidation;
  }

  const offset = (page - 1) * limit;
  const { data: campaigns, error: listError } = await supabase
    .from('campaigns')
    .select('id, title, status, recruitment_count, start_date, end_date, created_at, applications(id)')
    .eq('advertiser_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (listError) {
    return failure(500, campaignCreateErrorCodes.CAMPAIGNS_FETCH_FAILED, '캠페인 목록 조회에 실패했습니다.');
  }

  const { count: total } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('advertiser_id', userId);

  const mapped = (campaigns ?? []).map((campaign: any) => ({
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    recruitmentCount: campaign.recruitment_count,
    startDate: campaign.start_date,
    endDate: campaign.end_date,
    createdAt: campaign.created_at,
    applicationCount: Array.isArray(campaign.applications) ? campaign.applications.length : 0,
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

  const parsed = AdvertiserCampaignsResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return failure(
      500,
      campaignCreateErrorCodes.CAMPAIGNS_FETCH_FAILED,
      '캠페인 목록 데이터가 올바르지 않습니다.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
}

export async function getAdvertiserCampaignDetail(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
): Promise<SuccessResult<unknown> | ErrorResult<CampaignCreateErrorCode, unknown>> {
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, advertiser_id, title, description, mission, benefits, location, recruitment_count, start_date, end_date, status, created_at, updated_at')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return failure(404, campaignCreateErrorCodes.CAMPAIGN_NOT_FOUND, '체험단을 찾을 수 없습니다.');
  }

  if (campaign.advertiser_id !== userId) {
    return failure(403, campaignCreateErrorCodes.UNAUTHORIZED, '권한이 없습니다.');
  }

  const parsed = CampaignDetailResponseSchema.safeParse(mapCampaignRecordToDetail(campaign));
  if (!parsed.success) {
    return failure(
      500,
      campaignCreateErrorCodes.CAMPAIGNS_FETCH_FAILED,
      '체험단 상세 데이터가 올바르지 않습니다.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
}

export async function updateCampaign(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  input: CampaignWriteInput,
): Promise<SuccessResult<unknown> | ErrorResult<CampaignCreateErrorCode, unknown>> {
  const validation = CampaignUpdateInputSchema.safeParse(input);
  if (!validation.success) {
    return failure(
      400,
      campaignCreateErrorCodes.INVALID_INPUT,
      '입력값이 올바르지 않습니다.',
      validation.error.format(),
    );
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, advertiser_id, status')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return failure(404, campaignCreateErrorCodes.CAMPAIGN_NOT_FOUND, '체험단을 찾을 수 없습니다.');
  }

  if (campaign.advertiser_id !== userId) {
    return failure(403, campaignCreateErrorCodes.UNAUTHORIZED, '권한이 없습니다.');
  }

  if (!campaignCanBeEdited(campaign.status)) {
    return failure(
      400,
      campaignCreateErrorCodes.CAMPAIGN_STATUS_LOCKED,
      '모집 종료 이후에는 정보를 수정할 수 없습니다.',
    );
  }

  const updatePayload = {
    title: validation.data.title,
    description: validation.data.description,
    mission: validation.data.mission,
    benefits: validation.data.benefits,
    location: validation.data.location,
    recruitment_count: validation.data.recruitmentCount,
    start_date: validation.data.startDate,
    end_date: validation.data.endDate,
  };

  const { data: updated, error: updateError } = await supabase
    .from('campaigns')
    .update(updatePayload)
    .eq('id', campaignId)
    .eq('advertiser_id', userId)
    .select()
    .single();

  if (updateError || !updated) {
    return failure(
      500,
      campaignCreateErrorCodes.CAMPAIGN_UPDATE_FAILED,
      '체험단 수정에 실패했습니다.',
      updateError?.message,
    );
  }

  const parsed = CampaignDetailResponseSchema.safeParse(mapCampaignRecordToDetail(updated));
  if (!parsed.success) {
    return failure(
      500,
      campaignCreateErrorCodes.CAMPAIGN_UPDATE_FAILED,
      '수정된 체험단 데이터가 올바르지 않습니다.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
}

export async function deleteCampaign(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
): Promise<SuccessResult<unknown> | ErrorResult<CampaignCreateErrorCode, unknown>> {
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, advertiser_id')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return failure(404, campaignCreateErrorCodes.CAMPAIGN_NOT_FOUND, '체험단을 찾을 수 없습니다.');
  }

  if (campaign.advertiser_id !== userId) {
    return failure(403, campaignCreateErrorCodes.UNAUTHORIZED, '권한이 없습니다.');
  }

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)
    .eq('advertiser_id', userId);

  if (error) {
    return failure(
      500,
      campaignCreateErrorCodes.CAMPAIGN_DELETE_FAILED,
      '체험단 삭제에 실패했습니다.',
      error.message,
    );
  }

  const parsed = CampaignDeleteResponseSchema.safeParse({ id: campaignId });
  return success(parsed.data);
}
