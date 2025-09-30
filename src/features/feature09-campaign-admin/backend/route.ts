import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { CampaignStatusUpdateSchema, InfluencerSelectionSchema, campaignAdminErrorCodes, type CampaignAdminErrorCode } from './schema';
import { getCampaignApplicants, selectInfluencers, updateCampaignStatus } from './service';

/**
 * 광고주 체험단 관리 라우트 등록 (기본 구조)
 */
export const registerCampaignAdminRoutes = (app: Hono<AppEnv>) => {
  // 지원자 목록 조회
  app.get('/campaigns/:id/applicants', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const campaignId = c.req.param('id');

    try {
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.'));
      }

      const result = await getCampaignApplicants(supabase, user.id, campaignId);
      return respond(c, result);
    } catch (error) {
      logger.error('Unexpected error during fetching applicants', error);
      return respond(c, failure(500, 'INTERNAL_SERVER_ERROR', '서버 내부 오류가 발생했습니다.'));
    }
  });

  // 상태 변경 (모집종료/조기종료)
  app.patch('/campaigns/:id/status', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const campaignId = c.req.param('id');

    try {
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.'));
      }

      const body = await c.req.json();
      const parsed = CampaignStatusUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return respond(c, failure(400, campaignAdminErrorCodes.STATUS_UPDATE_FAILED, '입력값이 올바르지 않습니다.', parsed.error.format()));
      }

      const result = await updateCampaignStatus(supabase, user.id, campaignId, parsed.data.status, parsed.data.reason);
      return respond(c, result);
    } catch (error) {
      logger.error('Unexpected error during status update', error);
      return respond(c, failure(500, 'INTERNAL_SERVER_ERROR', '서버 내부 오류가 발생했습니다.'));
    }
  });

  // 인플루언서 선정
  app.post('/campaigns/:id/selection', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const campaignId = c.req.param('id');

    try {
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.'));
      }

      const body = await c.req.json();
      const parsed = InfluencerSelectionSchema.safeParse(body);
      if (!parsed.success) {
        return respond(c, failure(400, campaignAdminErrorCodes.SELECTION_UPDATE_FAILED, '입력값이 올바르지 않습니다.', parsed.error.format()));
      }

      const result = await selectInfluencers(supabase, user.id, campaignId, parsed.data.selectedInfluencerIds);
      return respond(c, result);
    } catch (error) {
      logger.error('Unexpected error during selection', error);
      return respond(c, failure(500, 'INTERNAL_SERVER_ERROR', '서버 내부 오류가 발생했습니다.'));
    }
  });
};
