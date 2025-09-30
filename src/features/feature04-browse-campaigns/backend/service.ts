import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CampaignListQuerySchema,
  CampaignListResponseSchema,
  campaignListErrorCodes,
  type CampaignListErrorCode
} from './schema';
import type { ErrorResult, SuccessResult } from '@/backend/http/response';

export interface CampaignListQuery {
  page?: number;
  limit?: number;
  status?: '모집중' | '모집종료' | '선정완료' | '조기종료';
  category?: string;
  location?: string;
  sortBy?: 'created_at' | 'start_date' | 'end_date' | 'recruitment_count';
  sortOrder?: 'asc' | 'desc';
}

export interface CampaignListResult {
  campaigns: Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    recruitmentCount: number;
    startDate: string;
    endDate: string;
    status: '모집중' | '모집종료' | '선정완료' | '조기종료';
    createdAt: string;
    advertiser: {
      companyName: string;
      category: string;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 체험단 목록 조회 서비스 로직
 */
export async function getCampaignList(
  supabase: SupabaseClient,
  query: CampaignListQuery = {}
): Promise<SuccessResult<CampaignListResult> | ErrorResult<CampaignListErrorCode, unknown>> {
  try {
    // 쿼리 파라미터 검증
    const validationResult = CampaignListQuerySchema.safeParse(query);
    if (!validationResult.success) {
      return {
        ok: false,
        error: {
          code: campaignListErrorCodes.INVALID_QUERY_PARAMS,
          message: '쿼리 파라미터가 올바르지 않습니다.',
          details: validationResult.error.format()
        }
      };
    }

    const {
      page = 1,
      limit = 20,
      status,
      category,
      location,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = validationResult.data;

    const offset = (page - 1) * limit;

    // 기본 쿼리 구성
    let queryBuilder = supabase
      .from('campaigns')
      .select(`
        id,
        title,
        description,
        location,
        recruitment_count,
        start_date,
        end_date,
        status,
        created_at,
        advertiser:advertiser_profiles!campaigns_advertiser_id_fkey(
          company_name,
          category
        )
      `);

    // 필터 조건 적용
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    } else {
      // 기본적으로 모집 중인 것만 조회 (userflow.md 참고)
      queryBuilder = queryBuilder.eq('status', '모집중');
    }

    if (category) {
      // 광고주 카테고리로 필터링 (advertiser_profiles.category)
      queryBuilder = queryBuilder.eq('advertiser_profiles.category', category);
    }

    if (location) {
      queryBuilder = queryBuilder.ilike('location', `%${location}%`);
    }

    // 정렬 적용
    const sortColumn = sortBy === 'recruitment_count' ? 'recruitment_count' : sortBy;
    queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === 'asc' });

    // 페이징 적용
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: campaigns, error: campaignsError } = await queryBuilder;

    if (campaignsError) {
      return {
        ok: false,
        error: {
          code: campaignListErrorCodes.CAMPAIGNS_FETCH_FAILED,
          message: '체험단 목록 조회에 실패했습니다.'
        }
      };
    }

    // 전체 개수 조회 (페이징 정보용)
    let countQuery = supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    } else {
      countQuery = countQuery.eq('status', '모집중');
    }

    if (category) {
      countQuery = countQuery.eq('advertiser_profiles.category', category);
    }

    if (location) {
      countQuery = countQuery.ilike('location', `%${location}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      // 개수 조회 실패 시 기본값 사용
      console.warn('Failed to get campaign count:', countError);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 응답 데이터 구성
    const result: CampaignListResult = {
      campaigns: (campaigns || []).map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        location: campaign.location,
        recruitmentCount: campaign.recruitment_count,
        startDate: campaign.start_date,
        endDate: campaign.end_date,
        status: campaign.status as '모집중' | '모집종료' | '선정완료' | '조기종료',
        createdAt: campaign.created_at,
        advertiser: {
          companyName: (campaign.advertiser as any)?.company_name || '알 수 없음',
          category: (campaign.advertiser as any)?.category || '기타'
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    return {
      ok: true,
      data: result
    };

  } catch (error) {
    return {
      ok: false,
      error: {
        code: campaignListErrorCodes.CAMPAIGNS_FETCH_FAILED,
        message: '체험단 목록 조회 중 오류가 발생했습니다.'
      }
    };
  }
}

/**
 * 홈페이지용 추천 체험단 조회 (간단 버전)
 */
export async function getFeaturedCampaigns(
  supabase: SupabaseClient,
  limit: number = 6
): Promise<SuccessResult<Array<{
  id: string;
  title: string;
  location: string;
  recruitmentCount: number;
  startDate: string;
  endDate: string;
  status: '모집중' | '모집종료' | '선정완료' | '조기종료';
  companyName: string;
  category: string;
}>> | ErrorResult<CampaignListErrorCode, unknown>> {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        title,
        location,
        recruitment_count,
        start_date,
        end_date,
        status,
        advertiser:advertiser_profiles!campaigns_advertiser_id_fkey(
          company_name,
          category
        )
      `)
      .eq('status', '모집중')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        ok: false,
        error: {
          code: campaignListErrorCodes.CAMPAIGNS_FETCH_FAILED,
          message: '추천 체험단 조회에 실패했습니다.'
        }
      };
    }

    const result = (campaigns || []).map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      location: campaign.location,
      recruitmentCount: campaign.recruitment_count,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      status: campaign.status as '모집중' | '모집종료' | '선정완료' | '조기종료',
      companyName: (campaign.advertiser as any)?.company_name || '알 수 없음',
      category: (campaign.advertiser as any)?.category || '기타'
    }));

    return {
      ok: true,
      data: result
    };

  } catch (error) {
    return {
      ok: false,
      error: {
        code: campaignListErrorCodes.CAMPAIGNS_FETCH_FAILED,
        message: '추천 체험단 조회 중 오류가 발생했습니다.'
      }
    };
  }
}
