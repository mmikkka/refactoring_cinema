import { Navigate } from "react-router-dom";
import { ROUTES, type UserRoleType } from "../constants";
import type { JSX } from "react";

interface ProtectedRouteProps {
  children: JSX.Element;
  token: string | null;
  userRole: string | null;
  requiredRole?: UserRoleType;
}

export const ProtectedRoute = ({
  children,
  token,
  userRole,
  requiredRole,
}: ProtectedRouteProps) => {
  // Если нет токена — на логин
  if (!token) return <Navigate to={ROUTES.LOGIN} replace />;

  // Если роль не совпадает — на главную (или в профиль)
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
};
