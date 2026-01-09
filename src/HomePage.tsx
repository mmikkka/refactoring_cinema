// src/HomePage.tsx
import { useState } from "react";
import * as movieApi from "./types/movie";
import { useFilms } from "./hooks/useFilms";
import MovieDetailsPage from "./MovieDetailsPage";
import MovieDisplay from "./components/MovieDisplay";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const { films, loading, error } = useFilms();
  const [selectedFilm, setSelectedFilm] = useState<movieApi.Film | null>(null);
  const navigate = useNavigate();

  const handleSelect = (id: string | number) => {
    navigate(`/movie/${id}`);
  };

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
        <MovieDisplay
          key={film.id}
          movie={film}
          variant="card"
          actionButton={
            <button
              onClick={() => handleSelect(film.id)}
              className="btn btn-primary w-100"
            >
              Подробнее
            </button>
          }
        />
      ))}
    </div>
  );
}
