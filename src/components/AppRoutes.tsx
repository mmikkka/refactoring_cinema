import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES, UserRole, type UserRoleType } from "../constants";

// Страницы
import HomePage from "../HomePage";
import LoginPage from "../LoginPage";
import RegisterPage from "../RegisterPage";
import UserProfilePage from "../UserProfilePage";
import AdminDashboard from "../AdminDashboard/AdminDashboard";
import MovieDetailsWrapper from "./MovieDetailsWrapper"; // Мы уже вынесли его

// Обертки защиты
import { PublicRoute } from "./PublicRoute";
import { ProtectedRoute } from "./ProtectedRoute";

interface AppRoutesProps {
  token: string | null;
  userRole: UserRoleType | null;
  onAuthSuccess: (data: { accessToken: string }) => void;
  onLogout: () => void;
}

export const AppRoutes = ({
  token,
  userRole,
  onAuthSuccess,
  onLogout,
}: AppRoutesProps) => {
  return (
    <Routes>
      <Route
        path={ROUTES.ROOT}
        element={<Navigate to={ROUTES.HOME} replace />}
      />

      {/* --- Публичные маршруты (доступны всем) --- */}
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.FILM_DETAILS} element={<MovieDetailsWrapper />} />

      {/* --- Гостевые маршруты (только для неавторизованных) --- */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute token={token} userRole={userRole}>
            <LoginPage onLogin={onAuthSuccess} />
          </PublicRoute>
        }
      />

      <Route
        path={ROUTES.REGISTER}
        element={
          <PublicRoute token={token} userRole={userRole}>
            <RegisterPage onRegister={onAuthSuccess} />
          </PublicRoute>
        }
      />

      {/* --- Защищенные маршруты (USER) --- */}
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute
            token={token}
            userRole={userRole}
            requiredRole={UserRole.USER}
          >
            <UserProfilePage token={token!} />
          </ProtectedRoute>
        }
      />

      {/* --- Защищенные маршруты (ADMIN) --- */}
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute
            token={token}
            userRole={userRole}
            requiredRole={UserRole.ADMIN}
          >
            <AdminDashboard onBack={onLogout} />
          </ProtectedRoute>
        }
      />

      {/* --- Fallback для неизвестных путей --- */}
      <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
    </Routes>
  );
};
