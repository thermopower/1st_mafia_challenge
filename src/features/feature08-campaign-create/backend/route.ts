import type { Hono } from 'hono';
import { failure, respond } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  CampaignCreateInputSchema,
  CampaignUpdateInputSchema,
  campaignCreateErrorCodes,
} from './schema';
import {
  createCampaign,
  deleteCampaign,
  getAdvertiserCampaignDetail,
  getAdvertiserCampaigns,
  updateCampaign,
} from './service';

const extractUser = async (supabase: ReturnType<typeof getSupabase>, authHeader?: string | null) => {
  const token = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;
  return supabase.auth.getUser(token);
};

export const registerCampaignCreateRoutes = (app: Hono<AppEnv>) => {
  app.post('/campaigns', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const authHeader = c.req.header('Authorization');
      const { data: { user }, error: authError } = await extractUser(supabase, authHeader);
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
      return respond(c, result);
    } catch (error) {
      logger.error('Unexpected error during campaign creation', error);
      return respond(c, failure(500, 'INTERNAL_SERVER_ERROR', '서버 내부 오류가 발생했습니다.'));
    }
  });

  app.get('/advertiser/campaigns', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const authHeader = c.req.header('Authorization');
      const { data: { user }, error: authError } = await extractUser(supabase, authHeader);
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

  app.get('/advertiser/campaigns/:campaignId', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const authHeader = c.req.header('Authorization');
      const { data: { user }, error: authError } = await extractUser(supabase, authHeader);
      if (authError || !user) {
        return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.'));
      }

      const campaignId = c.req.param('campaignId');
      const result = await getAdvertiserCampaignDetail(supabase, user.id, campaignId);
      return respond(c, result);
    } catch (error) {
      logger.error('Unexpected error during advertiser campaign detail fetch', error);
      return respond(c, failure(500, 'INTERNAL_SERVER_ERROR', '서버 내부 오류가 발생했습니다.'));
    }
  });

  app.patch('/campaigns/:campaignId', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const campaignId = c.req.param('campaignId');

    try {
      const authHeader = c.req.header('Authorization');
      const { data: { user }, error: authError } = await extractUser(supabase, authHeader);
      if (authError || !user) {
        return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.'));
      }

      const body = await c.req.json();
      const parsed = CampaignUpdateInputSchema.safeParse(body);
      if (!parsed.success) {
        return respond(
          c,
          failure(400, campaignCreateErrorCodes.INVALID_INPUT, '입력값이 올바르지 않습니다.', parsed.error.format()),
        );
      }

      const result = await updateCampaign(supabase, user.id, campaignId, parsed.data);
      return respond(c, result);
    } catch (error) {
      logger.error('Unexpected error during campaign update', error);
      return respond(c, failure(500, 'INTERNAL_SERVER_ERROR', '서버 내부 오류가 발생했습니다.'));
    }
  });

  app.delete('/campaigns/:campaignId', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const campaignId = c.req.param('campaignId');

    try {
      const authHeader = c.req.header('Authorization');
      const { data: { user }, error: authError } = await extractUser(supabase, authHeader);
      if (authError || !user) {
        return respond(c, failure(401, 'UNAUTHORIZED', '로그인이 필요합니다.'));
      }

      const result = await deleteCampaign(supabase, user.id, campaignId);
      return respond(c, result);
    } catch (error) {
      logger.error('Unexpected error during campaign deletion', error);
      return respond(c, failure(500, 'INTERNAL_SERVER_ERROR', '서버 내부 오류가 발생했습니다.'));
    }
  });
};