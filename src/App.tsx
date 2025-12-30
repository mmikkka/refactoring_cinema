import { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Header from "./Header";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import UserProfilePage from "./UserProfilePage";
import AdminDashboard from "./AdminDashboard/AdminDashboard";
import MovieDetailsWrapper from "./components/MovieDetailsWrapper";
import { ProtectedRoute } from "./components/ProtectedRoute"; // Импорт
import { PublicRoute } from "./components/PublicRoute"; // Импорт

import { getCurrentUser, logout } from "./api/auth";
import { jwtDecode } from "jwt-decode";
import { ROUTES, UserRole, type UserRoleType } from "./constants";

interface TokenPayload {
  sub: string;
  role: UserRoleType;
  exp: number;
  iat: number;
}

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);

  const authenticate = useCallback((token: string) => {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      setAccessToken(token);
      setUserRole(decoded.role);
    } catch (error) {
      console.error("Ошибка при декодировании токена:", error);
      handleLogout();
    }
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser?.accessToken) {
      authenticate(currentUser.accessToken);
    }
  }, [authenticate]);

  const handleLogout = () => {
    logout();
    setAccessToken(null);
    setUserRole(null);
  };

  return (
    <Router>
      <div className="app-container min-vh-100 d-flex flex-column bg-dark text-light">
        <Header token={accessToken} onLogout={handleLogout} />

        <main className="flex-grow-1">
          <Routes>
            <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.HOME} />} />
            <Route path={ROUTES.HOME} element={<HomePage />} />

            {/* Публичные роуты с логикой PublicRoute */}
            <Route
              path={ROUTES.LOGIN}
              element={
                <PublicRoute token={accessToken} userRole={userRole}>
                  <LoginPage
                    onLogin={(data) => authenticate(data.accessToken)}
                  />
                </PublicRoute>
              }
            />

            <Route
              path={ROUTES.REGISTER}
              element={
                <PublicRoute token={accessToken} userRole={userRole}>
                  <RegisterPage
                    onRegister={(data) => authenticate(data.accessToken)}
                  />
                </PublicRoute>
              }
            />

            {/* Защищенные роуты с логикой ProtectedRoute */}
            <Route
              path={ROUTES.PROFILE}
              element={
                <ProtectedRoute
                  token={accessToken}
                  userRole={userRole}
                  requiredRole={UserRole.USER}
                >
                  <UserProfilePage token={accessToken!} />
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.ADMIN}
              element={
                <ProtectedRoute
                  token={accessToken}
                  userRole={userRole}
                  requiredRole={UserRole.ADMIN}
                >
                  <AdminDashboard onBack={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.FILM_DETAILS}
              element={<MovieDetailsWrapper />}
            />
            <Route path={ROUTES.ANY} element={<Navigate to={ROUTES.ROOT} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
