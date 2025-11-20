import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithTenant } from "../../../lib/auth";
import { getTenantRow, supabaseAdmin } from "../../../lib/supabaseServer";

export async function GET(req: NextRequest) {
  const { user, tenantId } = await getServerSessionWithTenant();
  if (!user || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const simulationId = searchParams.get("simulationId");
  const uai = searchParams.get("uai");
  const niveau = searchParams.get("niveau");

  if (!simulationId || !uai) {
    return NextResponse.json(
      { error: "simulationId and uai are required" },
      { status: 400 }
    );
  }

  try {
    const tenant = await getTenantRow(tenantId);

    let query = supabaseAdmin
      .from("simulation_results_classes")
      .select("annee, niveau, effectif_pred")
      .eq("tenant_id", tenant.id)
      .eq("simulation_id", simulationId)
      .eq("uai", uai)
      .order("annee", { ascending: true });

    if (niveau) {
      query = query.eq("niveau", niveau);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const payload =
      data?.map((row) => ({
        annee: row.annee,
        niveau: row.niveau,
        effectif_pred: row.effectif_pred,
      })) ?? [];

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch simulation results", details: err?.message },
      { status: 500 }
    );
  }
}
