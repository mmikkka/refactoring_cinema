import React, { useEffect, useState } from "react";
import { httpClient } from "../api/http";
import type { BaseFormProps } from "../types/forms";

interface Category {
  id?: string;
  name: string;
  priceCents: number;
}

interface CategoriesManagementProps {
  token: string;
}

export default function CategoriesManagement({
  token,
}: CategoriesManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);

  const fetchCategories = async () => {
    if (!token) return;
    try {
      // Используем httpClient.get вместо fetch, раз мы его настроили
      const res = await httpClient.get("/seat-categories?page=0&size=20");
      setCategories(res.data.data || []);
    } catch (err) {
      console.error("Ошибка загрузки категорий:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const handleSave = async (cat: Category) => {
    if (!token) return;
    try {
      if (cat.id) {
        await httpClient.put(`/seat-categories/${cat.id}`, cat);
      } else {
        await httpClient.post("/seat-categories", cat);
      }
      await fetchCategories(); // Обязательно рефетч
      setEditing(null);
    } catch (err) {
      alert("Не удалось сохранить категорию");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm("Удалить эту категорию?")) return;
    try {
      await httpClient.delete(`/seat-categories/${id}`);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Не удалось удалить категорию");
    }
  };

  return (
    <div className="container mt-3">
      <h2 className="mb-3">🏷 Управление категориями мест</h2>

      <button
        className="btn btn-primary mb-3"
        onClick={() => setEditing({ name: "", priceCents: 0 })}
      >
        ➕ Добавить категорию
      </button>

      {editing && (
        <CategoryForm
          data={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <ul className="list-group">
        {categories.map((c) => (
          <li
            key={c.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <span>
              <strong>{c.name}</strong> — {c.priceCents}₽
            </span>
            <span>
              <button
                className="btn btn-sm btn-warning me-2"
                onClick={() => setEditing(c)}
              >
                ✏️ Редактировать
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(c.id!)}
              >
                🗑 Удалить
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Компонент формы теперь строго следует интерфейсу BaseFormProps
function CategoryForm({
  data: category,
  onSave,
  onCancel,
}: BaseFormProps<Category>) {
  const [form, setForm] = useState(category);

  useEffect(() => {
    setForm(category);
  }, [category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "priceCents" ? Number(value) : value,
    });
  };

  return (
    <div className="card p-3 mb-3 text-dark">
      <h5>{category.id ? "Редактирование категории" : "Новая категория"}</h5>

      <input
        className="form-control mb-2"
        name="name"
        placeholder="Название категории"
        value={form.name}
        onChange={handleChange}
      />

      <input
        className="form-control mb-3"
        name="priceCents"
        type="number"
        placeholder="Цена (₽)"
        value={form.priceCents}
        onChange={handleChange}
      />

      <div className="d-flex justify-content-end">
        <button className="btn btn-success me-2" onClick={() => onSave(form)}>
          💾 Сохранить
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          ✖ Отмена
        </button>
      </div>
    </div>
  );
}
