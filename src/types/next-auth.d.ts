import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    businessId?: string | null;
    businessPhoneId?: string | null;
    businessName?: string | null;
    role?: string;
    error?: "TokenExpired";
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
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    businessId?: string | null;
    businessPhoneId?: string | null;
    businessName?: string | null;
    role?: string;
    expiresAt?: number;
    error?: "TokenExpired";
  }
}
