import type { SupabaseClient } from '@supabase/supabase-js';
import {
  MyApplicationsQuerySchema,
  myApplicationsErrorCodes,
  type MyApplicationsErrorCode
} from './schema';
import type { ErrorResult, SuccessResult } from '@/backend/http/response';

export interface MyApplicationsQuery {
  page?: number;
  limit?: number;
  status?: '신청완료' | '선정' | '반려';
  sortBy?: 'applied_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface MyApplicationsResult {
  applications: Array<{
    id: string;
    campaignId: string;
    campaignTitle: string;
    companyName: string;
    status: '신청완료' | '선정' | '반려';
    appliedAt: string;
    updatedAt: string;
    visitDate: string;
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
 * 내 지원 목록 조회 서비스 로직
 */
export async function getMyApplications(
  supabase: SupabaseClient,
  userId: string,
  query: MyApplicationsQuery = {}
): Promise<SuccessResult<MyApplicationsResult> | ErrorResult<MyApplicationsErrorCode, unknown>> {
  try {
    // 쿼리 파라미터 검증
    const validationResult = MyApplicationsQuerySchema.safeParse(query);
    if (!validationResult.success) {
      return {
        ok: false,
        error: {
          code: myApplicationsErrorCodes.INVALID_QUERY_PARAMS,
          message: '쿼리 파라미터가 올바르지 않습니다.',
          details: validationResult.error.format()
        }
      };
    }

    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'applied_at',
      sortOrder = 'desc'
    } = validationResult.data;

    const offset = (page - 1) * limit;

    // 사용자 인증 확인 (인플루언서 프로필 존재 확인)
    const { data: influencerProfile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!influencerProfile) {
      return {
        ok: false,
        error: {
          code: myApplicationsErrorCodes.USER_NOT_INFLUENCER,
          message: '인플루언서 프로필이 등록되지 않았습니다.'
        }
      };
    }

    // 지원 목록 조회
    let queryBuilder = supabase
      .from('applications')
      .select(`
        id,
        campaign_id,
        status,
        applied_at,
        updated_at,
        visit_date,
        campaigns!applications_campaign_id_fkey(
          id,
          title,
          advertiser:advertiser_profiles!campaigns_advertiser_id_fkey(
            company_name
          )
        )
      `)
      .eq('influencer_id', userId);

    // 필터 조건 적용
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 정렬 적용
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

    // 페이징 적용
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: applications, error: applicationsError } = await queryBuilder;

    if (applicationsError) {
      return {
        ok: false,
        error: {
          code: myApplicationsErrorCodes.APPLICATIONS_FETCH_FAILED,
          message: '지원 목록 조회에 실패했습니다.'
        }
      };
    }

    // 전체 개수 조회 (페이징 정보용)
    let countQuery = supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('influencer_id', userId);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      // 개수 조회 실패 시 기본값 사용
      console.warn('Failed to get applications count:', countError);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 응답 데이터 구성
    const result: MyApplicationsResult = {
      applications: (applications || []).map(application => ({
        id: application.id,
        campaignId: application.campaign_id,
        campaignTitle: (application.campaigns as any)?.title || '알 수 없음',
        companyName: (application.campaigns as any)?.advertiser?.company_name || '알 수 없음',
        status: application.status as '신청완료' | '선정' | '반려',
        appliedAt: application.applied_at,
        updatedAt: application.updated_at,
        visitDate: application.visit_date
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
        code: myApplicationsErrorCodes.APPLICATIONS_FETCH_FAILED,
        message: '지원 목록 조회 중 오류가 발생했습니다.'
      }
    };
  }
}
