"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ApiResult = {
  annee: number;
  niveau: string;
  effectif_pred: number;
};

export type SimulationResultChartProps = {
  simulationId: string;
  uai: string;
  niveau?: string;
};

export function SimulationResultChart({
  simulationId,
  uai,
  niveau,
}: SimulationResultChartProps) {
  const [data, setData] = useState<ApiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!simulationId || !uai) return;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ simulationId, uai });
        if (niveau) params.set("niveau", niveau);
        const res = await fetch(`/api/simulation-results?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement des résultats`);
        const json = (await res.json()) as ApiResult[];
        setData(json);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setError(err?.message ?? "Erreur inattendue");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [simulationId, uai, niveau]);

  // Transform data to chart-friendly shape: one line per niveau if multiple niveaux.
  const chartData = useMemo(() => {
    const byYear: Record<number, Record<string, number>> = {};
    data.forEach((row) => {
      byYear[row.annee] = byYear[row.annee] ?? {};
      byYear[row.annee][row.niveau] = row.effectif_pred;
    });
    return Object.entries(byYear)
      .map(([annee, levels]) => ({
        annee: Number(annee),
        ...levels,
      }))
      .sort((a, b) => a.annee - b.annee);
  }, [data]);

  const niveaux = useMemo(() => {
    const set = new Set<string>();
    data.forEach((row) => set.add(row.niveau));
    return Array.from(set);
  }, [data]);

  if (!simulationId || !uai) {
    return <div className="text-sm text-muted">Sélectionnez une simulation et une école.</div>;
  }

  if (loading) {
    return <div className="text-sm text-muted">Chargement des résultats...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-400">{error}</div>;
  }

  if (!chartData.length) {
    return <div className="text-sm text-muted">Aucune donnée à afficher.</div>;
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" />
          <XAxis dataKey="annee" stroke="#9fb3c8" />
          <YAxis stroke="#9fb3c8" />
          <Tooltip
            contentStyle={{ backgroundColor: "#11182f", border: "1px solid rgba(159,179,200,0.2)" }}
            labelStyle={{ color: "#e6edf5" }}
          />
          <Legend />
          {niveaux.map((niv, idx) => (
            <Line
              key={niv}
              type="monotone"
              dataKey={niv}
              name={niv}
              stroke={colorForIndex(idx)}
              strokeWidth={2}
              dot={{ stroke: colorForIndex(idx), strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function colorForIndex(i: number) {
  const palette = ["#4fd1c5", "#8b5cf6", "#f59e0b", "#22d3ee", "#f472b6", "#10b981"];
  return palette[i % palette.length];
}
