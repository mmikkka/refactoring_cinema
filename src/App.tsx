import { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getCurrentUser, logout } from "./api/auth";
import { AppRoutes } from "./components/AppRoutes"; 
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

  
  const handleLogout = useCallback(() => {
    logout();
    setAccessToken(null);
    setUserRole(null);
  }, []);
  
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
  }, [handleLogout]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser?.accessToken) return;

    try {
      const decoded = jwtDecode<TokenPayload>(currentUser.accessToken);
      
      if (decoded.exp * 1000 < Date.now()) {
        handleLogout();
        return;
      }

      handleAuthSuccess({ accessToken: currentUser.accessToken });
    } catch (e) {
      handleLogout();
    }
  }, [handleAuthSuccess, handleLogout]);

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
