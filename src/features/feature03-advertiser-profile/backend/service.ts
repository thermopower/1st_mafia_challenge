import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AdvertiserProfileInputSchema,
  AdvertiserProfileResponseSchema,
  advertiserProfileErrorCodes,
  type AdvertiserProfileErrorCode
} from './schema';
import { success, failure, type ErrorResult, type SuccessResult } from '@/backend/http/response';

export interface AdvertiserProfileInput {
  companyName: string;
  address: string;
  phone: string;
  businessNumber: string;
  representativeName: string;
  category: string;
}

export interface AdvertiserProfileResult {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  businessNumber: string;
  representativeName: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 광고주 프로필 생성 서비스 로직
 */
export async function createAdvertiserProfile(
  supabase: SupabaseClient,
  userId: string,
  input: AdvertiserProfileInput
): Promise<SuccessResult<AdvertiserProfileResult> | ErrorResult<AdvertiserProfileErrorCode, unknown>> {
  try {
    // 입력값 검증
    const validationResult = AdvertiserProfileInputSchema.safeParse(input);
    if (!validationResult.success) {
      return failure(
        400,
        advertiserProfileErrorCodes.INVALID_BUSINESS_NUMBER,
        '입력값이 올바르지 않습니다.',
        validationResult.error.format()
      );
    }

    const { companyName, address, phone, businessNumber, representativeName, category } = validationResult.data;

    // 사업자등록번호 중복 검사
    const { data: existingBusiness } = await supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('business_number', businessNumber)
      .single();

    if (existingBusiness) {
      return failure(
        409,
        advertiserProfileErrorCodes.DUPLICATE_BUSINESS_NUMBER,
        '이미 등록된 사업자등록번호입니다.'
      );
    }

    // 광고주 프로필 생성
    const { data: profileData, error: profileError } = await supabase
      .from('advertiser_profiles')
      .insert({
        id: userId,
        company_name: companyName,
        address,
        phone,
        business_number: businessNumber,
        representative_name: representativeName,
        category
      })
      .select()
      .single();

    if (profileError || !profileData) {
      return failure(
        500,
        advertiserProfileErrorCodes.PROFILE_CREATION_FAILED,
        '광고주 프로필 생성에 실패했습니다.'
      );
    }

    // 사용자 프로필의 완료 상태 업데이트
    await supabase
      .from('user_profiles')
      .update({ is_profile_completed: true })
      .eq('id', userId);

    const result: AdvertiserProfileResult = {
      id: profileData.id,
      companyName: profileData.company_name,
      address: profileData.address,
      phone: profileData.phone,
      businessNumber: profileData.business_number,
      representativeName: profileData.representative_name,
      category: profileData.category,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at
    };

    return success(result, 201);

  } catch (error) {
    return failure(
      500,
      advertiserProfileErrorCodes.PROFILE_CREATION_FAILED,
      '광고주 프로필 생성 중 오류가 발생했습니다.'
    );
  }
}

/**
 * 광고주 프로필 조회 서비스 로직
 */
export async function getAdvertiserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<SuccessResult<AdvertiserProfileResult> | ErrorResult<AdvertiserProfileErrorCode, unknown>> {
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('advertiser_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      return failure(
        404,
        advertiserProfileErrorCodes.PROFILE_NOT_FOUND,
        '광고주 프로필을 찾을 수 없습니다.'
      );
    }

    const result: AdvertiserProfileResult = {
      id: profileData.id,
      companyName: profileData.company_name,
      address: profileData.address,
      phone: profileData.phone,
      businessNumber: profileData.business_number,
      representativeName: profileData.representative_name,
      category: profileData.category,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at
    };

    return success(result);

  } catch (error) {
    return failure(
      500,
      advertiserProfileErrorCodes.PROFILE_NOT_FOUND,
      '프로필 조회 중 오류가 발생했습니다.'
    );
  }
}

/**
 * 광고주 프로필 업데이트 서비스 로직
 */
export async function updateAdvertiserProfile(
  supabase: SupabaseClient,
  userId: string,
  input: Partial<AdvertiserProfileInput>
): Promise<SuccessResult<AdvertiserProfileResult> | ErrorResult<AdvertiserProfileErrorCode, unknown>> {
  try {
    // 현재 프로필 조회
    const currentProfile = await getAdvertiserProfile(supabase, userId);
    if (!currentProfile.ok) {
      return currentProfile;
    }

    // 업데이트할 데이터 구성
    const updateData: any = {};

    if (input.companyName !== undefined) {
      updateData.company_name = input.companyName;
    }

    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }

    if (input.businessNumber !== undefined) {
      // 사업자등록번호 중복 검사 (현재 사용자가 아닌 경우만)
      if (input.businessNumber !== currentProfile.data.businessNumber) {
        const { data: existingBusiness } = await supabase
          .from('advertiser_profiles')
          .select('id')
          .eq('business_number', input.businessNumber)
          .neq('id', userId)
          .single();

        if (existingBusiness) {
          return failure(
            409,
            advertiserProfileErrorCodes.DUPLICATE_BUSINESS_NUMBER,
            '이미 등록된 사업자등록번호입니다.'
          );
        }
      }
      updateData.business_number = input.businessNumber;
    }

    if (input.representativeName !== undefined) {
      updateData.representative_name = input.representativeName;
    }

    if (input.category !== undefined) {
      updateData.category = input.category;
    }

    // 업데이트 실행
    const { data: updatedProfile, error: updateError } = await supabase
      .from('advertiser_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      return failure(
        500,
        advertiserProfileErrorCodes.PROFILE_UPDATE_FAILED,
        '프로필 업데이트에 실패했습니다.'
      );
    }

    const result: AdvertiserProfileResult = {
      id: updatedProfile.id,
      companyName: updatedProfile.company_name,
      address: updatedProfile.address,
      phone: updatedProfile.phone,
      businessNumber: updatedProfile.business_number,
      representativeName: updatedProfile.representative_name,
      category: updatedProfile.category,
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at
    };

    return success(result);

  } catch (error) {
    return failure(
      500,
      advertiserProfileErrorCodes.PROFILE_UPDATE_FAILED,
      '프로필 업데이트 중 오류가 발생했습니다.'
    );
  }
}
