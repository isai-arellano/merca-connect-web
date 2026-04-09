import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    businessId?: string | null;
    businessPhoneId?: string | null;
    businessName?: string | null;
    user: DefaultSession["user"] & {
      id?: string;
      businessId?: string | null;
      businessPhoneId?: string | null;
      businessName?: string | null;
    };
  }

  interface User {
    accessToken?: string;
    businessId?: string | null;
    businessPhoneId?: string | null;
    businessName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    businessId?: string | null;
    businessPhoneId?: string | null;
    businessName?: string | null;
  }
}
