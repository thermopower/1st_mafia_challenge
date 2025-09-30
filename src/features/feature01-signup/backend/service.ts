import type { SupabaseClient } from '@supabase/supabase-js';
import { SignupInputSchema, SignupResponseSchema, signupErrorCodes, type SignupErrorCode } from './schema';
import { success, failure, type ErrorResult, type SuccessResult } from '@/backend/http/response';
import type { UserRole, AuthMethod } from '@/features/auth/types';

export interface SignupInput {
  fullName: string;
  phone: string;
  email: string;
  userRole: UserRole;
  authMethod: AuthMethod;
  termsAccepted: boolean;
}

export interface SignupResult {
  userId: string;
  email: string;
  userRole: UserRole;
  authMethod: AuthMethod;
  needsVerification: boolean;
  redirectTo: string;
}

/**
 * 회원가입 서비스 로직
 */
export async function signupUser(
  supabase: SupabaseClient,
  input: SignupInput
): Promise<SuccessResult<SignupResult> | ErrorResult<SignupErrorCode, unknown>> {
  try {
    // 입력값 검증
    const validationResult = SignupInputSchema.safeParse(input);
    if (!validationResult.success) {
      return failure(400, signupErrorCodes.INVALID_EMAIL_FORMAT, '입력값이 올바르지 않습니다.', validationResult.error.format());
    }

    const { fullName, phone, email, userRole, authMethod } = validationResult.data;

    // 이메일 중복 검사는 Supabase Auth 기준으로 수행

    // 휴대폰번호 중복 검사
    const { data: existingPhone } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingPhone) {
      return failure(409, signupErrorCodes.DUPLICATE_PHONE, '이미 사용중인 휴대폰번호입니다.');
    }

    // Supabase Auth 계정 생성 (Service Role: Admin API 사용)
    let authUserId: string | null = null;

    if (authMethod === 'email') {
      // 초대 메일(확인 메일) 발송과 함께 사용자 생성
      const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: fullName,
            phone,
            user_role: userRole,
            auth_method: authMethod,
          },
          // redirectTo는 Supabase 프로젝트 설정값을 사용 (선택적으로 지정 가능)
        },
      );

      if (inviteError || !invited?.user?.id) {
        const isDuplicate = typeof inviteError?.message === 'string' && inviteError.message.toLowerCase().includes('already');
        if (isDuplicate) {
          return failure(409, signupErrorCodes.DUPLICATE_EMAIL, '이미 가입된 이메일입니다.');
        }
        return failure(500, signupErrorCodes.USER_CREATION_FAILED, '사용자 계정 생성에 실패했습니다.');
      }

      authUserId = invited.user.id;
    } else {
      // 외부 인증은 OAuth 로그인 플로우로만 계정이 생성되어야 함
      return failure(400, signupErrorCodes.AUTH_METHOD_MISMATCH, '외부 인증은 소셜 로그인으로 진행해주세요.');
    }

    // 사용자 프로필 생성
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUserId,
        full_name: fullName,
        phone, // 이미 스키마에서 010-1234-5678 형식으로 표준화됨
        email,
        user_role: userRole,
        auth_method: authMethod
      })
      .select()
      .single();

    if (profileError || !profileData) {
      // 실패 시 Auth 계정도 정리 필요 (이메일 인증의 경우)
      if (authUserId) {
        await supabase.auth.admin.deleteUser(authUserId);
      }
      return failure(500, signupErrorCodes.PROFILE_CREATION_FAILED, '사용자 프로필 생성에 실패했습니다.');
    }

    // 응답 데이터 구성
    const result: SignupResult = {
      userId: profileData.id,
      email: profileData.email,
      userRole: profileData.user_role,
      authMethod: profileData.auth_method,
      needsVerification: true,
      redirectTo: '/verify'
    };

    return success(result, 201);

  } catch (error) {
    return failure(500, signupErrorCodes.USER_CREATION_FAILED, '회원가입 처리 중 오류가 발생했습니다.');
  }
}
