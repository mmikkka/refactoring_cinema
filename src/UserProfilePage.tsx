import React, { useEffect, useState } from "react";
import * as userApi from "./api/user";
import { httpClient } from "./api/http";

interface PurchaseResponse {
  id: string;
  clientId: string;
  ticketIds: string[];
  totalCents: number;
  status: string;
  createdAt: string;
  filmId: string;
  seats: { row: number; number: number; priceCents: number }[];
}

interface ReviewForm {
  rating: number;
  text: string;
}

// 1. Добавили token в пропсы
interface UserProfileProps {
  token: string;
  mode?: "full" | "compact";
  onBack?: () => void;
}

export default function UserProfilePage({ onBack }: UserProfileProps) {
  const [user, setUser] = useState<userApi.User | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "FEMALE",
    age: 21,
  });
  const [editing, setEditing] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseResponse[]>([]);
  const [filmTitles, setFilmTitles] = useState<Record<string, string>>({});
  const [reviewForms, setReviewForms] = useState<Record<string, ReviewForm>>(
    {}
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Выполняем базовые запросы параллельно
        const [userRes, purchasesRes, filmsRes] = await Promise.all([
          httpClient.get("/users/me"),
          httpClient.get("/purchases", { params: { page: 0, size: 20 } }),
          httpClient.get("/films"), // Оптимизация: берем все фильмы сразу
        ]);

        const currentUser = userRes.data;
        setUser(currentUser);
        setForm({
          firstName: currentUser.firstName || "",
          lastName: currentUser.lastName || "",
          email: currentUser.email || "",
          gender: currentUser.gender || "FEMALE",
          age: currentUser.age || 21,
        });

        const mappedPurchases = purchasesRes.data.data || [];
        setPurchases(mappedPurchases);

        // Создаем карту названий фильмов из общего списка (убирает N+1 запросов)
        const allFilms = filmsRes.data.data || [];
        const titlesMap: Record<string, string> = {};
        allFilms.forEach((f: any) => {
          titlesMap[f.id] = f.title;
        });
        setFilmTitles(titlesMap);
      } catch (err) {
        console.error("Data loading error:", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "age" ? Number(value) : value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const res = await httpClient.put("/users/me", form);
      setUser(res.data);
      setEditing(false);
      alert("Профиль обновлен!");
    } catch (err) {
      alert("Ошибка обновления профиля");
    }
  };

  const handleReviewChange = (
    filmId: string,
    field: keyof ReviewForm,
    value: string | number
  ) => {
    setReviewForms((prev) => ({
      ...prev,
      [filmId]: {
        ...(prev[filmId] || { rating: 0, text: "" }),
        [field]: value,
      },
    }));
  };

  const handleSubmitReview = async (filmId: string) => {
    const review = reviewForms[filmId];
    if (!review?.rating || !review?.text)
      return alert("Заполните рейтинг и текст отзыва");
    try {
      await httpClient.post(`/films/${filmId}/reviews`, review);
      alert("Отзыв отправлен!");
      setReviewForms((prev) => ({
        ...prev,
        [filmId]: { rating: 0, text: "" },
      }));
    } catch (err) {
      alert("Не удалось отправить отзыв");
    }
  };

  if (!user)
    return <div className="text-center mt-5 text-light">Загрузка...</div>;

  return (
    <div className="container py-4 text-light">
      <div className="card bg-dark border-secondary mb-4 shadow">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0">Мой профиль</h2>
            {onBack && (
              <button className="btn btn-outline-light btn-sm" onClick={onBack}>
                Назад
              </button>
            )}
          </div>

          {editing ? (
            <div className="row g-2">
              <div className="col-md-6">
                <input
                  className="form-control mb-2"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Имя"
                />
              </div>
              <div className="col-md-6">
                <input
                  className="form-control mb-2"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Фамилия"
                />
              </div>
              <input
                className="form-control mb-2"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
              />
              <select
                className="form-select mb-2"
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="FEMALE">Женский</option>
                <option value="MALE">Мужской</option>
              </select>
              <input
                className="form-control mb-3"
                name="age"
                type="number"
                value={form.age}
                onChange={handleChange}
                placeholder="Возраст"
              />
              <div>
                <button
                  className="btn btn-success me-2"
                  onClick={handleSaveProfile}
                >
                  💾 Сохранить
                </button>
                <button
                  className="btn btn-light"
                  onClick={() => setEditing(false)}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p>
                <strong>Имя:</strong> {user.firstName} {user.lastName}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Пол:</strong>{" "}
                {user.gender === "FEMALE" ? "Женский" : "Мужской"}
              </p>
              <p>
                <strong>Возраст:</strong> {user.age}
              </p>
              <button
                className="btn btn-warning"
                onClick={() => setEditing(true)}
              >
                ✏️ Редактировать
              </button>
            </div>
          )}
        </div>
      </div>

      <h3>История покупок</h3>
      <div className="row">
        {purchases.length === 0 && (
          <p className="text-secondary">У вас пока нет покупок</p>
        )}
        {purchases.map((p) => (
          <div key={p.id} className="col-12 mb-3">
            <div className="card bg-dark text-white border-secondary">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <h5 className="text-info">
                    {filmTitles[p.filmId] || "Загрузка фильма..."}
                  </h5>
                  <span className="badge bg-success">{p.status}</span>
                </div>
                <p className="mb-2">Сумма: {p.totalCents / 100}₽</p>

                <div className="mt-2 p-3 bg-secondary bg-opacity-25 rounded border border-secondary">
                  <h6 className="small mb-2 text-warning">Оставить отзыв:</h6>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-control form-control-sm mb-2"
                    placeholder="Рейтинг 1-5"
                    value={reviewForms[p.filmId]?.rating || ""}
                    onChange={(e) =>
                      handleReviewChange(
                        p.filmId,
                        "rating",
                        Number(e.target.value)
                      )
                    }
                  />
                  <textarea
                    className="form-control form-control-sm mb-2"
                    placeholder="Ваш отзыв"
                    rows={2}
                    value={reviewForms[p.filmId]?.text || ""}
                    onChange={(e) =>
                      handleReviewChange(p.filmId, "text", e.target.value)
                    }
                  />
                  <button
                    className="btn btn-primary btn-sm w-100"
                    onClick={() => handleSubmitReview(p.filmId)}
                  >
                    Отправить отзыв
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
