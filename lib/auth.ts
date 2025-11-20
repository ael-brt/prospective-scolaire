import { getServerSession, type DefaultSession, type NextAuthOptions } from "next-auth";
import { authOptions } from "./authOptions";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    tenantId?: string;
    user?: DefaultSession["user"];
  }

  interface JWT {
    accessToken?: string;
    tenantId?: string;
    user?: DefaultSession["user"];
  }
}

/**
 * Wraps getServerSession to always return accessToken and tenantId alongside user.
 */
export async function getServerSessionWithTenant(options?: NextAuthOptions) {
  const session = await getServerSession(options ?? authOptions);
  return {
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    tenantId: session?.tenantId ?? null,
    session,
  };
}
