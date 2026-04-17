import type { Session } from "@supabase/supabase-js";

export const DEFAULT_VERIFY_REDIRECT = "/verify";

export type AuthLevel = "aal1" | "aal2" | null;

export interface AuthSnapshot {
  session: Session | null;
  aal: AuthLevel;
  nextLevel: AuthLevel;
}

export function getSafeNextPath(next: string | null | undefined, fallback = DEFAULT_VERIFY_REDIRECT) {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}

export function buildOAuthRedirectUrl(next: string) {
  const url = new URL("/auth", window.location.origin);
  url.searchParams.set("next", getSafeNextPath(next));
  return url.toString();
}

export function getMaskedContact(value: string | null | undefined) {
  if (!value) return null;

  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    const head = local.slice(0, 2);
    return `${head}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value;
  return `${"*".repeat(Math.max(1, digits.length - 4))}${digits.slice(-4)}`;
}

export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("88")) return `+${trimmed}`;
  if (trimmed.startsWith("01")) return `+88${trimmed}`;

  return trimmed;
}
