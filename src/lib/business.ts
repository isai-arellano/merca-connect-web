import type { Session } from "next-auth";

type SessionWithBusinessContext = Session | null | undefined;

export interface SessionBusinessContext {
  businessId: string | null;
  businessName: string | null;
}

export function getSessionBusinessContext(
  session: SessionWithBusinessContext
): SessionBusinessContext {
  return {
    businessId: session?.user?.businessId ?? session?.businessId ?? null,
    businessName: session?.user?.businessName ?? session?.businessName ?? null,
  };
}

export function getSessionBusinessId(
  session: SessionWithBusinessContext
): string | null {
  return getSessionBusinessContext(session).businessId;
}

