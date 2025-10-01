import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type ErrorResult, type SuccessResult } from '@/backend/http/response';
import {
  CampaignApplicantsResponseSchema,
  CampaignStatusUpdateSchema,
  InfluencerSelectionSchema,
  InfluencerRejectionSchema,
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
    return failure(404, campaignAdminErrorCodes.CAMPAIGN_NOT_FOUND, '체험단을 찾을 수 없습니다.');
  }

  if (campaign.advertiser_id !== userId) {
    return failure(403, campaignAdminErrorCodes.UNAUTHORIZED, '권한이 없습니다.');
  }

  // 지원자 목록 조회
  const { data: applicants, error } = await supabase
    .from('applications')
    .select('id, influencer_id, motivation, visit_date, status, applied_at, influencer:influencer_profiles(id, sns_channel_name, follower_count, profile:user_profiles(full_name))')
    .eq('campaign_id', campaignId)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Supabase query error:', error);
    return failure(500, campaignAdminErrorCodes.APPLICANTS_FETCH_FAILED, '지원자 조회에 실패했습니다.', error.message);
  }

  const selectedCount = (applicants ?? []).filter((a: any) => a.status === '선정').length;

  const payload = {
    applicants: (applicants ?? []).map((a: any) => ({
      id: a.id,
      influencerId: a.influencer_id,
      influencerName: a.influencer?.profile?.full_name ?? '알 수 없음',
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
    console.error('Schema validation error:', parsed.error.format());
    return failure(500, campaignAdminErrorCodes.APPLICANTS_FETCH_FAILED, '지원자 데이터 형식이 올바르지 않습니다.', parsed.error.format());
  }

  return success(parsed.data);
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
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, advertiser_id, status, start_date')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return failure(404, campaignAdminErrorCodes.CAMPAIGN_NOT_FOUND, '체험단을 찾을 수 없습니다.');
  }
  if (campaign.advertiser_id !== userId) {
    return failure(403, campaignAdminErrorCodes.UNAUTHORIZED, '권한이 없습니다.');
  }

  if (status === '모집종료' && campaign.status !== '모집중') {
    return failure(400, campaignAdminErrorCodes.STATUS_UPDATE_FAILED, '모집중 상태에서만 모집을 종료할 수 있습니다.');
  }

  if (status === '조기종료') {
    const startDate = new Date(campaign.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today < startDate) {
      return failure(400, campaignAdminErrorCodes.STATUS_UPDATE_FAILED, '시작일 이전에는 조기 종료를 할 수 없습니다.');
    }

    if (campaign.status !== '모집중') {
      return failure(400, campaignAdminErrorCodes.STATUS_UPDATE_FAILED, '모집중 상태에서만 조기 종료할 수 있습니다.');
    }
  }

  const patch: Record<string, unknown> = { status };

  if (status === '조기종료') {
    const todayIso = new Date().toISOString().slice(0, 10);
    patch.early_termination_date = todayIso;
    patch.early_termination_reason = reason ?? null;
  }

  if (status === '모집종료') {
    patch.early_termination_date = null;
    patch.early_termination_reason = null;
  }

  const { data: updated, error } = await supabase
    .from('campaigns')
    .update(patch)
    .eq('id', campaignId)
    .select('id, status')
    .single();

  if (error || !updated) {
    return failure(500, campaignAdminErrorCodes.STATUS_UPDATE_FAILED, '상태 변경에 실패했습니다.', error?.message);
  }

  return success({ id: updated.id, status: updated.status });
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
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, advertiser_id, status, recruitment_count')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return failure(404, campaignAdminErrorCodes.CAMPAIGN_NOT_FOUND, '체험단을 찾을 수 없습니다.');
  }
  if (campaign.advertiser_id !== userId) {
    return failure(403, campaignAdminErrorCodes.UNAUTHORIZED, '권한이 없습니다.');
  }
  if (campaign.status !== '모집종료') {
    return failure(400, campaignAdminErrorCodes.CAMPAIGN_NOT_RECRUITING, '모집 종료 이후에만 인플루언서를 선정할 수 있습니다.');
  }

  const parsed = InfluencerSelectionSchema.safeParse({ selectedInfluencerIds });
  if (!parsed.success) {
    return failure(400, campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, '입력값이 올바르지 않습니다.', parsed.error.format());
  }

  const uniqueInfluencerIds = Array.from(new Set(parsed.data.selectedInfluencerIds));

  const { data: existingSelections, error: selectionFetchError } = await supabase
    .from('applications')
    .select('influencer_id, status')
    .eq('campaign_id', campaignId)
    .in('influencer_id', uniqueInfluencerIds);

  if (selectionFetchError) {
    return failure(500, campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, '선정 대상 조회에 실패했습니다.', selectionFetchError.message);
  }

  if (!existingSelections || existingSelections.length !== uniqueInfluencerIds.length) {
    return failure(400, campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, '선택된 지원자 정보를 찾을 수 없습니다.');
  }

  const invalidStatus = existingSelections.find((application) => application.status !== '신청완료');
  if (invalidStatus) {
    return failure(400, campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, '이미 처리된 지원자가 포함되어 있습니다.');
  }

  const { count: currentSelectedCount, error: currentSelectedError } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', '선정');

  if (currentSelectedError) {
    return failure(500, campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, '선정 현황 확인에 실패했습니다.', currentSelectedError.message);
  }

  const alreadySelected = currentSelectedCount ?? 0;
  if (alreadySelected + uniqueInfluencerIds.length > campaign.recruitment_count) {
    return failure(400, campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, '모집 인원을 초과하여 선정할 수 없습니다.');
  }

  const { data: updated, error: updateError } = await supabase
    .from('applications')
    .update({ status: '선정' })
    .eq('campaign_id', campaignId)
    .in('influencer_id', uniqueInfluencerIds)
    .eq('status', '신청완료')
    .select('id');

  if (updateError) {
    return failure(500, campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, '선정 처리에 실패했습니다.', updateError.message);
  }

  const updatedCount = Array.isArray(updated) ? updated.length : 0;
  if (updatedCount === 0) {
    return failure(400, campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, '선정 가능한 지원자가 없습니다.');
  }

  const totalSelected = alreadySelected + updatedCount;

  if (totalSelected >= campaign.recruitment_count) {
    const { error: statusUpdateError } = await supabase
      .from('campaigns')
      .update({ status: '선정완료' })
      .eq('id', campaignId);

    if (statusUpdateError) {
      return failure(500, campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, '선정 상태 변경에 실패했습니다.', statusUpdateError.message);
    }
  }

  return success({ updated: updatedCount });
}

