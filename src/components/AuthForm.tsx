import React, { useState } from "react";

interface AuthFormProps<T> {
  title: string;
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  buttonText: string;
  buttonClass: string;
  renderExtraFields?: (
    values: T,
    handleChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => void
  ) => React.ReactNode;
}

export default function AuthForm<T extends Record<string, any>>({
  title,
  initialValues,
  onSubmit,
  buttonText,
  buttonClass,
  renderExtraFields,
}: AuthFormProps<T>) {
  const [form, setForm] = useState<T>(initialValues);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError("Произошла ошибка. Проверьте данные.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100">
      <form
        onSubmit={handleSubmit}
        className="d-flex flex-column gap-3 w-100"
        style={{ maxWidth: "400px" }}
      >
        <h2 className="text-center mb-3">{title}</h2>

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="form-control"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          className="form-control"
          value={form.password}
          onChange={handleChange}
          required
        />

        {renderExtraFields && renderExtraFields(form, handleChange)}

        {error && <p className="text-danger small">{error}</p>}

        <button
          type="submit"
          className={`btn ${buttonClass}`}
          disabled={loading}
        >
          {loading ? "Загрузка..." : buttonText}
        </button>
      </form>
    </div>
  );
}
