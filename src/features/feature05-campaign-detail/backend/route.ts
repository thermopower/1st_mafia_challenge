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
  campaignDetailErrorCodes,
  type CampaignDetailErrorCode
} from './schema';
import { getCampaignDetail } from './service';

/**
 * 체험단 상세 라우트 등록
 */
export const registerCampaignDetailRoutes = (app: Hono<AppEnv>) => {
  app.get('/campaigns/:id', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const campaignId = c.req.param('id');

      if (!campaignId) {
        return respond(
          c,
          failure(
            400,
            'INVALID_CAMPAIGN_ID',
            '체험단 ID가 필요합니다.',
          ),
        );
      }

      // 사용자 인증 확인 (선택사항 - 로그인하지 않은 사용자도 조회 가능)
      let userId: string | undefined;
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!authError && user) {
          userId = user.id;
        }
      } catch (error) {
        // 인증 실패는 무시하고 계속 진행
        logger.warn('Failed to get current user for campaign detail', error);
      }

      // 체험단 상세 조회
      const result = await getCampaignDetail(supabase, campaignId, userId);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CampaignDetailErrorCode, unknown>;

        logger.error('Campaign detail fetch failed', {
          campaignId,
          error: errorResult.error.code,
          message: errorResult.error.message
        });

        return respond(c, result);
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error during campaign detail fetch', error);

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
