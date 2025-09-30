import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ApplicationInputSchema,
  applicationErrorCodes,
  type ApplicationErrorCode
} from './schema';
import type { ErrorResult, SuccessResult } from '@/backend/http/response';

export interface ApplicationInput {
  campaignId: string;
  motivation: string;
  visitDate: string;
}

export interface ApplicationResult {
  id: string;
  campaignId: string;
  influencerId: string;
  motivation: string;
  visitDate: string;
  status: '신청완료' | '선정' | '반려';
  appliedAt: string;
  updatedAt: string;
}

/**
 * 체험단 지원 서비스 로직
 */
export async function createApplication(
  supabase: SupabaseClient,
  userId: string,
  input: ApplicationInput
): Promise<SuccessResult<ApplicationResult> | ErrorResult<ApplicationErrorCode, unknown>> {
  try {
    // 입력값 검증
    const validationResult = ApplicationInputSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        ok: false,
        error: {
          code: applicationErrorCodes.INVALID_VISIT_DATE,
          message: '입력값이 올바르지 않습니다.',
          details: validationResult.error.format()
        }
      };
    }

    const { campaignId, motivation, visitDate } = validationResult.data;

    // 사용자 인증 확인 (인플루언서 프로필 존재 확인)
    const { data: influencerProfile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!influencerProfile) {
      return {
        ok: false,
        error: {
          code: applicationErrorCodes.INFLUENCER_PROFILE_NOT_FOUND,
          message: '인플루언서 프로필이 등록되지 않았습니다.'
        }
      };
    }

    // 체험단 정보 확인
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, status, end_date, recruitment_count')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return {
        ok: false,
        error: {
          code: applicationErrorCodes.CAMPAIGN_NOT_FOUND,
          message: '체험단을 찾을 수 없습니다.'
        }
      };
    }

    // 모집 상태 확인
    if (campaign.status !== '모집중') {
      return {
        ok: false,
        error: {
          code: applicationErrorCodes.CAMPAIGN_NOT_RECRUITING,
          message: '현재 모집 중인 체험단이 아닙니다.'
        }
      };
    }

    // 모집 기간 확인
    const endDate = new Date(campaign.end_date);
    const selectedDate = new Date(visitDate);

    if (selectedDate > endDate) {
      return {
        ok: false,
        error: {
          code: applicationErrorCodes.INVALID_VISIT_DATE,
          message: '방문 예정일은 모집 마감일 이전이어야 합니다.'
        }
      };
    }

    // 중복 지원 확인
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('influencer_id', userId)
      .single();

    if (existingApplication) {
      return {
        ok: false,
        error: {
          code: applicationErrorCodes.DUPLICATE_APPLICATION,
          message: '이미 이 체험단에 지원했습니다.'
        }
      };
    }

    // 지원 생성
    const { data: applicationData, error: applicationError } = await supabase
      .from('applications')
      .insert({
        campaign_id: campaignId,
        influencer_id: userId,
        motivation,
        visit_date: visitDate,
        status: '신청완료'
      })
      .select()
      .single();

    if (applicationError || !applicationData) {
      return {
        ok: false,
        error: {
          code: applicationErrorCodes.APPLICATION_CREATION_FAILED,
          message: '지원서 제출에 실패했습니다.'
        }
      };
    }

    const result: ApplicationResult = {
      id: applicationData.id,
      campaignId: applicationData.campaign_id,
      influencerId: applicationData.influencer_id,
      motivation: applicationData.motivation,
      visitDate: applicationData.visit_date,
      status: applicationData.status as '신청완료' | '선정' | '반려',
      appliedAt: applicationData.applied_at,
      updatedAt: applicationData.updated_at
    };

    return {
      ok: true,
      data: result
    };

  } catch (error) {
    return {
      ok: false,
      error: {
        code: applicationErrorCodes.APPLICATION_CREATION_FAILED,
        message: '지원서 제출 중 오류가 발생했습니다.'
      }
    };
  }
}
