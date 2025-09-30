import type { SupabaseClient } from '@supabase/supabase-js';
import type { ErrorResult, SuccessResult } from '@/backend/http/response';
import {
  CampaignApplicantsResponseSchema,
  CampaignStatusUpdateSchema,
  InfluencerSelectionSchema,
  campaignAdminErrorCodes,
  type CampaignAdminErrorCode,
} from './schema';

/**
 * 체험단 지원자 관리 서비스 로직 (기본 구조)
 */
export async function getCampaignApplicants(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string
): Promise<SuccessResult<unknown> | ErrorResult<CampaignAdminErrorCode, unknown>> {
  // 캠페인 소유 확인 (광고주 본인만)
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, advertiser_id, title, status, recruitment_count')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return { ok: false, error: { code: campaignAdminErrorCodes.CAMPAIGN_NOT_FOUND, message: '체험단을 찾을 수 없습니다.' } };
  }

  if (campaign.advertiser_id !== userId) {
    return { ok: false, error: { code: campaignAdminErrorCodes.UNAUTHORIZED, message: '권한이 없습니다.' } };
  }

  // 지원자 목록 조회
  const { data: applicants, error } = await supabase
    .from('applications')
    .select('id, influencer_id, motivation, visit_date, status, applied_at, influencer:influencer_profiles(id, sns_channel_name, follower_count), profile:user_profiles!applications_influencer_id_fkey(full_name)')
    .eq('campaign_id', campaignId)
    .order('applied_at', { ascending: false });

  if (error) {
    return { ok: false, error: { code: campaignAdminErrorCodes.APPLICANTS_FETCH_FAILED, message: '지원자 조회에 실패했습니다.' } };
  }

  const selectedCount = (applicants ?? []).filter((a: any) => a.status === '선정').length;

  const payload = {
    applicants: (applicants ?? []).map((a: any) => ({
      id: a.id,
      influencerId: a.influencer_id,
      influencerName: a.profile?.full_name ?? '알 수 없음',
      snsChannelName: a.influencer?.sns_channel_name ?? '',
      followerCount: a.influencer?.follower_count ?? 0,
      motivation: a.motivation,
      visitDate: a.visit_date,
      status: a.status,
      appliedAt: a.applied_at,
    })),
    campaignInfo: {
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      recruitmentCount: campaign.recruitment_count,
      selectedCount,
    },
  };

  const parsed = CampaignApplicantsResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: campaignAdminErrorCodes.APPLICANTS_FETCH_FAILED,
        message: '지원자 데이터 형식이 올바르지 않습니다.',
        details: parsed.error.format(),
      },
    };
  }

  return { ok: true, data: parsed.data };
}

/**
 * 체험단 상태 변경 서비스 로직 (기본 구조)
 */
export async function updateCampaignStatus(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  status: '모집종료' | '조기종료',
  reason?: string
): Promise<SuccessResult<{ id: string; status: string }> | ErrorResult<CampaignAdminErrorCode, unknown>> {
  // 캠페인 소유 확인
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, advertiser_id, status')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return { ok: false, error: { code: campaignAdminErrorCodes.CAMPAIGN_NOT_FOUND, message: '체험단을 찾을 수 없습니다.' } };
  }
  if (campaign.advertiser_id !== userId) {
    return { ok: false, error: { code: campaignAdminErrorCodes.UNAUTHORIZED, message: '권한이 없습니다.' } };
  }

  // 상태 업데이트
  const patch: Record<string, any> = { status };
  if (status === '조기종료') {
    patch.early_termination_date = new Date().toISOString().slice(0, 10);
    if (reason) patch.early_termination_reason = reason;
  }

  const { data: updated, error } = await supabase
    .from('campaigns')
    .update(patch)
    .eq('id', campaignId)
    .select('id, status')
    .single();

  if (error || !updated) {
    return { ok: false, error: { code: campaignAdminErrorCodes.STATUS_UPDATE_FAILED, message: '상태 변경에 실패했습니다.' } };
  }

  return { ok: true, data: { id: updated.id, status: updated.status } };
}

/**
 * 인플루언서 선정 서비스 로직 (기본 구조)
 */
export async function selectInfluencers(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  selectedInfluencerIds: string[]
): Promise<SuccessResult<{ updated: number }> | ErrorResult<CampaignAdminErrorCode, unknown>> {
  // 캠페인 소유 확인 + 상태 확인(모집종료 또는 조기종료 상태에서만 선정 가능)
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, advertiser_id, status')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return { ok: false, error: { code: campaignAdminErrorCodes.CAMPAIGN_NOT_FOUND, message: '체험단을 찾을 수 없습니다.' } };
  }
  if (campaign.advertiser_id !== userId) {
    return { ok: false, error: { code: campaignAdminErrorCodes.UNAUTHORIZED, message: '권한이 없습니다.' } };
  }
  if (campaign.status === '모집중') {
    return { ok: false, error: { code: campaignAdminErrorCodes.CAMPAIGN_NOT_RECRUITING, message: '모집 중에는 선정할 수 없습니다.' } };
  }

  // 입력 검증
  const parsed = InfluencerSelectionSchema.safeParse({ selectedInfluencerIds });
  if (!parsed.success) {
    return { ok: false, error: { code: campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, message: '입력값이 올바르지 않습니다.', details: parsed.error.format() } };
  }

  // 해당 캠페인의 신청 건 중 선택된 지원자 상태를 '선정'으로 업데이트
  const { data: updated, error } = await supabase
    .from('applications')
    .update({ status: '선정' })
    .eq('campaign_id', campaignId)
    .in('influencer_id', parsed.data.selectedInfluencerIds)
    .select('id');

  if (error) {
    return { ok: false, error: { code: campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, message: '선정 처리에 실패했습니다.' } };
  }

  // 캠페인 상태를 '선정완료'로 변경 (선택 수가 모집인원 이상이거나 한 명 이상 선정 시 비즈니스 규칙에 따라 조정 가능)
  await supabase
    .from('campaigns')
    .update({ status: '선정완료' })
    .eq('id', campaignId);

  return { ok: true, data: { updated: Array.isArray(updated) ? updated.length : 0 } };
}
