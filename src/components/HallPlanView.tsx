import React from "react";
import type { HallPlan, Ticket } from "../types/movie";

interface HallPlanViewProps {
  hallPlan: HallPlan;
  tickets: Ticket[];
  selectedSeats: number[]; // В твоем типе Seat id: number, поэтому массив чисел
  onSeatClick: (seatId: number) => void;
  loading: boolean;
}

const HallPlanView: React.FC<HallPlanViewProps> = ({
  hallPlan,
  tickets,
  selectedSeats,
  onSeatClick,
  loading,
}) => {
  // В твоем типе Ticket seatId - это string, а в Seat id - number.
  // Нам нужно приведение типов для сравнения.
  const getTicketStatus = (seatId: number) => {
    const ticket = tickets.find((t) => t.seatId === String(seatId));
    return ticket ? ticket.status : "SOLD"; // Если билета нет, считаем что продано или недоступно
  };

  if (loading) return <p className="text-center">Загрузка плана зала...</p>;

  if (!hallPlan || !hallPlan.seats) {
    return null;
  }

  return (
    <div className="mt-4">
      <h5 className="text-light mb-3 text-center">Схема зала:</h5>
      <div
        className="d-flex flex-column align-items-center mb-4"
        style={{ gap: "10px" }}
      >
        {Array.from(new Set(hallPlan.seats.map((s) => s.row)))
          .sort((a, b) => a - b)
          .map((rowNum) => (
            <div key={rowNum} className="d-flex gap-2">
              <span className="text-secondary me-2">Ряд {rowNum}:</span>
              {hallPlan.seats
                .filter((s) => s.row === rowNum)
                .sort((a, b) => a.number - b.number)
                .map((seat) => {
                  const status = getTicketStatus(seat.id);
                  const isSelected = selectedSeats.includes(seat.id);

                  let btnClass = "btn-outline-light";
                  if (status === "SOLD" || status === "RESERVED")
                    btnClass = "btn-secondary disabled";
                  else if (isSelected) btnClass = "btn-success";

                  return (
                    <button
                      key={seat.id}
                      className={`btn ${btnClass}`}
                      style={{ width: "40px", height: "40px", padding: "0" }}
                      disabled={status !== "AVAILABLE"}
                      onClick={() => onSeatClick(seat.id)}
                      // В твоем типе Seat цена и категория лежат прямо внутри
                      title={`Место ${seat.number} (${seat.category}) — ${seat.price} ₽`}
                    >
                      {seat.number}
                    </button>
                  );
                })}
            </div>
          ))}
      </div>
    </div>
  );
};

export default HallPlanView;
