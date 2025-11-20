import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithTenant } from "../../../lib/auth";
import { createNgsildClient } from "../../../lib/ngsildClient";

export async function GET(req: NextRequest) {
  const { user, accessToken, tenantId } = await getServerSessionWithTenant();

  if (!user || !accessToken || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NGSI_LD_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Missing NGSI-LD base URL (set NGSI_LD_BASE_URL)" },
      { status: 500 }
    );
  }

  const uai = req.nextUrl.searchParams.get("uai") ?? undefined;
  const annee = req.nextUrl.searchParams.get("annee") ?? undefined;
  const niveau = req.nextUrl.searchParams.get("niveau") ?? undefined;

  // NGSI-LD query expression. Adjust as needed if your broker expects a different syntax.
  const qParts: string[] = [];
  if (uai) qParts.push(`uai=="${uai}"`);
  if (niveau) qParts.push(`niveau=="${niveau}"`);
  const q = qParts.length ? qParts.join(";") : undefined;

  // Temporal queries vary by broker: you might need options=temporalValues + timerel/from/until/timeproperty.
  // Here we leave temporal params commented for adaptation:
  // const additionalParams = annee
  //   ? {
  //       options: "temporalValues",
  //       timerel: "between",
  //       timeproperty: "observedAt",
  //       timeAt: `${annee}-01-01T00:00:00Z`,
  //       endTimeAt: `${annee}-12-31T23:59:59Z`,
  //     }
  //   : undefined;

  try {
    const client = createNgsildClient({
      baseUrl,
      tenant: tenantId,
      token: accessToken,
    });

    const entities = await client.getEntities({
      type: "Classe",
      q,
      // If you enable temporal queries above, pass `options` and `additionalParams` here.
      // options: additionalParams?.options,
      // additionalParams,
    });

    const simplified = entities.map((e: any) => ({
      id: e.id,
      uai: e.uai?.value,
      niveau: e.niveau?.value,
      effectifs: e.effectifs?.value,
      effectifsPredits: e.effectifsPredits?.value,
      // If temporalValues is enabled, you likely receive arrays; adapt mapping accordingly.
    }));

    return NextResponse.json(simplified);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch classes", details: error?.message },
      { status: 500 }
    );
  }
}
