import type { Session } from "next-auth";

type SessionWithBusinessContext = Session | null | undefined;

export interface SessionBusinessContext {
  businessId: string | null;
  businessPhoneId: string | null;
  businessName: string | null;
}

export function getSessionBusinessContext(
  session: SessionWithBusinessContext
): SessionBusinessContext {
  return {
    businessId: session?.user?.businessId ?? session?.businessId ?? null,
    businessPhoneId:
      session?.user?.businessPhoneId ?? session?.businessPhoneId ?? null,
    businessName: session?.user?.businessName ?? session?.businessName ?? null,
  };
}

export function getSessionBusinessId(
  session: SessionWithBusinessContext
): string | null {
  return getSessionBusinessContext(session).businessId;
}

export function getSessionBusinessPhoneId(
  session: SessionWithBusinessContext
): string | null {
  return getSessionBusinessContext(session).businessPhoneId;
}
