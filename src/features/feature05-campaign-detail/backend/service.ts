import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CampaignDetailResponseSchema,
  campaignDetailErrorCodes,
  type CampaignDetailErrorCode
} from './schema';
import { success, failure, type ErrorResult, type SuccessResult } from '@/backend/http/response';

export interface CampaignDetailResult {
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
  advertiser: {
    companyName: string;
    category: string;
  };
  canApply: boolean;
}

/**
 * 체험단 상세 조회 서비스 로직
 */
export async function getCampaignDetail(
  supabase: SupabaseClient,
  campaignId: string,
  userId?: string
): Promise<SuccessResult<CampaignDetailResult> | ErrorResult<CampaignDetailErrorCode, unknown>> {
  try {
    // 체험단 정보 조회
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        id,
        title,
        description,
        mission,
        benefits,
        location,
        recruitment_count,
        start_date,
        end_date,
        status,
        advertiser:advertiser_profiles!campaigns_advertiser_id_fkey(
          company_name,
          category
        )
      `)
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaignData) {
      return failure(
        404,
        campaignDetailErrorCodes.CAMPAIGN_NOT_FOUND,
        '체험단을 찾을 수 없습니다.'
      );
    }

    // 사용자 권한 확인 (인플루언서 프로필 등록 여부)
    let canApply = false;
    if (userId) {
      const { data: influencerProfile } = await supabase
        .from('influencer_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      canApply = !!influencerProfile;
    }

    const result: CampaignDetailResult = {
      id: campaignData.id,
      title: campaignData.title,
      description: campaignData.description,
      mission: campaignData.mission,
      benefits: campaignData.benefits,
      location: campaignData.location,
      recruitmentCount: campaignData.recruitment_count,
      startDate: campaignData.start_date,
      endDate: campaignData.end_date,
      status: campaignData.status as '모집중' | '모집종료' | '선정완료' | '조기종료',
      advertiser: {
        companyName: (campaignData.advertiser as any)?.company_name || '알 수 없음',
        category: (campaignData.advertiser as any)?.category || '기타'
      },
      canApply
    };

    return success(result);

  } catch (error) {
    return failure(
      500,
      campaignDetailErrorCodes.CAMPAIGN_FETCH_FAILED,
      '체험단 상세 조회 중 오류가 발생했습니다.'
    );
  }
}
