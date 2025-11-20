"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SimulationResultChart } from "../../../components/SimulationResultChart";

type School = {
  id: string;
  uai?: string;
  patronyme?: string;
};

export default function SimulationDetailPage() {
  const params = useParams();
  const simulationId = params?.id as string | undefined;

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedUai, setSelectedUai] = useState<string>("");
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadSchools = async () => {
      setLoadingSchools(true);
      setError(null);
      try {
        const res = await fetch("/api/schools", { signal: controller.signal });
        if (!res.ok) throw new Error("Erreur lors du chargement des établissements");
        const data = await res.json();
        setSchools(data);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setError(err?.message ?? "Erreur inattendue");
      } finally {
        if (!controller.signal.aborted) setLoadingSchools(false);
      }
    };
    loadSchools();
    return () => controller.abort();
  }, []);

  const selectedLabel = useMemo(() => {
    const found = schools.find((s) => s.uai === selectedUai || s.id === selectedUai);
    return found?.patronyme ?? found?.uai ?? selectedUai;
  }, [schools, selectedUai]);

  return (
    <div className="space-y-6">
      <header className="card p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Simulation</p>
        <h1 className="text-3xl font-semibold text-white">Résultats projetés</h1>
        <p className="text-muted text-sm">Simulation ID : {simulationId ?? "—"}</p>
      </header>

      <div className="card p-6 space-y-4">
        <div className="flex flex-col gap-2 text-sm text-muted md:flex-row md:items-center md:gap-4">
          <label className="flex flex-col gap-2 text-sm text-muted">
            Établissement (UAI)
            <select
              className="rounded-lg border border-slate-700 bg-panel px-3 py-2 text-white focus:border-accent focus:outline-none"
              value={selectedUai}
              onChange={(e) => setSelectedUai(e.target.value)}
            >
              <option value="">Choisir une école</option>
              {schools.map((s) => (
                <option key={s.id} value={s.uai ?? s.id}>
                  {s.patronyme ?? s.uai ?? s.id}
                </option>
              ))}
            </select>
          </label>
          {loadingSchools && <span className="text-muted text-sm">Chargement des écoles...</span>}
          {error && <span className="text-red-400 text-sm">{error}</span>}
        </div>

        <div className="card p-4">
          {selectedUai && simulationId ? (
            <>
              <p className="text-sm text-muted mb-2">
                Courbe des effectifs prédits - {selectedLabel}
              </p>
              <SimulationResultChart simulationId={simulationId} uai={selectedUai} />
            </>
          ) : (
            <div className="text-sm text-muted">Choisissez une simulation et une école.</div>
          )}
        </div>
      </div>
    </div>
  );
}
