import type { Session } from "next-auth";

export function getBusinessPhoneId(
  session: Session | null | undefined
): string | null {
  return typeof session?.businessPhoneId === "string" && session.businessPhoneId.length > 0
    ? session.businessPhoneId
    : null;
}

export function withBusinessPhoneId(
  url: string,
  businessPhoneId: string
): string {
  const requestUrl = new URL(url);
  requestUrl.searchParams.set("business_phone_id", businessPhoneId);
  return requestUrl.toString();
}
