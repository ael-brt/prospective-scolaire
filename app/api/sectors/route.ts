import { NextResponse } from "next/server";
import { getServerSessionWithTenant } from "../../../lib/auth";
import { createNgsildClient } from "../../../lib/ngsildClient";

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

    const entities = await client.getEntities({ type: "SecteurScolaire" });
    const simplified = entities.map((e: any) => ({
      id: e.id,
      nomSecteur: e.nomSecteur?.value,
      codeSecteur: e.codeSecteur?.value,
    }));

    return NextResponse.json(simplified);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch sectors", details: error?.message },
      { status: 500 }
    );
  }
}
