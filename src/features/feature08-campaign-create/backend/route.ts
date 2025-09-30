import type { Hono } from 'hono';
import { failure, respond, success, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { CampaignCreateInputSchema, campaignCreateErrorCodes, type CampaignCreateErrorCode } from './schema';
import { createCampaign, getAdvertiserCampaigns } from './service';

/**
 * 광고주 체험단 관리 라우트 등록 (기본 구조)
 */
export const registerCampaignCreateRoutes = (app: Hono<AppEnv>) => {
  // 체험단 생성
  app.post('/campaigns', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.'));
      }

      const body = await c.req.json();
      const parsed = CampaignCreateInputSchema.safeParse(body);
      if (!parsed.success) {
        return respond(
          c,
          failure(400, campaignCreateErrorCodes.INVALID_INPUT, '입력값이 올바르지 않습니다.', parsed.error.format()),
        );
      }

      const result = await createCampaign(supabase, user.id, parsed.data);
      if (!result.ok) {
        const err = result as ErrorResult<CampaignCreateErrorCode, unknown>;
        logger.error('Campaign creation failed', { userId: user.id, error: err.error });
        return respond(c, result);
      }

      return respond(c, result);
    } catch (error) {
      const logger = getLogger(c);
      logger.error('Unexpected error during campaign creation', error);
      return respond(c, failure(500, 'INTERNAL_SERVER_ERROR', '서버 내부 오류가 발생했습니다.'));
    }
  });

  // 광고주 캠페인 목록
  app.get('/advertiser/campaigns', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.'));
      }

      const url = new URL(c.req.url);
      const page = Number(url.searchParams.get('page') ?? '1');
      const limit = Number(url.searchParams.get('limit') ?? '10');

      const result = await getAdvertiserCampaigns(supabase, user.id, { page, limit });
      return respond(c, result);
    } catch (error) {
      logger.error('Unexpected error during advertiser campaigns fetch', error);
      return respond(c, failure(500, 'INTERNAL_SERVER_ERROR', '서버 내부 오류가 발생했습니다.'));
    }
  });
};
