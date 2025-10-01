import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/constants/env";
import type { Database } from "./types";

type WritableCookieStore = Awaited<ReturnType<typeof cookies>> & {
  set?: (options: {
    name: string;
    value: string;
    path?: string;
    domain?: string;
    expires?: Date;
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
  }) => void;
};

type CreateSupabaseServerClientOptions = {
  persistSession?: boolean;
};

const logCookieSkip = (name: string) => {
  if (process.env.NODE_ENV !== "production") {
    console.debug(
      `[supabase] Skipped mutating cookie "${name}" because this context forbids writes.`,
    );
  }
};

const safeSetCookies = (
  cookieStore: WritableCookieStore,
  persistSession: boolean,
  cookiesToSet: Array<{
    name: string;
    value: string;
    options?: {
      path?: string;
      domain?: string;
      expires?: Date;
      maxAge?: number;
      httpOnly?: boolean;
      sameSite?: "lax" | "strict" | "none";
      secure?: boolean;
    };
  }>,
) => {
  if (!persistSession) {
    return;
  }

  cookiesToSet.forEach(({ name, value, options }) => {
    if (typeof cookieStore.set !== "function") {
      return;
    }

    try {
      cookieStore.set({
        name,
        value,
        ...((options ?? {}) as Record<string, unknown>),
      });
    } catch {
      logCookieSkip(name);
    }
  });
};

export const createSupabaseServerClient = async (
  options: CreateSupabaseServerClientOptions = {},
): Promise<SupabaseClient<Database>> => {
  const { persistSession = false } = options;
  const cookieStore = (await cookies()) as WritableCookieStore;

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession,
        autoRefreshToken: persistSession,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          safeSetCookies(cookieStore, persistSession, cookiesToSet);
        },
      },
    },
  );
};
