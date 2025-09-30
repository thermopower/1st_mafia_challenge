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
  myApplicationsErrorCodes,
  type MyApplicationsErrorCode
} from './schema';
import { getMyApplications } from './service';

/**
 * 내 지원 목록 라우트 등록
 */
export const registerMyApplicationsRoutes = (app: Hono<AppEnv>) => {
  app.get('/my-applications', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 사용자 인증 확인 (Bearer 토큰 전달)
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return respond(
          c,
          failure(
            401,
            'UNAUTHORIZED',
            '로그인이 필요합니다.',
          ),
        );
      }

      // 쿼리 파라미터 파싱
      const url = new URL(c.req.url);
      const queryParams = {
        page: url.searchParams.get('page'),
        limit: url.searchParams.get('limit'),
        status: url.searchParams.get('status'),
        sortBy: url.searchParams.get('sortBy'),
        sortOrder: url.searchParams.get('sortOrder'),
      };

      // 쿼리 파라미터 검증 및 변환 (기본값 포함)
      const parsedQuery: any = { page: 1, limit: 20 };
      if (queryParams.page) parsedQuery.page = parseInt(queryParams.page);
      if (queryParams.limit) parsedQuery.limit = parseInt(queryParams.limit);
      if (queryParams.status) parsedQuery.status = queryParams.status;
      if (queryParams.sortBy) parsedQuery.sortBy = queryParams.sortBy;
      if (queryParams.sortOrder) parsedQuery.sortOrder = queryParams.sortOrder;

      // 내 지원 목록 조회
      const result = await getMyApplications(supabase, user.id, parsedQuery);

      if (!result.ok) {
        const errorResult = result as ErrorResult<MyApplicationsErrorCode, unknown>;

        logger.error('My applications fetch failed', {
          userId: user.id,
          query: parsedQuery,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during my applications fetch', error);

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
