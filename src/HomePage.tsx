// src/HomePage.tsx
import { useState } from "react";
import * as movieApi from "./types/movie";
import { useFilms } from "./hooks/useFilms";
import MovieDetailsPage from "./MovieDetailsPage";
import MovieCard from "./MovieCard";

export default function HomePage() {
  const { films, loading, error } = useFilms();
  const [selectedFilm, setSelectedFilm] = useState<movieApi.Film | null>(null);

  if (selectedFilm) {
    return (
      <MovieDetailsPage
        movie={selectedFilm}
        onBack={() => setSelectedFilm(null)}
      />
    );
  }

  if (loading) {
    return <p className="text-center mt-5">Загрузка фильмов...</p>;
  }

  if (error) {
    return <p className="text-center text-danger mt-5">Ошибка: {error}</p>;
  }

  return (
    <div className="container py-5 d-flex flex-wrap gap-4">
      {films.map((film) => (
        <MovieCard
          key={film.id}
          movie={film}
          onSelect={() => setSelectedFilm(film)}
        />
      ))}
    </div>
  );
}
