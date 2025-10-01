import { z } from 'zod';
import { validateStringLength } from '@/lib/validation/business-utils';

const campaignStatusSchema = z.enum(['모집중', '조기종료', '모집종료', '선정완료']);

const campaignWriteSchema = z
  .object({
    title: z
      .string()
      .refine((value) => validateStringLength(value, '제목', 1, 100).isValid, {
        message: '제목은 1-100자 범위로 입력해주세요.',
      }),
    description: z
      .string()
      .refine((value) => validateStringLength(value, '설명', 1, 2000).isValid, {
        message: '설명은 1-2000자 범위로 입력해주세요.',
      }),
    mission: z
      .string()
      .refine((value) => validateStringLength(value, '미션', 1, 1000).isValid, {
        message: '미션은 1-1000자 범위로 입력해주세요.',
      }),
    benefits: z
      .string()
      .refine((value) => validateStringLength(value, '혜택', 1, 1000).isValid, {
        message: '혜택은 1-1000자 범위로 입력해주세요.',
      }),
    location: z
      .string()
      .refine((value) => validateStringLength(value, '주소', 1, 255).isValid, {
        message: '주소는 1-255자 범위로 입력해주세요.',
      }),
    recruitmentCount: z
      .number()
      .min(1, '모집 인원은 최소 1명 이상이어야 합니다.')
      .max(1000, '모집 인원은 최대 1000명까지 가능합니다.'),
    startDate: z.string(),
    endDate: z.string(),
  })
  .superRefine((data, ctx) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (Number.isNaN(startDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startDate'],
        message: '시작일이 올바르지 않습니다.',
      });
    }

    if (Number.isNaN(endDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: '종료일이 올바르지 않습니다.',
      });
      return;
    }

    if (!Number.isNaN(startDate.getTime()) && endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: '종료일은 시작일 이후 날짜여야 합니다.',
      });
    }
  });

export const CampaignCreateInputSchema = campaignWriteSchema;
export const CampaignUpdateInputSchema = campaignWriteSchema;

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
  status: campaignStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CampaignCreateResponseSchema = CampaignDetailResponseSchema;

export const AdvertiserCampaignsResponseSchema = z.object({
  campaigns: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: campaignStatusSchema,
      recruitmentCount: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      createdAt: z.string(),
      applicationCount: z.number(),
    }),
  ),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const CampaignDeleteResponseSchema = z.object({
  id: z.string(),
});

export const campaignCreateErrorCodes = {
  CAMPAIGN_CREATION_FAILED: 'CAMPAIGN_CREATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  ADVERTISER_PROFILE_NOT_FOUND: 'ADVERTISER_PROFILE_NOT_FOUND',
  CAMPAIGNS_FETCH_FAILED: 'CAMPAIGNS_FETCH_FAILED',
  CAMPAIGN_LIMIT_EXCEEDED: 'CAMPAIGN_LIMIT_EXCEEDED',
  CAMPAIGN_NOT_FOUND: 'CAMPAIGN_NOT_FOUND',
  CAMPAIGN_UPDATE_FAILED: 'CAMPAIGN_UPDATE_FAILED',
  CAMPAIGN_DELETE_FAILED: 'CAMPAIGN_DELETE_FAILED',
  CAMPAIGN_STATUS_LOCKED: 'CAMPAIGN_STATUS_LOCKED',
} as const;

export type CampaignCreateErrorCode =
  (typeof campaignCreateErrorCodes)[keyof typeof campaignCreateErrorCodes];