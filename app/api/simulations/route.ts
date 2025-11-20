import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithTenant } from "../../../lib/auth";
import { supabaseAdmin, getTenantRow } from "../../../lib/supabaseServer";

export async function GET() {
  const { user, tenantId } = await getServerSessionWithTenant();
  if (!user || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenant = await getTenantRow(tenantId);

    const { data, error } = await supabaseAdmin
      .from("simulations")
      .select("id, name, description, status, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const payload =
      data?.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        status: row.status,
        createdAt: row.created_at,
      })) ?? [];

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to list simulations", details: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, tenantId } = await getServerSessionWithTenant();
  if (!user || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = body?.name;
  const description = body?.description;
  const parameters = body?.parameters;

  if (!name || !parameters) {
    return NextResponse.json(
      { error: "name and parameters are required" },
      { status: 400 }
    );
  }

  try {
    const tenant = await getTenantRow(tenantId);
    const createdBy = user.email ?? user.name ?? "unknown";

    const { data, error } = await supabaseAdmin
      .from("simulations")
      .insert({
        tenant_id: tenant.id,
        name,
        description,
        parameters,
        status: "PENDING",
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ simulationId: data?.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create simulation", details: err?.message },
      { status: 500 }
    );
  }
}
