"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ImpactNature = "Maternelle" | "Elementaire" | "Naissances";

type ImpactConfig = {
  coefPublic: number;
  coefPrive: number;
  coefLogementSocial: number;
  coefLogementPrive: number;
};

type ImpactState = Record<ImpactNature, ImpactConfig>;

const defaultImpact: ImpactState = {
  Maternelle: {
    coefPublic: 1,
    coefPrive: 0.2,
    coefLogementSocial: 1.2,
    coefLogementPrive: 0.8,
  },
  Elementaire: {
    coefPublic: 1,
    coefPrive: 0.15,
    coefLogementSocial: 1.1,
    coefLogementPrive: 0.7,
  },
  Naissances: {
    coefPublic: 1,
    coefPrive: 0,
    coefLogementSocial: 1,
    coefLogementPrive: 1,
  },
};

export default function NewSimulationPage() {
  const router = useRouter();
  const [name, setName] = useState("Simulation NGSI-LD");
  const [description, setDescription] = useState("");
  const [anneeDeDebut, setAnneeDeDebut] = useState<number>(2022);
  const [anneeZero, setAnneeZero] = useState<number>(2024);
  const [nombreAnneesProjection, setNombreAnneesProjection] = useState<number>(5);
  const [nombreClassesSpecialisees, setNombreClassesSpecialisees] = useState<number>(0);
  const [nombreAnneesNaissances, setNombreAnneesNaissances] = useState<number>(5);
  const [nombreAnneesTauxPassage, setNombreAnneesTauxPassage] = useState<number>(5);
  const [impactUrbanisme, setImpactUrbanisme] = useState<ImpactState>(defaultImpact);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const impactNatures = useMemo<ImpactNature[]>(() => ["Maternelle", "Elementaire", "Naissances"], []);

  const updateImpact = (nature: ImpactNature, key: keyof ImpactConfig, value: number) => {
    setImpactUrbanisme((prev) => ({
      ...prev,
      [nature]: {
        ...prev[nature],
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const parameters = {
      anneeDeDebut,
      anneeZero,
      nombreAnneesProjection,
      nombreClassesSpecialisees,
      nombreAnneesNaissances,
      nombreAnneesTauxPassage,
      impactUrbanisme,
    };

    try {
      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          parameters,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Echec de la creation");
      }
      router.push("/simulations");
    } catch (err: any) {
      setError(err?.message ?? "Erreur inattendue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="card p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Simulations</p>
        <h1 className="text-3xl font-semibold text-white">Nouvelle simulation</h1>
        <p className="text-muted text-sm">
          Les simulations sont stockees dans Supabase (pas d'ecriture sur le broker NGSI-LD). Renseignez vos
          parametres pour creer une nouvelle configuration.
        </p>
      </header>

      <form className="card p-6 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="Nom de la simulation" value={name} onChange={setName} />
          <TextField label="Description (optionnel)" value={description} onChange={setDescription} />
          <Field
            label="Annee de debut"
            value={anneeDeDebut}
            onChange={(v) => setAnneeDeDebut(v)}
          />
          <Field
            label="Annee zero"
            value={anneeZero}
            onChange={(v) => setAnneeZero(v)}
          />
          <Field
            label="Nombre d'annees de projection"
            value={nombreAnneesProjection}
            onChange={(v) => setNombreAnneesProjection(v)}
          />
          <Field
            label="Nombre de classes specialisees"
            value={nombreClassesSpecialisees}
            onChange={(v) => setNombreClassesSpecialisees(v)}
          />
          <Field
            label="Nombre d'annees de naissances"
            value={nombreAnneesNaissances}
            onChange={(v) => setNombreAnneesNaissances(v)}
          />
          <Field
            label="Nombre d'annees de taux de passage"
            value={nombreAnneesTauxPassage}
            onChange={(v) => setNombreAnneesTauxPassage(v)}
          />
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Impact urbanisme</h2>
          <p className="text-muted text-sm">
            Ajustez les coefficients par nature (maternelle, elementaire, naissances). Les champs public/prive et logements permettent de
            ponderer l'impact des constructions.
          </p>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {impactNatures.map((nature) => (
              <div key={nature} className="rounded-xl border border-slate-800 bg-panel p-4 space-y-3">
                <h3 className="text-lg font-semibold text-white">{nature}</h3>
                <ImpactField
                  label="Coef. public"
                  value={impactUrbanisme[nature].coefPublic}
                  onChange={(v) => updateImpact(nature, "coefPublic", v)}
                />
                <ImpactField
                  label="Coef. prive"
                  value={impactUrbanisme[nature].coefPrive}
                  onChange={(v) => updateImpact(nature, "coefPrive", v)}
                />
                <ImpactField
                  label="Coef. logement social"
                  value={impactUrbanisme[nature].coefLogementSocial}
                  onChange={(v) => updateImpact(nature, "coefLogementSocial", v)}
                />
                <ImpactField
                  label="Coef. logement prive"
                  value={impactUrbanisme[nature].coefLogementPrive}
                  onChange={(v) => updateImpact(nature, "coefLogementPrive", v)}
                />
              </div>
            ))}
          </div>
        </section>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <div className="flex justify-end">
          <button type="submit" className="cta disabled:opacity-70" disabled={submitting}>
            {submitting ? "Creation..." : "Generer la configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted">
      {label}
      <input
        type="number"
        className="rounded-lg border border-slate-700 bg-panel px-3 py-2 text-white focus:border-accent focus:outline-none"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted col-span-2 lg:col-span-1">
      {label}
      <input
        type="text"
        className="rounded-lg border border-slate-700 bg-panel px-3 py-2 text-white focus:border-accent focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ImpactField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-muted">
      {label}
      <input
        type="number"
        step="0.1"
        className="rounded-md border border-slate-700 bg-[#0f162c] px-3 py-2 text-white focus:border-accent focus:outline-none"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
