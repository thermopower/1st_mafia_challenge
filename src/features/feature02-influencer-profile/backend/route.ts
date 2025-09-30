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
  InfluencerProfileInputSchema,
  influencerProfileErrorCodes,
  type InfluencerProfileErrorCode
} from './schema';
import { createInfluencerProfile, getInfluencerProfile, updateInfluencerProfile } from './service';

/**
 * 인플루언서 프로필 라우트 등록
 */
export const registerInfluencerProfileRoutes = (app: Hono<AppEnv>) => {
  app.post('/influencer-profile', async (c) => {
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

      // 요청 본문 파싱
      const body = await c.req.json();

      // 입력값 검증
      const parsedInput = InfluencerProfileInputSchema.safeParse(body);

      if (!parsedInput.success) {
        return respond(
          c,
          failure(
            400,
            'INVALID_PROFILE_INPUT',
            '입력값이 올바르지 않습니다.',
            parsedInput.error.format(),
          ),
        );
      }

      // 인플루언서 프로필 생성
      const input = parsedInput.data as Required<typeof parsedInput.data>;
      const result = await createInfluencerProfile(supabase, user.id, input);

      if (!result.ok) {
        const errorResult = result as ErrorResult<InfluencerProfileErrorCode, unknown>;

        logger.error('Influencer profile creation failed', {
          userId: user.id,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      // 성공 응답
      logger.info('Influencer profile created successfully', {
        userId: user.id,
        profileId: result.data.id
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during influencer profile creation', error);

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

  // 인플루언서 프로필 조회
  app.get('/influencer-profile', async (c) => {
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

      // 인플루언서 프로필 조회
      const result = await getInfluencerProfile(supabase, user.id);

      if (!result.ok) {
        const errorResult = result as ErrorResult<InfluencerProfileErrorCode, unknown>;

        logger.error('Influencer profile fetch failed', {
          userId: user.id,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during influencer profile fetch', error);

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

  // 인플루언서 프로필 업데이트
  app.patch('/influencer-profile', async (c) => {
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

      // 요청 본문 파싱
      const body = await c.req.json();

      // 인플루언서 프로필 업데이트
      const result = await updateInfluencerProfile(supabase, user.id, body);

      if (!result.ok) {
        const errorResult = result as ErrorResult<InfluencerProfileErrorCode, unknown>;

        logger.error('Influencer profile update failed', {
          userId: user.id,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      // 성공 응답
      logger.info('Influencer profile updated successfully', {
        userId: user.id
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during influencer profile update', error);

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
