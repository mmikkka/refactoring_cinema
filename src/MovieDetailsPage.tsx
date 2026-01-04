import React, { useState } from "react";
import axios from "axios";

// Импорт хуков
import { useMovieSessions, useHallData } from "./hooks/useMovieDetails";

// Импорт компонентов
import SessionPicker from "./components/SessionPicker";
import HallPlanView from "./components/HallPlanView";
import PaymentForm from "./components/PaymentForm";
import ReviewsDisplay from "./ReviewsDisplay";

// Импорт типов
import type { Film, Session } from "./types/movie";
import type { Purchase } from "./types/user";

// Импорт конфигурации
import { API_BASE_URL, MESSAGES, PLACEHOLDER_POSTER } from "./config";

interface MovieDetailsPageProps {
  movie: Film;
  onBack: () => void;
}

const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({
  movie,
  onBack,
}) => {
  // Состояние
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [purchase, setPurchase] = useState<Purchase | null>(null);

  // Хуки данных
  const { sessions, loading: sessionsLoading } = useMovieSessions(movie.id);

  // Передаем ID сессии, если она выбрана
  const {
    hallPlan,
    tickets,
    loading: planLoading,
    refreshTickets,
  } = useHallData(selectedSession?.id);

  // Логика бронирования
  const handleReserve = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert(MESSAGES.authRequired);

    try {
      // 1. Бронируем места по одному
      // Ищем тикеты, соответствующие выбранным местам
      for (const seatId of selectedSeats) {
        // Приведение типов: seatId (number) -> ticket.seatId (string)
        const ticket = tickets.find((t) => t.seatId === String(seatId));
        if (ticket) {
          await axios.post(
            `${API_BASE_URL}/tickets/${ticket.id}/reserve`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      // 2. Создаем покупку
      // Собираем ID билетов для покупки
      const ticketIdsForPurchase = selectedSeats
        .map((id) => tickets.find((t) => t.seatId === String(id))?.id)
        .filter((id): id is string => id !== undefined);

      const res = await axios.post(
        `${API_BASE_URL}/purchases`,
        { ticketIds: ticketIdsForPurchase },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPurchase(res.data);
    } catch (err) {
      console.error(err);
      alert(MESSAGES.reserveError);
    }
  };

  const handlePaymentSuccess = () => {
    setPurchase(null);
    setSelectedSeats([]);
    refreshTickets();
  };

  return (
    <div className="container py-5 text-light">
      <button className="btn btn-outline-light mb-4" onClick={onBack}>
        ← Назад
      </button>

      <div className="row">
        {/* Постер */}
        <div className="col-md-4">
          <img
            src={movie.imageUrl || `${PLACEHOLDER_POSTER}`}
            alt={movie.title}
            className="img-fluid rounded shadow"
          />
        </div>

        {/* Основная инфа */}
        <div className="col-md-8">
          <h1 className="display-4 text-primary">{movie.title}</h1>
          <p>{movie.description}</p>
          <p>
            <strong>Жанр:</strong> {movie.genre} | <strong>Рейтинг:</strong>{" "}
            {movie.ageRating}
          </p>

          <hr className="bg-light" />

          {/* Компонент выбора сеанса */}
          <SessionPicker
            sessions={sessions}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedSessionId={selectedSession?.id}
            onSessionSelect={(s) => {
              setSelectedSession(s);
              setSelectedSeats([]); // Сброс мест при смене сеанса
            }}
            loading={sessionsLoading}
          />

          {/* Компонент схемы зала */}
          {selectedSession && hallPlan && (
            <HallPlanView
              hallPlan={hallPlan}
              tickets={tickets}
              selectedSeats={selectedSeats}
              onSeatClick={(id) =>
                setSelectedSeats((prev) =>
                  prev.includes(id)
                    ? prev.filter((i) => i !== id)
                    : [...prev, id]
                )
              }
              loading={planLoading}
            />
          )}

          {/* Кнопка "Забронировать" */}
          {selectedSeats.length > 0 && !purchase && (
            <div className="mt-4 text-center">
              <button
                className="btn btn-primary btn-xl px-5"
                onClick={handleReserve}
              >
                Забронировать ({selectedSeats.length} мест)
              </button>
            </div>
          )}

          {/* Компонент формы оплаты */}
          {purchase && (
            <PaymentForm
              purchaseId={purchase.id}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </div>
      </div>

      <div className="mt-5">
        <ReviewsDisplay movieId={movie.id} />
      </div>
    </div>
  );
};

export default MovieDetailsPage;
