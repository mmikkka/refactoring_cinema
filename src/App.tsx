import { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getCurrentUser, logout } from "./api/auth";
import { AppRoutes } from "./components/AppRoutes"; // Импортируем новый роутер
import Header from "./Header";
import { type UserRoleType } from "./constants";

interface TokenPayload {
  sub: string;
  role: UserRoleType;
  exp: number;
  iat: number;
}

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);

  /**
   * Единая функция для обновления стейта авторизации.
   * Вызывается при логине, регистрации и восстановлении сессии.
   */
  const handleAuthSuccess = useCallback((data: { accessToken: string }) => {
    try {
      const decoded = jwtDecode<TokenPayload>(data.accessToken);
      setAccessToken(data.accessToken);
      setUserRole(decoded.role);
    } catch (error) {
      console.error("Token decoding failed:", error);
      handleLogout();
    }
  }, []);

  const handleLogout = () => {
    logout();
    setAccessToken(null);
    setUserRole(null);
  };

  // Восстановление сессии при загрузке
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser?.accessToken) {
      handleAuthSuccess({ accessToken: currentUser.accessToken });
    }
  }, [handleAuthSuccess]);

  return (
    <Router>
      <div className="app-container min-vh-100 d-flex flex-column bg-dark text-light">
        <Header token={accessToken} onLogout={handleLogout} />

        <main className="flex-grow-1">
          <AppRoutes
            token={accessToken}
            userRole={userRole}
            onAuthSuccess={handleAuthSuccess}
            onLogout={handleLogout}
          />
        </main>
      </div>
    </Router>
  );
}
