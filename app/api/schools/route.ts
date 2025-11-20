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

  const secteurId = req.nextUrl.searchParams.get("secteurId") ?? undefined;

  // NGSI-LD filtering uses `q`. Adjust the expression to match your broker schema.
  // Here we assume `secteur` is a Relationship with an `object` equal to secteurId.
  const q = secteurId ? `secteur=="${secteurId}"` : undefined;

  try {
    const client = createNgsildClient({
      baseUrl,
      tenant: tenantId,
      token: accessToken,
    });

    const entities = await client.getEntities({
      type: "EtablissementScolaire",
      q,
    });

    const simplified = entities.map((e: any) => ({
      id: e.id,
      uai: e.uai?.value,
      patronyme: e.patronyme?.value,
      secteurId: e.secteur?.object,
      typeEtablissement: e.typeEtablissement?.value,
    }));

    return NextResponse.json(simplified);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch schools", details: error?.message },
      { status: 500 }
    );
  }
}