/**
 * 인플루언서 반려 서비스 로직
 */
export async function rejectInfluencers(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  rejectedInfluencerIds: string[]
): Promise<SuccessResult<{ updated: number }> | ErrorResult<CampaignAdminErrorCode, unknown>> {
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, advertiser_id, status')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return failure(404, campaignAdminErrorCodes.CAMPAIGN_NOT_FOUND, '체험단을 찾을 수 없습니다.');
  }
  if (campaign.advertiser_id !== userId) {
    return failure(403, campaignAdminErrorCodes.UNAUTHORIZED, '권한이 없습니다.');
  }
  if (campaign.status !== '모집종료') {
    return failure(400, campaignAdminErrorCodes.CAMPAIGN_NOT_RECRUITING, '모집 종료 이후에만 반려 처리할 수 있습니다.');
  }

  const parsed = InfluencerRejectionSchema.safeParse({ rejectedInfluencerIds });
  if (!parsed.success) {
    return failure(400, campaignAdminErrorCodes.REJECTION_UPDATE_FAILED, '입력값이 올바르지 않습니다.', parsed.error.format());
  }

  const uniqueInfluencerIds = Array.from(new Set(parsed.data.rejectedInfluencerIds));

  const { data: existingApplications, error: fetchError } = await supabase
    .from('applications')
    .select('influencer_id, status')
    .eq('campaign_id', campaignId)
    .in('influencer_id', uniqueInfluencerIds);

  if (fetchError) {
    return failure(500, campaignAdminErrorCodes.REJECTION_UPDATE_FAILED, '반려 대상 조회에 실패했습니다.', fetchError.message);
  }

  if (!existingApplications || existingApplications.length !== uniqueInfluencerIds.length) {
    return failure(400, campaignAdminErrorCodes.REJECTION_UPDATE_FAILED, '선택된 지원자 정보를 찾을 수 없습니다.');
  }

  const invalidStatus = existingApplications.find((application) => application.status !== '신청완료');
  if (invalidStatus) {
    return failure(400, campaignAdminErrorCodes.REJECTION_UPDATE_FAILED, '이미 처리된 지원자가 포함되어 있습니다.');
  }

  const { data: updated, error: updateError } = await supabase
    .from('applications')
    .update({ status: '반려' })
    .eq('campaign_id', campaignId)
    .in('influencer_id', uniqueInfluencerIds)
    .eq('status', '신청완료')
    .select('id');

  if (updateError) {
    return failure(500, campaignAdminErrorCodes.REJECTION_UPDATE_FAILED, '반려 처리에 실패했습니다.', updateError.message);
  }

  const updatedCount = Array.isArray(updated) ? updated.length : 0;
  if (updatedCount === 0) {
    return failure(400, campaignAdminErrorCodes.REJECTION_UPDATE_FAILED, '반려 가능한 지원자가 없습니다.');
  }

  return success({ updated: updatedCount });
}
