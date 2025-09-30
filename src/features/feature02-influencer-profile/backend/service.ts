import type { SupabaseClient } from '@supabase/supabase-js';
import {
  InfluencerProfileInputSchema,
  InfluencerProfileResponseSchema,
  influencerProfileErrorCodes,
  type InfluencerProfileErrorCode
} from './schema';
import { validateSNSUrl } from '@/lib/validation/sns-utils';
import type { ErrorResult, SuccessResult } from '@/backend/http/response';

export interface InfluencerProfileInput {
  birthDate: string;
  snsChannelName: string;
  snsChannelUrl: string;
  followerCount: number;
}

export interface InfluencerProfileResult {
  id: string;
  birthDate: string;
  snsChannelName: string;
  snsChannelUrl: string;
  followerCount: number;
  verificationStatus: 'pending' | 'verified' | 'failed';
  createdAt: string;
  updatedAt: string;
}

/**
 * 인플루언서 프로필 생성 서비스 로직
 */
export async function createInfluencerProfile(
  supabase: SupabaseClient,
  userId: string,
  input: InfluencerProfileInput
): Promise<SuccessResult<InfluencerProfileResult> | ErrorResult<InfluencerProfileErrorCode, unknown>> {
  try {
    // 입력값 검증
    const validationResult = InfluencerProfileInputSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        ok: false,
        error: {
          code: influencerProfileErrorCodes.INVALID_SNS_URL,
          message: '입력값이 올바르지 않습니다.',
          details: validationResult.error.format()
        }
      };
    }

    const { birthDate, snsChannelName, snsChannelUrl, followerCount } = validationResult.data;

    // SNS URL 검증 및 플랫폼 추출
    const snsValidation = validateSNSUrl(snsChannelUrl);
    if (!snsValidation.isValid) {
      return {
        ok: false,
        error: {
          code: influencerProfileErrorCodes.INVALID_SNS_URL,
          message: snsValidation.error || 'SNS URL이 올바르지 않습니다.'
        }
      };
    }

    // 중복 채널명 검사 (플랫폼별로 유니크해야 함)
    const { data: existingChannel } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('sns_channel_name', snsChannelName)
      .single();

    if (existingChannel) {
      return {
        ok: false,
        error: {
          code: influencerProfileErrorCodes.DUPLICATE_CHANNEL,
          message: '이미 사용중인 채널명입니다.'
        }
      };
    }

    // 인플루언서 프로필 생성
    const { data: profileData, error: profileError } = await supabase
      .from('influencer_profiles')
      .insert({
        id: userId,
        birth_date: birthDate,
        sns_channel_name: snsChannelName,
        sns_channel_url: snsChannelUrl,
        follower_count: followerCount,
        verification_status: 'pending'
      })
      .select()
      .single();

    if (profileError || !profileData) {
      return {
        ok: false,
        error: {
          code: influencerProfileErrorCodes.PROFILE_CREATION_FAILED,
          message: '인플루언서 프로필 생성에 실패했습니다.'
        }
      };
    }

    // 사용자 프로필의 완료 상태 업데이트
    await supabase
      .from('user_profiles')
      .update({ is_profile_completed: true })
      .eq('id', userId);

    const result: InfluencerProfileResult = {
      id: profileData.id,
      birthDate: profileData.birth_date,
      snsChannelName: profileData.sns_channel_name,
      snsChannelUrl: profileData.sns_channel_url,
      followerCount: profileData.follower_count,
      verificationStatus: profileData.verification_status,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at
    };

    return {
      ok: true,
      data: result
    };

  } catch (error) {
    return {
      ok: false,
      error: {
        code: influencerProfileErrorCodes.PROFILE_CREATION_FAILED,
        message: '인플루언서 프로필 생성 중 오류가 발생했습니다.'
      }
    };
  }
}

/**
 * 인플루언서 프로필 조회 서비스 로직
 */
