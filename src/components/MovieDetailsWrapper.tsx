import { useEffect, useState } from "react";
import MovieDetailsPage from "../MovieDetailsPage";
import { useNavigate, useParams } from "react-router-dom";
import * as movie from "../types/movie";

/**
 * Обертка для страницы деталей фильма.
 * Отвечает за загрузку данных о конкретном фильме по ID из URL.
 */
function MovieDetailsWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [film, setFilm] = useState<movie.Film | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    movie
      .getFilmById(id)
      .then(setFilm)
      .catch((err) => {
        console.error(err);
        setError("Не удалось загрузить данные фильма");
      });
  }, [id]);

  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;
  if (!film) return <div className="text-center mt-5">Загрузка...</div>;

  const handleSelectSession = (sessionId: number) => {
    navigate(`/sessions/${sessionId}`, {
      state: { from: "movie_details", timestamp: new Date().toISOString() },
    });
  };

  return <MovieDetailsPage film={film} onSelectSession={handleSelectSession} />;
}
export default MovieDetailsWrapper;
