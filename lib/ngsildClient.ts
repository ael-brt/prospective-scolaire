/**
 * NGSI-LD client utilities for simple entity queries.
 * This keeps a minimal surface: configuration, a factory, and typed interfaces
 * for common school planning entities. Types mirror NGSI-LD conventions
 * (id, type, Property/Relationship attributes) without being overly strict.
 */

export interface NgsildClientConfig {
  baseUrl: string;
  tenant: string; // e.g., "urn:ngsi-ld:tenant:default"
  token?: string; // JWT for Authorization header (Bearer)
  /**
    Optional custom JSON-LD context URL.
    Defaults to Smart Data Models common context.
  */
  contextUrl?: string;
}

type FetchFn = typeof fetch;

interface ClientDeps {
  fetchImpl?: FetchFn;
}

export function createNgsildClient(config: NgsildClientConfig, deps: ClientDeps = {}) {
  const {
    baseUrl,
    tenant,
    token,
    contextUrl = "https://smartdatamodels.org/context.jsonld",
  } = config;
  const fetchImpl = deps.fetchImpl ?? fetch;

  const normalizeBase = (url: string) => url.replace(/\/+$/, "");

  async function requestEntities(params: {
    type: string;
    options?: string;
    attrs?: string;
    q?: string;
    additionalParams?: Record<string, string | undefined>;
  }): Promise<any[]> {
    const url = new URL(
      // If baseUrl already points to /ngsi-ld/v1, avoid double pathing
      `${normalizeBase(baseUrl).endsWith("/entities") ? normalizeBase(baseUrl) : `${normalizeBase(baseUrl)}/ngsi-ld/v1/entities`}`
    );

    url.searchParams.set("type", params.type);
    if (params.options) url.searchParams.set("options", params.options);
    if (params.attrs) url.searchParams.set("attrs", params.attrs);
    if (params.q) url.searchParams.set("q", params.q);
    if (params.additionalParams) {
      Object.entries(params.additionalParams).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, value);
      });
    }

    const headers: Record<string, string> = {
      Accept: "application/ld+json",
      "NGSILD-Tenant": tenant,
      Link: `<${contextUrl}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetchImpl(url.toString(), {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      const reason = bodyText ? `: ${bodyText}` : "";
      throw new Error(`NGSI-LD request failed (${res.status} ${res.statusText})${reason}`);
    }

    return res.json();
  }

  async function createEntity(entity: Record<string, any>) {
    const url = normalizeBase(baseUrl).endsWith("/entities")
      ? normalizeBase(baseUrl)
      : `${normalizeBase(baseUrl)}/ngsi-ld/v1/entities`;

    const headers: Record<string, string> = {
      Accept: "application/ld+json",
      "Content-Type": "application/ld+json",
      "NGSILD-Tenant": tenant,
      Link: `<${contextUrl}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(entity),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      const reason = bodyText ? `: ${bodyText}` : "";
      throw new Error(`NGSI-LD create failed (${res.status} ${res.statusText})${reason}`);
    }
  }

  return {
    /**
     * Fetch entities by type with NGSI-LD query params.
     * - type: required NGSI-LD entity type.
     * - options/attrs: forwarded as-is to the broker.
     */
    async getEntities(params: {
      type: string;
      options?: string;
      attrs?: string;
      q?: string;
      additionalParams?: Record<string, string | undefined>;
    }) {
      return requestEntities(params);
    },
    /**
     * Fetch DataServiceProcessing entities (simulation runs).
     */
    async getDataServiceProcessingEntities() {
      return requestEntities({ type: "DataServiceProcessing" });
    },
    /**
     * Create an NGSI-LD entity.
     */
    async createEntity(entity: Record<string, any>) {
      return createEntity(entity);
    },
  };
}

// ---- Example entity shapes (simplified) ----

interface BaseEntity {
  id: string; // urn:ngsi-ld:...
  type: string;
  "@context"?: string | string[];
}

interface Property<T = unknown> {
  type: "Property";
  value: T;
  observedAt?: string;
  unitCode?: string;
}

interface Relationship {
  type: "Relationship";
  object: string; // id of the related entity
}

export interface SecteurScolaire extends BaseEntity {
  type: "SecteurScolaire";
  nomSecteur?: Property<string>;
  codeSecteur?: Property<string>;
  commune?: Property<string>;
  academie?: Property<string>;
}

export interface EtablissementScolaire extends BaseEntity {
  type: "EtablissementScolaire";
  uai?: Property<string>;
  patronyme?: Property<string>;
  secteur?: Relationship; // relationship to SecteurScolaire
  typeEtablissement?: Property<"public" | "prive">;
  adresse?: Property<string>;
  capacite?: Property<number>;
}

export interface Classe extends BaseEntity {
  type: "Classe";
  uai?: Property<string>; // link to the school UAI
  niveau?: Property<string>; // e.g., "CM2", "2nde"
  effectifs?: Property<number>;
  effectifsPredits?: Property<number>;
}

export interface Demographie extends BaseEntity {
  type: "Demographie";
  secteur?: Relationship; // relationship to SecteurScolaire
  naissances?: Property<number>; // could be temporal; keep simple here
  naissancesPredites?: Property<number>;
}

export interface ConstructionLogements extends BaseEntity {
  type: "ConstructionLogements";
  secteur?: Relationship;
  dateLivraison?: Property<string>; // ISO date string
  nbLogements?: Property<number>;
  typeLogement?: Property<string>; // e.g., collectif, individuel
  typologie?: Property<"T1" | "T2" | "T3" | "T4" | "T5+">;
}
