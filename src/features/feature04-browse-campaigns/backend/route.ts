import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  CampaignListQuerySchema,
  campaignListErrorCodes,
  type CampaignListErrorCode
} from './schema';
import { getCampaignList, getFeaturedCampaigns } from './service';

/**
 * 체험단 목록 라우트 등록
 */
export const registerCampaignListRoutes = (app: Hono<AppEnv>) => {
  // 전체 체험단 목록 조회 (필터링/페이징 지원)
  app.get('/campaigns', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 쿼리 파라미터 파싱
      const url = new URL(c.req.url);
      const queryParams = {
        page: url.searchParams.get('page'),
        limit: url.searchParams.get('limit'),
        status: url.searchParams.get('status'),
        category: url.searchParams.get('category'),
        location: url.searchParams.get('location'),
        sortBy: url.searchParams.get('sortBy'),
        sortOrder: url.searchParams.get('sortOrder'),
      };

      // 쿼리 파라미터 검증 및 변환
      const parsedQuery: any = {};
      if (queryParams.page) parsedQuery.page = parseInt(queryParams.page);
      if (queryParams.limit) parsedQuery.limit = parseInt(queryParams.limit);
      if (queryParams.status) parsedQuery.status = queryParams.status;
      if (queryParams.category) parsedQuery.category = queryParams.category;
      if (queryParams.location) parsedQuery.location = queryParams.location;
      if (queryParams.sortBy) parsedQuery.sortBy = queryParams.sortBy;
      if (queryParams.sortOrder) parsedQuery.sortOrder = queryParams.sortOrder;

      // 체험단 목록 조회
      const result = await getCampaignList(supabase, parsedQuery);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CampaignListErrorCode, unknown>;

        logger.error('Campaign list fetch failed', {
          query: parsedQuery,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during campaign list fetch', error);

      return respond(
        c,
        failure(
          500,
          'INTERNAL_SERVER_ERROR',
          '서버 내부 오류가 발생했습니다.',
        ),
      );
    }
  });

  // 홈페이지용 추천 체험단 조회 (간단 버전)
  app.get('/campaigns/featured', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const url = new URL(c.req.url);
      const limit = parseInt(url.searchParams.get('limit') || '6');

      // 추천 체험단 조회
      const result = await getFeaturedCampaigns(supabase, limit);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CampaignListErrorCode, unknown>;

        logger.error('Featured campaigns fetch failed', {
          limit,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during featured campaigns fetch', error);

      return respond(
        c,
        failure(
          500,
          'INTERNAL_SERVER_ERROR',
          '서버 내부 오류가 발생했습니다.',
        ),
      );
    }
  });
};
