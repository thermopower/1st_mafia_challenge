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
  AdvertiserProfileInputSchema,
  advertiserProfileErrorCodes,
  type AdvertiserProfileErrorCode
} from './schema';
import { createAdvertiserProfile, getAdvertiserProfile, updateAdvertiserProfile } from './service';

/**
 * 광고주 프로필 라우트 등록
 */
export const registerAdvertiserProfileRoutes = (app: Hono<AppEnv>) => {
  app.post('/advertiser-profile', async (c) => {
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
      const parsedInput = AdvertiserProfileInputSchema.safeParse(body);

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

      // 광고주 프로필 생성
      const input = parsedInput.data as Required<typeof parsedInput.data>;
      const result = await createAdvertiserProfile(supabase, user.id, input);

      if (!result.ok) {
        const errorResult = result as ErrorResult<AdvertiserProfileErrorCode, unknown>;

        logger.error('Advertiser profile creation failed', {
          userId: user.id,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      // 성공 응답
      logger.info('Advertiser profile created successfully', {
        userId: user.id,
        profileId: result.data.id
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during advertiser profile creation', error);

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

  // 광고주 프로필 조회
  app.get('/advertiser-profile', async (c) => {
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

      // 광고주 프로필 조회
      const result = await getAdvertiserProfile(supabase, user.id);

      if (!result.ok) {
        const errorResult = result as ErrorResult<AdvertiserProfileErrorCode, unknown>;

        logger.error('Advertiser profile fetch failed', {
          userId: user.id,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during advertiser profile fetch', error);

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

  // 광고주 프로필 업데이트
  app.patch('/advertiser-profile', async (c) => {
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

      // 광고주 프로필 업데이트
      const result = await updateAdvertiserProfile(supabase, user.id, body);

      if (!result.ok) {
        const errorResult = result as ErrorResult<AdvertiserProfileErrorCode, unknown>;

        logger.error('Advertiser profile update failed', {
          userId: user.id,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      // 성공 응답
      logger.info('Advertiser profile updated successfully', {
        userId: user.id
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during advertiser profile update', error);

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
