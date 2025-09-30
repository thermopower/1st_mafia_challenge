import { z } from 'zod';
import { validateBusinessNumber, validatePhoneNumber, validateStringLength } from '@/lib/validation/business-utils';

// 광고주 프로필 입력 스키마
export const AdvertiserProfileInputSchema = z.object({
  companyName: z.string().refine((name) => {
    const result = validateStringLength(name, '업체명', 1, 100);
    return result.isValid;
  }, {
    message: '업체명은 1-100자 사이로 입력해주세요.'
  }),
  address: z.string().refine((address) => {
    const result = validateStringLength(address, '주소', 1, 255);
    return result.isValid;
  }, {
    message: '주소는 1-255자 사이로 입력해주세요.'
  }),
  phone: z.string().refine((phone) => {
    const result = validatePhoneNumber(phone);
    return result.isValid;
  }, {
    message: '올바른 전화번호 형식이 아닙니다.'
  }),
  businessNumber: z.string().refine((businessNumber) => {
    const result = validateBusinessNumber(businessNumber);
    return result.isValid;
  }, {
    message: '올바른 사업자등록번호 형식이 아닙니다.'
  }),
  representativeName: z.string().refine((name) => {
    const result = validateStringLength(name, '대표자명', 1, 50);
    return result.isValid;
  }, {
    message: '대표자명은 1-50자 사이로 입력해주세요.'
  }),
  category: z.string().refine((category) => {
    const result = validateStringLength(category, '카테고리', 1, 50);
    return result.isValid;
  }, {
    message: '카테고리는 1-50자 사이로 입력해주세요.'
  })
});

// 광고주 프로필 응답 스키마
export const AdvertiserProfileResponseSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  address: z.string(),
  phone: z.string(),
  businessNumber: z.string(),
  representativeName: z.string(),
  category: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// 광고주 프로필 업데이트 스키마
export const AdvertiserProfileUpdateSchema = AdvertiserProfileInputSchema.partial();

// 광고주 프로필 에러 코드
export const advertiserProfileErrorCodes = {
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  DUPLICATE_BUSINESS_NUMBER: 'DUPLICATE_BUSINESS_NUMBER',
  INVALID_BUSINESS_NUMBER: 'INVALID_BUSINESS_NUMBER',
  INVALID_PHONE_NUMBER: 'INVALID_PHONE_NUMBER',
  PROFILE_CREATION_FAILED: 'PROFILE_CREATION_FAILED',
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const;

export type AdvertiserProfileErrorCode = typeof advertiserProfileErrorCodes[keyof typeof advertiserProfileErrorCodes];
