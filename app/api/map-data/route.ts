import { NextResponse } from "next/server";
import { getServerSessionWithTenant } from "../../../lib/auth";
import { createNgsildClient } from "../../../lib/ngsildClient";

type GeoPoint = GeoJSON.Point;
type GeoPolygon = GeoJSON.Polygon | GeoJSON.MultiPolygon;

export async function GET() {
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

  try {
    const client = createNgsildClient({
      baseUrl,
      tenant: tenantId,
      token: accessToken,
    });

    // Fetch sectors and schools in parallel
    const [sectors, schools] = await Promise.all([
      client.getEntities({ type: "SecteurScolaire" }),
      client.getEntities({ type: "EtablissementScolaire" }),
    ]);

    const sectorsOut =
      sectors?.map((s: any) => ({
        id: s.id,
        name: s.nomSecteur?.value ?? s.codeSecteur?.value ?? s.id,
        geometry: s.location?.value as GeoPolygon,
      })) ?? [];

    const schoolsOut =
      schools?.map((e: any) => ({
        id: e.id,
        name: e.patronyme?.value ?? e.uai?.value ?? e.id,
        uai: e.uai?.value ?? "",
        geometry: e.location?.value as GeoPoint,
        effectifs: e.effectifs?.value ?? null,
      })) ?? [];

    return NextResponse.json({
      sectors: sectorsOut.filter((s) => !!s.geometry),
      schools: schoolsOut.filter((s) => !!s.geometry),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch map data", details: error?.message },
      { status: 500 }
    );
  }
}
