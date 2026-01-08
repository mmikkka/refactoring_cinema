import React from "react";
import type { Film } from "../types/movie";

interface MovieDisplayProps {
  movie: Film;
  variant: "card" | "detailed";
  actionButton?: React.ReactNode;
}

export default function MovieDisplay({
  movie,
  variant,
  actionButton,
}: MovieDisplayProps) {
  const isCard = variant === "card";

  return (
    <div
      className={`card ${
        isCard ? "h-100 shadow-sm" : "border-0 bg-transparent text-light"
      }`}
    >
      <div className="row g-0">
        <div className={isCard ? "col-12" : "col-md-4"}>
          <img
            src={movie.imageUrl || "https://placehold.co/300x450"}
            className={isCard ? "card-img-top" : "img-fluid rounded shadow"}
            alt={movie.title}
            style={
              isCard
                ? { height: "300px", objectFit: "cover" }
                : { maxHeight: "600px" }
            }
          />
        </div>
        <div className={isCard ? "col-12" : "col-md-8"}>
          <div className={isCard ? "card-body" : "ps-md-4 py-2"}>
            <h2
              className={
                isCard ? "h5 card-title text-primary" : "display-4 text-primary"
              }
            >
              {movie.title}
            </h2>

            <p className="card-text text-secondary">
              {isCard && movie.description.length > 100
                ? `${movie.description.slice(0, 100)}...`
                : movie.description}
            </p>

            <div className="mb-3">
              <span className="badge bg-info me-2">
                {movie.genre || "Кино"}
              </span>
              <span className="badge bg-secondary me-2">
                {movie.duration} мин
              </span>
              <span className="badge bg-warning text-dark">
                {movie.ageRating || "0+"}
              </span>
            </div>

            <div className="mt-auto">{actionButton}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
