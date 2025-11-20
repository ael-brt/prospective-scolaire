import NextAuth, { type NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

/**
 * Keycloak + NextAuth configuration for App Router.
 * - Reads issuer/client creds from env.
 * - Persists access_token + derived tenantId into the JWT and session.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * Enrich the JWT with accessToken and tenantId when available.
     */
    async jwt({ token, account, profile, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.tenantId = extractTenantId({ profile, account });
        token.user = user;
      }

      // Keep existing values on subsequent calls
      token.tenantId = token.tenantId ?? extractTenantId({ profile, account, token });
      return token;
    },
    /**
     * Expose accessToken and tenantId to the client session.
     */
    async session({ session, token }) {
      if (session.user && token.user) {
        session.user = token.user as typeof session.user;
      }
      session.accessToken = token.accessToken as string | undefined;
      session.tenantId = token.tenantId as string | undefined;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

function extractTenantId(params: {
  profile?: unknown;
  account?: { scope?: string | null };
  token?: { tenantId?: string };
}): string | undefined {
  const profileAny = params.profile as Record<string, any> | undefined;

  const roles: string[] =
    profileAny?.realm_access?.roles ??
    Object.values(profileAny?.resource_access ?? {}).flatMap((entry: any) => entry?.roles ?? []);

  const fromRoles = roles?.find((r) => typeof r === "string" && r.startsWith("tenant:"));
  if (fromRoles) return fromRoles.replace(/^tenant:/, "");

  const scopeStr = params.account?.scope;
  if (scopeStr) {
    const scopeTenant = scopeStr.split(/\s+/).find((s) => s.startsWith("tenant:"));
    if (scopeTenant) return scopeTenant.replace(/^tenant:/, "");
  }

  return params.token?.tenantId;
}
