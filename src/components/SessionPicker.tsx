import React from "react";
import type { Session } from "../types/movie";

interface SessionPickerProps {
  sessions: Session[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedSessionId?: number;
  onSessionSelect: (session: Session) => void;
  loading: boolean;
}

const SessionPicker: React.FC<SessionPickerProps> = ({
  sessions,
  selectedDate,
  onDateChange,
  selectedSessionId,
  onSessionSelect,
  loading,
}) => {
  // Фильтруем по полю date, которое есть в твоем типе Session
  const filteredSessions = sessions.filter((s) => s.date === selectedDate);

  return (
    <div className="mb-3">
      <label className="text-light me-2">Выберите дату:</label>
      <input
        type="date"
        className="form-control d-inline-block"
        style={{ width: "200px" }}
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
      />

      <h5 className="mt-4 text-light">Доступные сеансы:</h5>
      <div className="d-flex flex-wrap gap-2 mt-2">
        {loading && <p>Загрузка сеансов...</p>}
        {!loading && filteredSessions.length === 0 && (
          <p>Сеансов на эту дату нет</p>
        )}
        {!loading &&
          filteredSessions.map((session) => (
            <button
              key={session.id}
              className={`btn btn-primary btn-lg ${
                selectedSessionId === session.id ? "active border-light" : ""
              }`}
              onClick={() => onSessionSelect(session)}
            >
              {/* Используем session.time из твоих типов */}
              {session.time} - Зал {session.hallId}
            </button>
          ))}
      </div>
    </div>
  );
};

export default SessionPicker;
