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
import { SignupInputSchema, signupErrorCodes, type SignupErrorCode } from './schema';
import { signupUser } from './service';

/**
 * 회원가입 라우트 등록
 */
export const registerSignupRoutes = (app: Hono<AppEnv>) => {
  app.post('/signup', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 요청 본문 파싱
      const body = await c.req.json();

      // 입력값 검증
      const parsedInput = SignupInputSchema.safeParse(body);

      if (!parsedInput.success) {
        return respond(
          c,
          failure(
            400,
            'INVALID_SIGNUP_INPUT',
            '입력값이 올바르지 않습니다.',
            parsedInput.error.format(),
          ),
        );
      }

      // 회원가입 처리
      const input = parsedInput.data as Required<typeof parsedInput.data>;
      const result = await signupUser(supabase, input);
      if (!result.ok) {
        const errorResult = result as ErrorResult<SignupErrorCode, unknown>;

        logger.error('Signup failed', {
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        // 코드별 HTTP 상태 매핑
        const status = (() => {
          switch (errorResult.error.code) {
            case 'DUPLICATE_EMAIL':
            case 'DUPLICATE_PHONE':
              return 409 as const;
            case 'INVALID_EMAIL_FORMAT':
            case 'INVALID_PHONE_FORMAT':
            case 'AUTH_METHOD_MISMATCH':
              return 400 as const;
            case 'USER_CREATION_FAILED':
            case 'PROFILE_CREATION_FAILED':
            case 'VERIFICATION_EMAIL_FAILED':
              return 500 as const;
            default:
              return 400 as const;
          }
        })();

        return respond(
          c,
          failure(
            status,
            errorResult.error.code,
            errorResult.error.message,
            errorResult.error.details,
          ),
        );
      }

      // 성공 응답
      logger.info('User signed up successfully', {
        userId: result.data.userId,
        userRole: result.data.userRole,
        authMethod: result.data.authMethod
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during signup', error);

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
