import { z } from 'zod';
import { UserRole, AuthMethod } from '@/features/auth/types';

// 회원가입 입력 스키마
export const SignupInputSchema = z.object({
  fullName: z.string().min(1, '이름을 입력해주세요.').max(50, '이름은 최대 50자까지 입력 가능합니다.'),
  // 휴대폰번호: 01012345678 또는 010-1234-5678 모두 허용하고, 서버에서 010-1234-5678로 표준화
  phone: z
    .string()
    .trim()
    .refine((value) => /^010\d{8}$/.test(value.replace(/\D/g, '')), {
      message: '올바른 휴대폰번호 형식이 아닙니다.'
    })
    .transform((value) => {
      const digits = value.replace(/\D/g, '');
      return `010-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }),
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  userRole: z.enum(['advertiser', 'influencer'], {
    errorMap: () => ({ message: '광고주 또는 인플루언서를 선택해주세요.' })
  }),
  authMethod: z.enum(['email', 'external'], {
    errorMap: () => ({ message: '인증 방식을 선택해주세요.' })
  }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: '약관에 동의해주세요.'
  })
});

// 회원가입 응답 스키마
export const SignupResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  userRole: z.enum(['advertiser', 'influencer']),
  authMethod: z.enum(['email', 'external']),
  needsVerification: z.boolean(),
  redirectTo: z.string()
});

// 회원가입 에러 코드
export const signupErrorCodes = {
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  DUPLICATE_PHONE: 'DUPLICATE_PHONE',
  INVALID_EMAIL_FORMAT: 'INVALID_EMAIL_FORMAT',
  INVALID_PHONE_FORMAT: 'INVALID_PHONE_FORMAT',
  AUTH_METHOD_MISMATCH: 'AUTH_METHOD_MISMATCH',
  VERIFICATION_EMAIL_FAILED: 'VERIFICATION_EMAIL_FAILED',
  USER_CREATION_FAILED: 'USER_CREATION_FAILED',
  PROFILE_CREATION_FAILED: 'PROFILE_CREATION_FAILED'
} as const;

export type SignupErrorCode = typeof signupErrorCodes[keyof typeof signupErrorCodes];
