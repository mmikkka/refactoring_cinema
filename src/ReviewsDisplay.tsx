import { useEffect, useState } from "react";
//import { httpClient } from "./api/http";

interface Review {
  id: number;
  filmId: string;
  clientId: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface Props {
  movieId: number;
}

// Добавляем моки для отзывов
const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    filmId: "1",
    clientId: "Алексей",
    rating: 5,
    text: "Потрясающий фильм! Визуальные эффекты на высоте.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    filmId: "1",
    clientId: "Марина",
    rating: 4,
    text: "Очень глубокий смысл, но немного затянуто в середине.",
    createdAt: new Date().toISOString(),
  },
];

export default function ReviewsDisplay({ movieId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);

        /* // Старый код запроса к API закомментирован
        const response = await httpClient.get(`/films/${movieId}/reviews`, {
          params: { page: 0, size: 20 },
        });
        setReviews(response.data.data || []); 
        */

        // Имитируем задержку сети и возвращаем моки
        await new Promise((resolve) => setTimeout(resolve, 600));
        setReviews(MOCK_REVIEWS);
      } catch (err) {
        console.error(err);
        setError("Ошибка загрузки отзывов");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [movieId]);

  if (loading) return <p className="text-light mt-3">Загрузка отзывов...</p>;
  if (error) return <p className="text-danger mt-3">{error}</p>;
  if (reviews.length === 0)
    return <p className="text-light mt-3">Нет отзывов для этого фильма.</p>;

  return (
    <div className="mt-4">
      <h4 className="text-light mb-3">Отзывы</h4>
      {reviews.map((r) => (
        <div
          key={r.id}
          className="card mb-2 p-3 bg-secondary text-light shadow-sm"
        >
          <div className="d-flex justify-content-between">
            <strong>{r.clientId}</strong>
            <span style={{ color: "#ffc107" }}>⭐ {r.rating}</span>
          </div>
          <p className="mb-0 mt-2">{r.text}</p>
        </div>
      ))}
    </div>
  );
}
