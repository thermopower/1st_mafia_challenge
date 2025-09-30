import { z } from 'zod';
import { validateStringLength } from '@/lib/validation/business-utils';

export const CampaignCreateInputSchema = z.object({
  title: z.string().refine((title) => {
    const result = validateStringLength(title, '체험명', 1, 100);
    return result.isValid;
  }, {
    message: '체험명은 1-100자 사이로 입력해주세요.'
  }),
  description: z.string().refine((description) => {
    const result = validateStringLength(description, '설명', 1, 2000);
    return result.isValid;
  }, {
    message: '설명은 1-2000자 사이로 입력해주세요.'
  }),
  mission: z.string().refine((mission) => {
    const result = validateStringLength(mission, '미션', 1, 1000);
    return result.isValid;
  }, {
    message: '미션은 1-1000자 사이로 입력해주세요.'
  }),
  benefits: z.string().refine((benefits) => {
    const result = validateStringLength(benefits, '혜택', 1, 1000);
    return result.isValid;
  }, {
    message: '혜택은 1-1000자 사이로 입력해주세요.'
  }),
  location: z.string().refine((location) => {
    const result = validateStringLength(location, '주소', 1, 255);
    return result.isValid;
  }, {
    message: '주소는 1-255자 사이로 입력해주세요.'
  }),
  recruitmentCount: z.number()
    .min(1, '모집 인원은 최소 1명 이상이어야 합니다.')
    .max(1000, '모집 인원은 최대 1000명까지 가능합니다.'),
  startDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    if (Number.isNaN(selectedDate.getTime())) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, {
    message: '시작일은 오늘 이후 날짜여야 합니다.'
  }),
  endDate: z.string()
}).superRefine((data, ctx) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (Number.isNaN(startDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: '시작일이 올바르지 않습니다.'
    });
  }

  if (Number.isNaN(endDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: '종료일이 올바르지 않습니다.'
    });
    return;
  }

  if (!Number.isNaN(startDate.getTime()) && endDate <= startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: '종료일은 시작일 이후 날짜여야 합니다.'
    });
  }
});

export const CampaignCreateResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  mission: z.string(),
  benefits: z.string(),
  location: z.string(),
  recruitmentCount: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['모집중', '모집종료', '진행완료', '조기종료']),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const AdvertiserCampaignsResponseSchema = z.object({
  campaigns: z.array(z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(['모집중', '모집종료', '진행완료', '조기종료']),
    recruitmentCount: z.number(),
    startDate: z.string(),
    endDate: z.string(),
    createdAt: z.string(),
    applicationCount: z.number(),
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const campaignCreateErrorCodes = {
  CAMPAIGN_CREATION_FAILED: 'CAMPAIGN_CREATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  ADVERTISER_PROFILE_NOT_FOUND: 'ADVERTISER_PROFILE_NOT_FOUND',
  CAMPAIGNS_FETCH_FAILED: 'CAMPAIGNS_FETCH_FAILED'
} as const;

export type CampaignCreateErrorCode = typeof campaignCreateErrorCodes[keyof typeof campaignCreateErrorCodes];
