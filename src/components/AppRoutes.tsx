import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES, UserRole, type UserRoleType } from "../constants";

// Страницы
import HomePage from "../HomePage";
import LoginPage from "../LoginPage";
import RegisterPage from "../RegisterPage";
import UserProfilePage from "../UserProfilePage";
import AdminDashboard from "../AdminDashboard/AdminDashboard";
import MovieDetailsWrapper from "./MovieDetailsWrapper";

// Наш новый унифицированный компонент
import AccessControlRoute from "./AccessControlRoute";

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
      {/* 1. Технические и полностью открытые маршруты */}
      <Route
        path={ROUTES.ROOT}
        element={<Navigate to={ROUTES.HOME} replace />}
      />
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.FILM_DETAILS} element={<MovieDetailsWrapper />} />

      {/* 2. Гостевые маршруты (только для тех, кто НЕ вошел) */}
      <Route
        element={
          <AccessControlRoute
            type="public-only"
            token={token}
            userRole={userRole}
          />
        }
      >
        <Route
          path={ROUTES.LOGIN}
          element={<LoginPage onLogin={onAuthSuccess} />}
        />
        <Route
          path={ROUTES.REGISTER}
          element={<RegisterPage onRegister={onAuthSuccess} />}
        />
      </Route>

      {/* 3. Защищенные маршруты для обычных пользователей */}
      <Route
        element={
          <AccessControlRoute
            type="protected"
            token={token}
            userRole={userRole}
            allowedRole={UserRole.USER}
          />
        }
      >
        <Route
          path={ROUTES.PROFILE}
          element={<UserProfilePage token={token!} />}
        />
      </Route>

      {/* 4. Защищенные маршруты для админов */}
      <Route
        element={
          <AccessControlRoute
            type="protected"
            token={token}
            userRole={userRole}
            allowedRole={UserRole.ADMIN}
          />
        }
      >
        <Route
          path={ROUTES.ADMIN}
          element={<AdminDashboard onBack={onLogout} />}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
    </Routes>
  );
};
