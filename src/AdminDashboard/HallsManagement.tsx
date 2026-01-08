import React, { useEffect, useState } from "react";
import { httpClient } from "../api/http";
import type { BaseFormProps } from "../types/forms";

interface Hall {
  id?: string;
  name: string;
  description?: string;
}

export default function HallsManagement() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [editing, setEditing] = useState<Hall | null>(null);

  const fetchHalls = async () => {
    try {
      const res = await httpClient.get("/halls");
      setHalls(res.data.data || res.data || []);
    } catch (err) {
      console.error("Ошибка загрузки залов:", err);
    }
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  const handleSave = async (hall: Hall) => {
    try {
      if (hall.id) {
        await httpClient.put(`/halls/${hall.id}`, hall);
      } else {
        await httpClient.post("/halls", hall);
      }
      await fetchHalls();
      setEditing(null);
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Удалить этот зал?")) return;
    try {
      await httpClient.delete(`/halls/${id}`);
      setHalls(halls.filter((h) => h.id !== id));
    } catch (err) {
      console.error(err);
      alert("Не удалось удалить зал");
    }
  };

  return (
    <div className="container mt-3 text-light">
      <h2 className="mb-3">🏛 Управление залами</h2>

      <button
        className="btn btn-primary mb-3"
        onClick={() => setEditing({ name: "", description: "" })}
      >
        ➕ Добавить зал
      </button>

      {editing && (
        <HallForm
          data={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <ul className="list-group">
        {halls.map((h) => (
          <li
            key={h.id}
            className="list-group-item bg-dark text-light border-secondary d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{h.name}</strong>
              {h.description && (
                <div className="small text-secondary">{h.description}</div>
              )}
            </div>
            <span>
              <button
                className="btn btn-sm btn-warning me-2"
                onClick={() => setEditing(h)}
              >
                ✏️
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(h.id!)}
              >
                🗑
              </button>
            </span>
          </li>
        ))}
        {halls.length === 0 && (
          <li className="list-group-item bg-transparent text-secondary">
            Залы не найдены
          </li>
        )}
      </ul>
    </div>
  );
}

function HallForm({ data: hall, onSave, onCancel }: BaseFormProps<Hall>) {
  const [form, setForm] = useState(hall);

  // Синхронизируем состояние формы, если data изменилась извне
  useEffect(() => {
    setForm(hall);
  }, [hall]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card p-3 mb-3 text-dark shadow">
      <h5>{hall.id ? "Редактирование зала" : "Новый зал"}</h5>

      <div className="mb-2">
        <label className="form-label small fw-bold">Название:</label>
        <input
          className="form-control"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Например: Синий зал"
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-bold">
          Описание (необязательно):
        </label>
        <textarea
          className="form-control"
          name="description"
          value={form.description || ""}
          onChange={handleChange}
          placeholder="Особенности зала..."
        />
      </div>

      <div className="d-flex gap-2 justify-content-end">
        <button className="btn btn-success" onClick={() => onSave(form)}>
          💾 Сохранить
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
