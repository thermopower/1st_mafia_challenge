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
  ApplicationInputSchema,
  applicationErrorCodes,
  type ApplicationErrorCode
} from './schema';
import { createApplication } from './service';

/**
 * 체험단 지원 라우트 등록
 */
export const registerApplicationRoutes = (app: Hono<AppEnv>) => {
  app.post('/applications', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 사용자 인증 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser();

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

      // 요청 본문 파싱
      const body = await c.req.json();

      // 입력값 검증
      const parsedInput = ApplicationInputSchema.safeParse(body);

      if (!parsedInput.success) {
        return respond(
          c,
          failure(
            400,
            'INVALID_APPLICATION_INPUT',
            '입력값이 올바르지 않습니다.',
            parsedInput.error.format(),
          ),
        );
      }

      // 체험단 지원 생성
      const input = parsedInput.data as Required<typeof parsedInput.data>;
      const result = await createApplication(supabase, user.id, input);

      if (!result.ok) {
        const errorResult = result as ErrorResult<ApplicationErrorCode, unknown>;

        logger.error('Application creation failed', {
          userId: user.id,
          campaignId: input.campaignId,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      // 성공 응답
      logger.info('Application created successfully', {
        userId: user.id,
        campaignId: input.campaignId,
        applicationId: result.data.id
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during application creation', error);

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
