"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SimulationSummary = {
  id: string;
  name: string;
  description?: string;
  status: "PENDING" | "RUNNING" | "DONE" | "ERROR" | string;
  createdAt?: string;
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
  RUNNING: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  DONE: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
  ERROR: "bg-red-500/20 text-red-300 border border-red-500/40",
};

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/simulations", { signal: controller.signal });
        if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement des simulations`);
        const data = (await res.json()) as SimulationSummary[];
        setSimulations(data);
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

  const hasData = useMemo(() => simulations && simulations.length > 0, [simulations]);

  const badgeClass = (status?: string) =>
    statusStyles[status ?? ""] ?? "bg-slate-600/30 text-slate-200 border border-slate-600/50";

  return (
    <div className="space-y-6">
      <header className="card p-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Simulations</p>
          <h1 className="text-3xl font-semibold text-white">Configurations</h1>
          <p className="text-muted text-sm">
            Donnees stockees dans Supabase (multi-tenant). Cliquez sur une simulation pour voir les details
            (a venir).
          </p>
        </div>
        <Link href="/simulations/new" className="cta inline-flex items-center justify-center">
          Nouvelle simulation
        </Link>
      </header>

      <div className="card p-6">
        {loading && <div className="text-muted text-sm">Chargement des simulations...</div>}
        {error && <div className="text-red-400 text-sm">{error}</div>}

        {!loading && !error && !hasData && (
          <div className="text-muted text-sm">Aucune simulation pour le moment.</div>
        )}

        {!loading && !error && hasData && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-muted">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Creee</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((sim) => (
                  <tr key={sim.id} className="border-t border-slate-800">
                    <td className="px-4 py-3 text-white">
                      <Link href={`/simulations/${sim.id}`} className="hover:underline">
                        {sim.name ?? sim.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {sim.description ?? "Simulation NGSI-LD"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(sim.status)}`}>
                        {sim.status ?? "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {sim.createdAt ? new Date(sim.createdAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
