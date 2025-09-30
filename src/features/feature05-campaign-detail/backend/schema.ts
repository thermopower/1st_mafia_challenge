import { z } from 'zod';

// 체험단 상세 조회 응답 스키마
export const CampaignDetailResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  mission: z.string(),
  benefits: z.string(),
  location: z.string(),
  recruitmentCount: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['모집중', '모집종료', '선정완료', '조기종료']),
  advertiser: z.object({
    companyName: z.string(),
    category: z.string(),
  }),
  canApply: z.boolean(),
});

// 체험단 상세 에러 코드
export const campaignDetailErrorCodes = {
  CAMPAIGN_NOT_FOUND: 'CAMPAIGN_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  CAMPAIGN_FETCH_FAILED: 'CAMPAIGN_FETCH_FAILED'
} as const;

export type CampaignDetailErrorCode = typeof campaignDetailErrorCodes[keyof typeof campaignDetailErrorCodes];
