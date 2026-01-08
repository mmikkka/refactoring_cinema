import React, { useEffect, useState } from "react";
import { usePeriodicSessions, type Period } from "../hooks/usePeriodicSessions";
import { PeriodicSessionSettings } from "./PeriodicSessionSettings";
import { API_BASE_URL } from "../config";

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

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/films?page=0&size=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setMovies(data.data || []))
      .catch(console.error);

    fetch(`${API_BASE_URL}/halls`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setHalls(data.data || []))
      .catch(console.error);
  }, [token]);

  const fetchSessions = () => {
    if (!token) return;
    fetch(`${API_BASE_URL}/sessions?page=0&size=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSessions(data.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchSessions();
  }, [token]);

  const handleSave = async (session: Session) => {
    if (!token) return;

    try {
      const method = session.id ? "PUT" : "POST";
      const url = session.id
        ? `${API_BASE_URL}/sessions/${session.id}`
        : `${API_BASE_URL}/sessions`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filmId: session.filmId,
          hallId: session.hallId,
          startAt: session.startAt,
          periodicConfig: session.periodicConfig || null,
        }),
      });

      if (!res.ok) throw new Error("Ошибка при сохранении сеанса");

      await fetchSessions();
      setEditing(null);
    } catch (err) {
      console.error(err);
      alert("Не удалось сохранить сеанс");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm("Удалить этот сеанс?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Ошибка при удалении сеанса");
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert("Не удалось удалить сеанс");
    }
  };

  return (
    <div className="container-fluid">
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
          session={editing}
          movies={movies}
          halls={halls}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {sessions.length === 0 ? (
        <p>Сеансов пока нет.</p>
      ) : (
        <div className="row">
          {sessions.map((s) => (
            <div key={s.id} className="col-md-6 mb-3">
              <div className="card shadow-sm p-3 text-light">
                <strong>
                  {movies.find((m) => m.id === s.filmId)?.title || s.filmId}
                </strong>{" "}
                —{" "}
                <em>
                  {halls.find((h) => h.id === s.hallId)?.name || s.hallId}
                </em>
                <div>🕒 {new Date(s.startAt).toLocaleString()}</div>
                {s.periodicConfig && (
                  <div className="text-info small mt-1">
                    🔁{" "}
                    {s.periodicConfig.period === "EVERY_DAY"
                      ? "Ежедневно"
                      : "Еженедельно"}{" "}
                    до{" "}
                    {new Date(
                      s.periodicConfig.periodGenerationEndsAt
                    ).toLocaleDateString("ru-RU")}
                  </div>
                )}
                <div className="mt-2 d-flex justify-content-between">
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
      )}
    </div>
  );
}

interface SessionFormProps {
  session: Session;
  movies: Movie[];
  halls: Hall[];
  onSave: (session: Session) => void;
  onCancel: () => void;
}

function SessionForm({ session, onSave, onCancel }: SessionFormProps) {
  const [form, setForm] = useState(session);
  const [isPeriodic, setIsPeriodic] = useState(false);
  const [period, setPeriod] = useState<Period>("EVERY_DAY");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

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
        ? {
            period,
            periodGenerationEndsAt: periodEnd!,
          }
        : null,
    });
  };

  return (
    <div className="card p-3 mb-4 shadow-sm">
      <h5 className="mb-3 text-primary">
        {session.id ? "Редактирование сеанса" : "Новый сеанс"}
      </h5>
      <select
        name="filmId"
        value={form.filmId}
        onChange={handleChange}
        className="form-control mb-2"
      />

      <label className="text-light ">Дата и время начала:</label>
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

      <div className="d-flex justify-content-end mt-3">
        <button className="btn btn-success me-2" onClick={handleSubmit}>
          Сохранить
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
