import { Navigate } from "react-router-dom";
import { ROUTES, UserRole, type UserRoleType } from "../constants";
import type { JSX } from "react";

interface PublicRouteProps {
  children: JSX.Element;
  token: string | null;
  userRole: UserRoleType | null;
}

export const PublicRoute = ({
  children,
  token,
  userRole,
}: PublicRouteProps) => {
  if (token) {
    // Если уже залогинен — отправляем по назначению в зависимости от роли
    const destination =
      userRole === UserRole.ADMIN ? ROUTES.ADMIN : ROUTES.PROFILE;
    return <Navigate to={destination} replace />;
  }

  return children;
};
