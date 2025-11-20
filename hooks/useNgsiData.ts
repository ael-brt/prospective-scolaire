import { useEffect, useMemo, useState } from "react";

export type Secteur = { id: string; nomSecteur?: string; codeSecteur?: string };
export type Ecole = {
  id: string;
  uai?: string;
  patronyme?: string;
  secteurId?: string;
  typeEtablissement?: string;
};

export type ClassePoint = {
  annee: number;
  effectifs?: number | null;
  effectifsPredits?: number | null;
};

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

function useFetch<T>(url: string | null): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: !!url,
    error: null,
  });

  useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    const fetchData = async () => {
      setState({ data: null, loading: true, error: null });
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Erreur ${res.status} sur ${url}`);
        }
        const json = (await res.json()) as T;
        setState({ data: json, loading: false, error: null });
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error: err?.message ?? "Erreur inattendue",
        });
      }
    };
    fetchData();

    return () => controller.abort();
  }, [url]);

  return state;
}

export function useSectors() {
  return useFetch<Secteur[]>("/api/sectors");
}

export function useSchools(sectorId?: string) {
  const url = sectorId ? `/api/schools?secteurId=${encodeURIComponent(sectorId)}` : null;
  return useFetch<Ecole[]>(url);
}

export function useClasses(params?: { uai: string; startYear: number; endYear: number }) {
  const { uai, startYear, endYear } = params ?? {};

  const [state, setState] = useState<FetchState<ClassePoint[]>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!uai || startYear === undefined || endYear === undefined) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    const years = Array.from({ length: endYear - startYear + 1 }, (_, idx) => startYear + idx);

    const fetchAll = async () => {
      setState({ data: null, loading: true, error: null });
      try {
        const results = await Promise.all(
          years.map(async (annee) => {
            const res = await fetch(
              `/api/classes?uai=${encodeURIComponent(uai)}&annee=${annee}`,
              { signal: controller.signal }
            );
            if (!res.ok) throw new Error(`Erreur ${res.status} sur /api/classes annee=${annee}`);
            const data = await res.json();
            const first = Array.isArray(data) ? data[0] : undefined;
            return {
              annee,
              effectifs: first?.effectifs ?? null,
              effectifsPredits: first?.effectifsPredits ?? null,
            } as ClassePoint;
          })
        );
        setState({ data: results, loading: false, error: null });
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error: err?.message ?? "Erreur inattendue",
        });
      }
    };

    fetchAll();
    return () => controller.abort();
  }, [uai, startYear, endYear]);

  return state;
}
