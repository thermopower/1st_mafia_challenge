import { z } from 'zod';
import { validateSNSUrl, validateChannelName, validateFollowerCount, validateBirthDate } from '@/lib/validation/sns-utils';

// 인플루언서 프로필 입력 스키마
export const InfluencerProfileInputSchema = z.object({
  birthDate: z.string().refine((date) => {
    const result = validateBirthDate(date);
    return result.isValid;
  }, {
    message: '만 14세 이상만 등록 가능합니다.'
  }),
  snsChannelName: z.string().refine((name) => {
    const result = validateChannelName(name);
    return result.isValid;
  }, {
    message: '올바른 채널명이 아닙니다.'
  }),
  snsChannelUrl: z.string().refine((url) => {
    const result = validateSNSUrl(url);
    return result.isValid;
  }, {
    message: '지원하지 않는 플랫폼이거나 잘못된 URL 형식입니다.'
  }),
  followerCount: z.number().refine((count) => {
    const result = validateFollowerCount(count);
    return result.isValid;
  }, {
    message: '팔로워 수는 0 이상이어야 합니다.'
  })
});

// 인플루언서 프로필 응답 스키마
export const InfluencerProfileResponseSchema = z.object({
  id: z.string(),
  birthDate: z.string(),
  snsChannelName: z.string(),
  snsChannelUrl: z.string(),
  followerCount: z.number(),
  verificationStatus: z.enum(['pending', 'verified', 'failed']),
  createdAt: z.string(),
  updatedAt: z.string()
});

// 인플루언서 프로필 업데이트 스키마
export const InfluencerProfileUpdateSchema = InfluencerProfileInputSchema.partial();

// 인플루언서 프로필 에러 코드
export const influencerProfileErrorCodes = {
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  DUPLICATE_CHANNEL: 'DUPLICATE_CHANNEL',
  INVALID_SNS_URL: 'INVALID_SNS_URL',
  INVALID_FOLLOWER_COUNT: 'INVALID_FOLLOWER_COUNT',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  PROFILE_CREATION_FAILED: 'PROFILE_CREATION_FAILED',
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const;

export type InfluencerProfileErrorCode = typeof influencerProfileErrorCodes[keyof typeof influencerProfileErrorCodes];
