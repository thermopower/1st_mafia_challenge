import { z } from 'zod';

// 체험단 지원자 목록 조회 응답 스키마
export const CampaignApplicantsResponseSchema = z.object({
  applicants: z.array(z.object({
    id: z.string(),
    influencerId: z.string(),
    influencerName: z.string(),
    snsChannelName: z.string(),
    followerCount: z.number(),
    motivation: z.string(),
    visitDate: z.string(),
    status: z.enum(['신청완료', '선정', '반려']),
    appliedAt: z.string(),
  })),
  campaignInfo: z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(['모집중', '모집종료', '선정완료', '조기종료']),
    recruitmentCount: z.number(),
    selectedCount: z.number(),
  }),
});

// 체험단 상태 변경 입력 스키마
export const CampaignStatusUpdateSchema = z.object({
  status: z.enum(['모집종료', '조기종료']),
  reason: z.string().optional(),
});

// 인플루언서 선정 입력 스키마
export const InfluencerSelectionSchema = z.object({
  selectedInfluencerIds: z.array(z.string()).nonempty('최소 1명 이상 선택해야 합니다.'),
});

// 인플루언서 반려 입력 스키마
export const InfluencerRejectionSchema = z.object({
  rejectedInfluencerIds: z.array(z.string()).nonempty('최소 1명 이상 선택해야 합니다.'),
});

// 체험단 관리 에러 코드
export const campaignAdminErrorCodes = {
  CAMPAIGN_NOT_FOUND: 'CAMPAIGN_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  APPLICANTS_FETCH_FAILED: 'APPLICANTS_FETCH_FAILED',
  STATUS_UPDATE_FAILED: 'STATUS_UPDATE_FAILED',
  SELECTION_UPDATE_FAILED: 'SELECTION_UPDATE_FAILED',
  REJECTION_UPDATE_FAILED: 'REJECTION_UPDATE_FAILED',
  CAMPAIGN_NOT_RECRUITING: 'CAMPAIGN_NOT_RECRUITING'
} as const;

export type CampaignAdminErrorCode = typeof campaignAdminErrorCodes[keyof typeof campaignAdminErrorCodes];
