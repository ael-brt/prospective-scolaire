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
  const anneeDebut = req.nextUrl.searchParams.get("anneeDebut") ?? undefined;
  const anneeFin = req.nextUrl.searchParams.get("anneeFin") ?? undefined;

  const q = secteurId ? `secteur=="${secteurId}"` : undefined;

  // To fetch temporal series you may need NGSI-LD temporal params (options=temporalValues, timerel, timeAt).
  // Adjust the commented block to your broker:
  // const additionalParams =
  //   anneeDebut && anneeFin
  //     ? {
  //         options: "temporalValues",
  //         timerel: "between",
  //         timeAt: `${anneeDebut}-01-01T00:00:00Z`,
  //         endTimeAt: `${anneeFin}-12-31T23:59:59Z`,
  //         timeproperty: "observedAt",
  //       }
  //     : undefined;

  try {
    const client = createNgsildClient({
      baseUrl,
      tenant: tenantId,
      token: accessToken,
    });

    const entities = await client.getEntities({
      type: "Demographie",
      q,
      // Uncomment and pass temporal parameters if you need aggregated/temporal values:
      // options: additionalParams?.options,
      // additionalParams,
    });

    const simplified = entities.map((e: any) => ({
      id: e.id,
      secteurId: e.secteur?.object,
      naissances: e.naissances?.value,
      naissancesPredites: e.naissancesPredites?.value,
      // If temporalValues used, adapt mapping to handle arrays of values per instant.
    }));

    return NextResponse.json(simplified);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch demography", details: error?.message },
      { status: 500 }
    );
  }
}
