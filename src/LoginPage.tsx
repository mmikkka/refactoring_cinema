import { useNavigate } from "react-router-dom";
import { loginUser } from "./api/auth";
import AuthForm from "./components/AuthForm";

interface Props {
  onLogin: (token: { accessToken: string }) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const navigate = useNavigate();

  const handleLogin = async (values: any) => {
    const token = await loginUser(values);
    onLogin(token);
    navigate("/profile");
  };

  return (
    <AuthForm
      title="Вход"
      initialValues={{ email: "", password: "" }}
      buttonText="Войти"
      buttonClass="btn-primary"
      onSubmit={handleLogin}
    />
  );
}
