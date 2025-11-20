import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function getTenantRow(tenantKey: string) {
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, key, name")
    .eq("key", tenantKey)
    .single();

  if (error || !data) {
    throw new Error(`Tenant not found for key ${tenantKey}`);
  }
  return data;
}
