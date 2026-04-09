import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    businessId: string;
    businessPhoneId: string;
    user: DefaultSession["user"];
  }

  interface User {
    accessToken: string;
    businessId: string;
    businessPhoneId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    businessId?: string;
    businessPhoneId?: string;
  }
}
