import { useSession } from "next-auth/react";

/**
 * Client-side hook to access auth state, accessToken, and tenantId.
 */
export function useAuth() {
  const { data, status } = useSession();

  return {
    user: data?.user,
    accessToken: data?.accessToken,
    tenantId: data?.tenantId,
    status,
  };
}
