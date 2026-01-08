import React, { useEffect, useState } from "react";
import { usePeriodicSessions, type Period } from "../hooks/usePeriodicSessions";
import { PeriodicSessionSettings } from "./PeriodicSessionSettings";
import { httpClient } from "../api/http";
import type { BaseFormProps } from "../types/forms";

interface Movie {
  id: string;
  title: string;
}

interface Hall {
  id: string;
  name: string;
}

interface Session {
  id: string;
  filmId: string;
  hallId: string;
  startAt: string;
  periodicConfig?: {
    period: "EVERY_DAY" | "EVERY_WEEK";
    periodGenerationEndsAt: string;
  } | null;
}

interface SessionsManagementProps {
  token: string;
}

export default function SessionsManagement({ token }: SessionsManagementProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editing, setEditing] = useState<Session | null>(null);

  const fetchInitialData = async () => {
    try {
      const [filmsRes, hallsRes] = await Promise.all([
        httpClient.get("/films?page=0&size=50"),
        httpClient.get("/halls"),
      ]);
      setMovies(filmsRes.data.data || []);
      setHalls(hallsRes.data.data || []);
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await httpClient.get("/sessions?page=0&size=50");
      setSessions(res.data.data || []);
    } catch (err) {
      console.error("Ошибка загрузки сеансов:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInitialData();
      fetchSessions();
    }
  }, [token]);

  const handleSave = async (session: Session) => {
    try {
      if (session.id) {
        await httpClient.put(`/sessions/${session.id}`, session);
      } else {
        await httpClient.post("/sessions", session);
      }
      await fetchSessions();
      setEditing(null);
    } catch (err) {
      console.error(err);
      alert("Не удалось сохранить сеанс");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Удалить этот сеанс?")) return;
    try {
      await httpClient.delete(`/sessions/${id}`);
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container-fluid mt-3">
      <h2 className="text-primary mb-4">🎬 Управление сеансами</h2>

      <button
        className="btn btn-success mb-3"
        onClick={() =>
          setEditing({
            id: "",
            filmId: movies[0]?.id || "",
            hallId: halls[0]?.id || "",
            startAt: new Date().toISOString().slice(0, 16),
            periodicConfig: null,
          })
        }
      >
        ➕ Добавить сеанс
      </button>

      {editing && (
        <SessionForm
          data={editing}
          metadata={{ movies, halls }}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="row">
        {sessions.map((s) => (
          <div key={s.id} className="col-md-6 mb-3">
            <div className="card shadow-sm p-3 bg-secondary text-light">
              <strong>
                {movies.find((m) => m.id === s.filmId)?.title || "Загрузка..."}
              </strong>
              <span className="mx-2">—</span>
              <em>
                {halls.find((h) => h.id === s.hallId)?.name || "Загрузка..."}
              </em>
              <div className="mt-2">
                🕒 {new Date(s.startAt).toLocaleString()}
              </div>
              <div className="mt-3 d-flex gap-2">
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => setEditing(s)}
                >
                  ✏ Редактировать
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(s.id)}
                >
                  🗑 Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionForm({
  data: session,
  onSave,
  onCancel,
  metadata,
}: BaseFormProps<Session>) {
  const { movies, halls } = (metadata || {}) as {
    movies: Movie[];
    halls: Hall[];
  };

  const [form, setForm] = useState(session);

  // Состояния для периодичности
  const [isPeriodic, setIsPeriodic] = useState(!!session.periodicConfig);
  const [period, setPeriod] = useState<Period>(
    session.periodicConfig?.period || "EVERY_DAY"
  );
  const [periodEnd, setPeriodEnd] = useState<string | null>(
    session.periodicConfig?.periodGenerationEndsAt || null
  );

  const { sessionCount } = usePeriodicSessions({
    startAt: form.startAt,
    period,
    periodEnd,
    isPeriodic,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (isPeriodic && !periodEnd) {
      alert("Выберите дату окончания периода");
      return;
    }
    onSave({
      ...form,
      periodicConfig: isPeriodic
        ? { period, periodGenerationEndsAt: periodEnd! }
        : null,
    });
  };

  return (
    <div className="card p-4 mb-4 shadow text-dark">
      <h5 className="mb-3 text-primary">
        {session.id ? "Редактирование" : "Новый сеанс"}
      </h5>

      <label className="small fw-bold">Фильм:</label>
      <select
        name="filmId"
        value={form.filmId}
        onChange={handleChange}
        className="form-select mb-2"
      >
        {movies.map((m: Movie) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>

      <label className="small fw-bold">Зал:</label>
      <select
        name="hallId"
        value={form.hallId}
        onChange={handleChange}
        className="form-select mb-2"
      >
        {halls.map((h: Hall) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>

      <label className="small fw-bold">Дата и время начала:</label>
      <input
        className="form-control mb-3"
        type="datetime-local"
        name="startAt"
        value={form.startAt}
        onChange={handleChange}
      />

      <PeriodicSessionSettings
        isPeriodic={isPeriodic}
        onTogglePeriodic={setIsPeriodic}
        period={period}
        onChangePeriod={setPeriod}
        periodEnd={periodEnd}
        onChangePeriodEnd={setPeriodEnd}
        sessionCount={sessionCount}
      />

      <div className="d-flex justify-content-end mt-3 gap-2">
        <button className="btn btn-success" onClick={handleSubmit}>
          💾 Сохранить
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
