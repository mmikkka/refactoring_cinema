import React, { useState } from "react";
import { useMovieSessions, useHallData } from "./hooks/useMovieDetails";
import SessionPicker from "./components/SessionPicker";
import HallPlanView from "./components/HallPlanView";
import PaymentForm from "./components/PaymentForm";
import ReviewsDisplay from "./ReviewsDisplay";
import MovieDisplay from "./components/MovieDisplay";
import { httpClient } from "./api/http";
import type { Film, Session } from "./types/movie";
import type { Purchase } from "./types/user";

interface MovieDetailsPageProps {
  movie: Film;
  onBack: () => void;
}

const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({
  movie,
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [purchase, setPurchase] = useState<Purchase | null>(null);

  const { sessions, loading: sessionsLoading } = useMovieSessions(movie.id);
  const {
    hallPlan,
    tickets,
    loading: planLoading,
    refreshTickets,
  } = useHallData(selectedSession?.id);

  const handleReserve = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Сначала авторизуйтесь");

    try {
      const ticketIds = selectedSeats
        .map((id) => tickets.find((t) => t.seatId === String(id))?.id)
        .filter((id): id is string => !!id);

      if (ticketIds.length === 0) return;

      await Promise.all(
        ticketIds.map((id) => httpClient.post(`/tickets/${id}/reserve`, {}))
      );

      const res = await httpClient.post("/purchases", { ticketIds });

      setPurchase(res.data);
    } catch (err) {
      alert("Ошибка при бронировании");
    }
  };

  return (
    <div className="container py-5 text-light">
      <button className="btn btn-outline-light mb-4" onClick={onBack}>
        ← Назад к списку
      </button>

      {/* Верхняя часть: Инфо о фильме */}
      <MovieDisplay movie={movie} variant="detailed" />

      <div className="row mt-5">
        <div className="col-md-4"></div> {/* Отступ под постером */}
        <div className="col-md-8">
          <h3 className="h4 mb-4 text-warning">Выберите сеанс и места</h3>

          <SessionPicker
            sessions={sessions}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedSessionId={selectedSession?.id}
            onSessionSelect={(s) => {
              setSelectedSession(s);
              setSelectedSeats([]);
            }}
            loading={sessionsLoading}
          />

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

          {selectedSeats.length > 0 && !purchase && (
            <div className="mt-4">
              <button
                className="btn btn-primary btn-lg w-100"
                onClick={handleReserve}
              >
                Забронировать ({selectedSeats.length} мест)
              </button>
            </div>
          )}

          {purchase && (
            <div className="mt-4">
              <PaymentForm
                purchaseId={purchase.id}
                onSuccess={() => {
                  setPurchase(null);
                  setSelectedSeats([]);
                  refreshTickets();
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 border-top pt-4 border-secondary">
        <ReviewsDisplay movieId={movie.id} />
      </div>
    </div>
  );
};

export default MovieDetailsPage;
