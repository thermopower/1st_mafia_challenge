import { z } from 'zod';
import { validateStringLength } from '@/lib/validation/business-utils';

// 체험단 지원 입력 스키마
export const ApplicationInputSchema = z.object({
  campaignId: z.string().min(1, '체험단 ID가 필요합니다.'),
  motivation: z.string().refine((motivation) => {
    const result = validateStringLength(motivation, '각오 한마디', 10, 1000);
    return result.isValid;
  }, {
    message: '각오 한마디는 10-1000자 사이로 입력해주세요.'
  }),
  visitDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, {
    message: '방문 예정일은 오늘 이후 날짜만 선택 가능합니다.'
  })
});

// 체험단 지원 응답 스키마
export const ApplicationResponseSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  influencerId: z.string(),
  motivation: z.string(),
  visitDate: z.string(),
  status: z.enum(['신청완료', '선정', '반려']),
  appliedAt: z.string(),
  updatedAt: z.string()
});

// 체험단 지원 에러 코드
export const applicationErrorCodes = {
  DUPLICATE_APPLICATION: 'DUPLICATE_APPLICATION',
  CAMPAIGN_NOT_FOUND: 'CAMPAIGN_NOT_FOUND',
  CAMPAIGN_NOT_RECRUITING: 'CAMPAIGN_NOT_RECRUITING',
  INFLUENCER_PROFILE_NOT_FOUND: 'INFLUENCER_PROFILE_NOT_FOUND',
  INVALID_VISIT_DATE: 'INVALID_VISIT_DATE',
  APPLICATION_CREATION_FAILED: 'APPLICATION_CREATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const;

export type ApplicationErrorCode = typeof applicationErrorCodes[keyof typeof applicationErrorCodes];
