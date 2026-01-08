import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES, UserRole, type UserRoleType } from "../constants";

interface AccessControlProps {
  token: string | null;
  userRole: UserRoleType | null;
  allowedRole?: UserRoleType;
  type: "protected" | "public-only";
}

export default function AccessControlRoute({
  token,
  userRole,
  allowedRole,
  type,
}: AccessControlProps) {
  const location = useLocation();

  // 1. Публичные маршруты (только для неавторизованных: Login, Register)
  if (type === "public-only" && token) {
    const destination =
      userRole === UserRole.ADMIN ? ROUTES.ADMIN : ROUTES.PROFILE;
    return <Navigate to={destination} replace />;
  }

  // 2. Защищенные маршруты (требуют авторизации)
  if (type === "protected") {
    if (!token) {
      // Сохраняем текущий путь, чтобы вернуть пользователя после логина
      return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    if (allowedRole && userRole !== allowedRole) {
      return <Navigate to={ROUTES.HOME} replace />;
    }
  }

  return <Outlet />;
}
