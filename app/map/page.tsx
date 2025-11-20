"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// Dynamic import react-leaflet components (no SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SectorFeature = {
  id: string;
  name: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
};

type SchoolFeature = {
  id: string;
  name: string;
  uai: string;
  geometry: GeoJSON.Point;
  effectifs?: number | null;
};

type MapData = {
  sectors: SectorFeature[];
  schools: SchoolFeature[];
};

export default function MapPage() {
  const [data, setData] = useState<MapData | null>(null);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((L) => {
      // Fix default marker icons (Next.js + Leaflet)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setLeaflet(L);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/map-data", { signal: controller.signal });
        if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement de la carte`);
        const json = (await res.json()) as MapData;
        setData(json);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setError(err?.message ?? "Erreur inattendue");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  // Compute bounds to fit data when available
  const bounds = useMemo(() => {
    if (!data || !leaflet) return null;
    const layer = leaflet.geoJSON({
      type: "FeatureCollection",
      features: [
        ...(data.sectors ?? []).map((s) => ({
          type: "Feature",
          id: s.id,
          properties: {},
          geometry: s.geometry,
        })),
        ...(data.schools ?? []).map((s) => ({
          type: "Feature",
          id: s.id,
          properties: {},
          geometry: s.geometry,
        })),
      ],
    } as GeoJSON.FeatureCollection);
    return layer.getBounds();
  }, [data, leaflet]);

  useEffect(() => {
    if (mapRef.current && bounds && bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds]);

  return (
    <div className="space-y-6">
      <header className="card p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Carte</p>
        <h1 className="text-3xl font-semibold text-white">Secteurs et etablissements</h1>
        <p className="text-muted text-sm">
          Visualisez les SecteurScolaire (polygones) et EtablissementScolaire (points). Les popups affichent
          les informations principales.
        </p>
      </header>

      <div className="card p-3">
        {loading && <div className="text-muted text-sm p-4">Chargement des donnees carto...</div>}
        {error && <div className="text-red-400 text-sm p-4">{error}</div>}
        {!loading && !error && leaflet && (
          <div className="h-[600px] w-full rounded-lg overflow-hidden">
            <MapContainer
              ref={mapRef as any}
              center={[48.8566, 2.3522]}
              zoom={11}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {data?.sectors?.map((sector) => (
                <GeoJSON
                  key={sector.id}
                  data={sector.geometry as any}
                  style={() => ({
                    color: "#4fd1c5",
                    weight: 2,
                    fillColor: "#4fd1c5",
                    fillOpacity: 0.2,
                  })}
                >
                  {/* Sector popup */}
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold text-white">{sector.name}</div>
                      <div className="text-muted">ID: {sector.id}</div>
                    </div>
                  </Popup>
                </GeoJSON>
              ))}

              {data?.schools?.map((school) => {
                const coords = school.geometry?.coordinates;
                if (!coords || coords.length < 2) return null;
                const [lng, lat] = coords;
                return (
                  <Marker key={school.id} position={[lat, lng]}>
                    <Popup>
                      <div className="text-sm space-y-1">
                        <div className="font-semibold text-white">{school.name}</div>
                        <div className="text-muted">UAI: {school.uai}</div>
                        {school.effectifs !== undefined && school.effectifs !== null ? (
                          <div className="text-muted">Effectifs: {school.effectifs}</div>
                        ) : null}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}
        {!loading && !error && !leaflet && (
          <div className="text-sm text-muted p-4">Initialisation de la carte...</div>
        )}
      </div>
    </div>
  );
}
