// src/hooks/useFilms.ts
import { useEffect, useState } from "react";
import * as movieApi from "../types/movie";

export function useFilms() {
  const [films, setFilms] = useState<movieApi.Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    movieApi
      .getFilms()
      .then((data) => {
        if (!cancelled) {
          setFilms(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Ошибка загрузки фильмов");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { films, loading, error };
}
