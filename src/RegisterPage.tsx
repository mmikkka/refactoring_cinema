import { useNavigate } from "react-router-dom";
import { registerUser } from "./api/auth";
import AuthForm from "./components/AuthForm";

interface Props {
  onRegister: (token: { accessToken: string }) => void;
}

export default function RegisterPage({ onRegister }: Props) {
  const navigate = useNavigate();

  const handleRegister = async (values: any) => {
    const token = await registerUser(values);
    onRegister(token);
    navigate("/");
  };

  return (
    <AuthForm
      title="Регистрация"
      initialValues={{
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        age: 21,
        gender: "MALE",
      }}
      buttonText="Зарегистрироваться"
      buttonClass="btn-success"
      onSubmit={handleRegister}
      renderExtraFields={(form, handleChange) => (
        <>
          <input
            name="firstName"
            placeholder="Имя"
            className="form-control"
            onChange={handleChange}
          />
          <input
            name="lastName"
            placeholder="Фамилия"
            className="form-control"
            onChange={handleChange}
          />
          <input
            name="age"
            type="number"
            placeholder="Возраст"
            className="form-control"
            value={form.age}
            onChange={handleChange}
          />
          <select
            name="gender"
            className="form-select"
            value={form.gender}
            onChange={handleChange}
          >
            <option value="MALE">Мужской</option>
            <option value="FEMALE">Женский</option>
          </select>
        </>
      )}
    />
  );
}
