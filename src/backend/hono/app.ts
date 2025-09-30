import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerSignupRoutes } from '@/features/feature01-signup/backend/route';
import { registerInfluencerProfileRoutes } from '@/features/feature02-influencer-profile/backend/route';
import { registerAdvertiserProfileRoutes } from '@/features/feature03-advertiser-profile/backend/route';
import { registerCampaignListRoutes } from '@/features/feature04-browse-campaigns/backend/route';
import { registerCampaignDetailRoutes } from '@/features/feature05-campaign-detail/backend/route';
import { registerApplicationRoutes } from '@/features/feature06-apply/backend/route';
import { registerMyApplicationsRoutes } from '@/features/feature07-my-applications/backend/route';
import { registerCampaignCreateRoutes } from '@/features/feature08-campaign-create/backend/route';
import { registerCampaignAdminRoutes } from '@/features/feature09-campaign-admin/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>().basePath('/api');

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerSignupRoutes(app);
  registerInfluencerProfileRoutes(app);
  registerAdvertiserProfileRoutes(app);
  registerCampaignListRoutes(app);
  registerCampaignDetailRoutes(app);
  registerApplicationRoutes(app);
  registerMyApplicationsRoutes(app);
  registerCampaignCreateRoutes(app);
  registerCampaignAdminRoutes(app);

  singletonApp = app;

  return app;
};
