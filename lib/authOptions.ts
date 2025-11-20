import type { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

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
    async jwt({ token, account, profile, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.tenantId = extractTenantId({ profile, account });
        token.user = user;
      }
      token.tenantId = token.tenantId ?? extractTenantId({ profile, account: account ?? undefined, token });
      return token;
    },
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

function extractTenantId(params: {
  profile?: unknown;
  account?: { scope?: string | null } | null | undefined;
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
