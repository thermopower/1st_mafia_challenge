import { z } from 'zod';

// 내 지원 목록 조회 쿼리 스키마
export const MyApplicationsQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  status: z.enum(['신청완료', '선정', '반려']).optional(),
  sortBy: z.enum(['applied_at', 'updated_at']).default('applied_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// 내 지원 목록 응답 스키마
export const MyApplicationsResponseSchema = z.object({
  applications: z.array(z.object({
    id: z.string(),
    campaignId: z.string(),
    campaignTitle: z.string(),
    companyName: z.string(),
    status: z.enum(['신청완료', '선정', '반려']),
    appliedAt: z.string(),
    updatedAt: z.string(),
    visitDate: z.string(),
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

// 내 지원 목록 에러 코드
export const myApplicationsErrorCodes = {
  INVALID_QUERY_PARAMS: 'INVALID_QUERY_PARAMS',
  APPLICATIONS_FETCH_FAILED: 'APPLICATIONS_FETCH_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  USER_NOT_INFLUENCER: 'USER_NOT_INFLUENCER'
} as const;

export type MyApplicationsErrorCode = typeof myApplicationsErrorCodes[keyof typeof myApplicationsErrorCodes];