export async function getInfluencerProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<SuccessResult<InfluencerProfileResult> | ErrorResult<InfluencerProfileErrorCode, unknown>> {
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('influencer_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      return {
        ok: false,
        error: {
          code: influencerProfileErrorCodes.PROFILE_NOT_FOUND,
          message: '인플루언서 프로필을 찾을 수 없습니다.'
        }
      };
    }

    const result: InfluencerProfileResult = {
      id: profileData.id,
      birthDate: profileData.birth_date,
      snsChannelName: profileData.sns_channel_name,
      snsChannelUrl: profileData.sns_channel_url,
      followerCount: profileData.follower_count,
      verificationStatus: profileData.verification_status,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at
    };

    return {
      ok: true,
      data: result
    };

  } catch (error) {
    return {
      ok: false,
      error: {
        code: influencerProfileErrorCodes.PROFILE_NOT_FOUND,
        message: '프로필 조회 중 오류가 발생했습니다.'
      }
    };
  }
}

/**
 * 인플루언서 프로필 업데이트 서비스 로직
 */
export async function updateInfluencerProfile(
  supabase: SupabaseClient,
  userId: string,
  input: Partial<InfluencerProfileInput>
): Promise<SuccessResult<InfluencerProfileResult> | ErrorResult<InfluencerProfileErrorCode, unknown>> {
  try {
    // 현재 프로필 조회
    const currentProfile = await getInfluencerProfile(supabase, userId);
    if (!currentProfile.ok) {
      return currentProfile;
    }

    // 업데이트할 데이터 구성
    const updateData: any = {};

    if (input.birthDate !== undefined) {
      updateData.birth_date = input.birthDate;
    }

    if (input.snsChannelName !== undefined) {
      // 채널명 중복 검사 (현재 사용자가 아닌 경우만)
      if (input.snsChannelName !== currentProfile.data.snsChannelName) {
        const { data: existingChannel } = await supabase
          .from('influencer_profiles')
          .select('id')
          .eq('sns_channel_name', input.snsChannelName)
          .neq('id', userId)
          .single();

        if (existingChannel) {
          return {
            ok: false,
            error: {
              code: influencerProfileErrorCodes.DUPLICATE_CHANNEL,
              message: '이미 사용중인 채널명입니다.'
            }
          };
        }
      }
      updateData.sns_channel_name = input.snsChannelName;
    }

    if (input.snsChannelUrl !== undefined) {
      const snsValidation = validateSNSUrl(input.snsChannelUrl);
      if (!snsValidation.isValid) {
        return {
          ok: false,
          error: {
            code: influencerProfileErrorCodes.INVALID_SNS_URL,
            message: snsValidation.error || 'SNS URL이 올바르지 않습니다.'
          }
        };
      }
      updateData.sns_channel_url = input.snsChannelUrl;
    }

    if (input.followerCount !== undefined) {
      updateData.follower_count = input.followerCount;
    }

    // 업데이트 실행
    const { data: updatedProfile, error: updateError } = await supabase
      .from('influencer_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      return {
        ok: false,
        error: {
          code: influencerProfileErrorCodes.PROFILE_UPDATE_FAILED,
          message: '프로필 업데이트에 실패했습니다.'
        }
      };
    }

    const result: InfluencerProfileResult = {
      id: updatedProfile.id,
      birthDate: updatedProfile.birth_date,
      snsChannelName: updatedProfile.sns_channel_name,
      snsChannelUrl: updatedProfile.sns_channel_url,
      followerCount: updatedProfile.follower_count,
      verificationStatus: updatedProfile.verification_status,
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at
    };

    return {
      ok: true,
      data: result
    };

  } catch (error) {
    return {
      ok: false,
      error: {
        code: influencerProfileErrorCodes.PROFILE_UPDATE_FAILED,
        message: '프로필 업데이트 중 오류가 발생했습니다.'
      }
    };
  }
}
