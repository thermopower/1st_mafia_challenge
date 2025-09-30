"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentUserContext } from "../context/current-user-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { UserRole } from "../types";

export const useCurrentUser = () => {
  const context = useCurrentUserContext();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!context.isAuthenticated || !context.user?.id) {
        setUserRole(null);
        setIsRoleLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from('user_profiles')
          .select('user_role')
          .eq('id', context.user.id)
          .single();

        if (data?.user_role === 'advertiser' || data?.user_role === 'influencer') {
          setUserRole(data.user_role);
        } else {
          setUserRole(null);
        }
        setIsRoleLoading(false);
      } catch {
        setUserRole(null);
        setIsRoleLoading(false);
      }
    };

    void load();
  }, [context.isAuthenticated, context.user?.id]);

  return useMemo(
    () => ({
      user: context.user,
      status: context.status,
      isAuthenticated: context.isAuthenticated,
      isLoading: context.isLoading,
      refresh: context.refresh,
      userRole,
      isRoleLoading,
    }),
    [context, userRole, isRoleLoading]
  );
};
