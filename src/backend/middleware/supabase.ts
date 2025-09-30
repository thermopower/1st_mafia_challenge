import { createMiddleware } from 'hono/factory';
import { contextKeys, type AppEnv } from '@/backend/hono/context';
import { createServiceClient } from '@/backend/supabase/client';
import { createClient } from '@supabase/supabase-js';

export const withSupabase = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const config = c.get(
      contextKeys.config,
    ) as AppEnv['Variables']['config'] | undefined;

    if (!config) {
      throw new Error('Application configuration is not available.');
    }

    // If request carries a Bearer token, use it for auth context; otherwise service role
    const authHeader = c.req.header('Authorization');
    let client = createServiceClient(config.supabase);

    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      const jwt = authHeader.slice(7);
      client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false },
      });
    }

    c.set(contextKeys.supabase, client);

    await next();
  });
