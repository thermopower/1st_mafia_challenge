import { z } from 'zod';

// 체험단 목록 조회 쿼리 스키마
export const CampaignListQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  status: z.enum(['모집중', '모집종료', '선정완료', '조기종료']).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  sortBy: z.enum(['created_at', 'start_date', 'end_date', 'recruitment_count']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// 체험단 목록 응답 스키마
export const CampaignListResponseSchema = z.object({
  campaigns: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    recruitmentCount: z.number(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['모집중', '모집종료', '선정완료', '조기종료']),
    createdAt: z.string(),
    advertiser: z.object({
      companyName: z.string(),
      category: z.string(),
    }),
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

// 체험단 카드 응답 스키마 (간단 버전)
export const CampaignCardResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  recruitmentCount: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['모집중', '모집종료', '선정완료', '조기종료']),
  companyName: z.string(),
  category: z.string(),
});

// 체험단 목록 에러 코드
export const campaignListErrorCodes = {
  INVALID_QUERY_PARAMS: 'INVALID_QUERY_PARAMS',
  CAMPAIGNS_FETCH_FAILED: 'CAMPAIGNS_FETCH_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const;

export type CampaignListErrorCode = typeof campaignListErrorCodes[keyof typeof campaignListErrorCodes];
