import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { type AuthLevel, getSafeNextPath } from "@/lib/auth";

interface AuthStatusState {
  session: Session | null;
  aal: AuthLevel;
  nextLevel: AuthLevel;
  loading: boolean;
}

const initialState: AuthStatusState = {
  session: null,
  aal: null,
  nextLevel: null,
  loading: true,
};

export function useAuthStatus() {
  const [state, setState] = useState<AuthStatusState>(initialState);

  useEffect(() => {
    let mounted = true;

    const hydrate = async (sessionOverride?: Session | null) => {
      const currentSession =
        sessionOverride ??
        (await supabase.auth.getSession()).data.session;

      if (!mounted) return;

      if (!currentSession) {
        setState({ session: null, aal: null, nextLevel: null, loading: false });
        return;
      }

      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(
        currentSession.access_token,
      );

      if (!mounted) return;

      setState({
        session: currentSession,
        aal: data?.currentLevel ?? null,
        nextLevel: data?.nextLevel ?? null,
        loading: false,
      });
    };

    void hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrate(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...state,
    redirectToNext(next: string | null | undefined) {
      return getSafeNextPath(next);
    },
  };
}
