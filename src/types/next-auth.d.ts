import { DefaultSession } from "next-auth";

export type UserRole = "owner" | "admin" | "operator";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        businessId?: string | null;
        businessName?: string | null;
        role?: UserRole;
        needsOnboarding?: boolean;
        error?: "TokenExpired";
        user: DefaultSession["user"] & {
            id?: string;
            businessId?: string | null;
            businessName?: string | null;
            role?: UserRole;
            needsOnboarding?: boolean;
        };
    }

    interface User {
        accessToken?: string;
        businessId?: string | null;
        businessName?: string | null;
        role?: UserRole;
        needsOnboarding?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        businessId?: string | null;
        businessName?: string | null;
        role?: UserRole;
        needsOnboarding?: boolean;
        expiresAt?: number;
        error?: "TokenExpired";
    }
}
