"use client";

import { useMemo, useState } from "react";
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

import {
  useClasses,
  useSchools,
  useSectors,
  type Ecole,
  type Secteur,
} from "../../hooks/useNgsiData";

const START_YEAR = 2022;
const END_YEAR = 2026;

export default function DashboardPage() {
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");

  const {
    data: sectors,
    loading: sectorsLoading,
    error: sectorsError,
  } = useSectors();
  const {
    data: schools,
    loading: schoolsLoading,
    error: schoolsError,
  } = useSchools(selectedSector);
  const {
    data: classSeries,
    loading: classesLoading,
    error: classesError,
  } = useClasses(
    selectedSchool
      ? { uai: selectedSchool, startYear: START_YEAR, endYear: END_YEAR }
      : undefined
  );

  const selectedSectorLabel = useMemo(() => {
    const sector = sectors?.find((s: Secteur) => s.id === selectedSector);
    return sector?.nomSecteur ?? sector?.codeSecteur ?? "Secteur";
  }, [selectedSector, sectors]);

  const selectedSchoolLabel = useMemo(() => {
    const school = schools?.find((s: Ecole) => s.id === selectedSchool);
    return school?.patronyme ?? school?.uai ?? "Etablissement";
  }, [selectedSchool, schools]);

  return (
    <div className="space-y-8">
      <header className="card p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Tableau de bord</p>
          <h1 className="text-3xl font-semibold text-white">
            Vue generale des secteurs et etablissements
          </h1>
          <p className="text-muted">
            Selectionnez un secteur, puis un etablissement pour visualiser les effectifs observes
            et predits sur plusieurs annees.
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card p-5 space-y-3 md:col-span-1">
          <h2 className="text-lg font-semibold text-white">Filtres</h2>
          <label className="flex flex-col gap-2 text-sm text-muted">
            Secteur
            <select
              className="rounded-lg border border-slate-700 bg-panel px-3 py-2 text-white focus:border-accent focus:outline-none"
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value);
                setSelectedSchool("");
              }}
            >
              <option value="">Choisir un secteur</option>
              {sectors?.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.nomSecteur ?? sector.codeSecteur ?? sector.id}
                </option>
              ))}
            </select>
          </label>

          {sectorsLoading && <div className="text-sm text-muted">Chargement des secteurs...</div>}
          {sectorsError && <div className="text-sm text-red-400">{sectorsError}</div>}

          <label className="flex flex-col gap-2 text-sm text-muted">
            Etablissement
            <select
              className="rounded-lg border border-slate-700 bg-panel px-3 py-2 text-white focus:border-accent focus:outline-none"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              disabled={!selectedSector || !schools?.length}
            >
              <option value="">Choisir un etablissement</option>
              {schools?.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.patronyme ?? school.uai ?? school.id}
                </option>
              ))}
            </select>
          </label>

          {schoolsLoading && selectedSector && (
            <div className="text-sm text-muted">Chargement des etablissements...</div>
          )}
          {schoolsError && <div className="text-sm text-red-400">{schoolsError}</div>}
        </div>

        <div className="card p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent">Effectifs</p>
              <h3 className="text-xl font-semibold text-white">
                {selectedSchool ? selectedSchoolLabel : "Selectionnez un etablissement"}
              </h3>
              <p className="text-muted text-sm">
                Secteur : {selectedSector ? selectedSectorLabel : "-"}
              </p>
            </div>
            {classesLoading && <span className="text-muted text-sm">Chargement...</span>}
          </div>

          <div className="mt-4 h-80 rounded-lg bg-[#0f162c]">
            {classSeries && classSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={classSeries}>
                  <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" />
                  <XAxis dataKey="annee" stroke="#9fb3c8" />
                  <YAxis stroke="#9fb3c8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#11182f", border: "1px solid rgba(159,179,200,0.2)" }}
                    labelStyle={{ color: "#e6edf5" }}
                    formatter={(value: any) => [value, "Effectif"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="effectifs"
                    name="Observes"
                    stroke="#4fd1c5"
                    strokeWidth={2}
                    dot={{ stroke: "#4fd1c5", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="effectifsPredits"
                    name="Predits"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ stroke: "#8b5cf6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted text-sm">
                {classesError
                  ? classesError
                  : selectedSchool
                    ? "Aucune donnee a afficher"
                    : "Choisissez un secteur puis un etablissement"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
