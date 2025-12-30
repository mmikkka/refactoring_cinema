import { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";

import Header from "./Header";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import UserProfilePage from "./UserProfilePage";
import MovieDetailsPage from "./MovieDetailsPage";
import AdminDashboard from "./AdminDashboard/AdminDashboard";

import { getCurrentUser, logout } from "./api/auth";
import * as movie from "./api/movie";
import { jwtDecode } from "jwt-decode";
import { ROUTES, UserRole, type UserRoleType } from "./constants";

// Типизация данных, хранящихся в JWT токене
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
   * Метод для установки данных авторизации.
   * Декодирует токен и сохраняет роль пользователя в состояние.
   */
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

  // Восстановление сессии пользователя при загрузке страницы
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

            {/* Авторизация и Регистрация: редирект, если пользователь уже вошел */}
            <Route
              path={ROUTES.LOGIN}
              element={
                accessToken ? (
                  <Navigate
                    to={
                      userRole === UserRole.ADMIN
                        ? ROUTES.ADMIN
                        : ROUTES.PROFILE
                    }
                  />
                ) : (
                  <LoginPage
                    onLogin={(data: { accessToken: string }) =>
                      authenticate(data.accessToken)
                    }
                  />
                )
              }
            />

            <Route
              path={ROUTES.REGISTER}
              element={
                accessToken ? (
                  <Navigate
                    to={
                      userRole === UserRole.ADMIN
                        ? ROUTES.ADMIN
                        : ROUTES.PROFILE
                    }
                  />
                ) : (
                  <RegisterPage
                    onRegister={(data: { accessToken: string }) =>
                      authenticate(data.accessToken)
                    }
                  />
                )
              }
            />

            {/* Личный кабинет пользователя (доступ только для USER) */}
            <Route
              path={ROUTES.PROFILE}
              element={
                accessToken && userRole === UserRole.USER ? (
                  <UserProfilePage token={accessToken} />
                ) : (
                  <Navigate to={ROUTES.LOGIN} />
                )
              }
            />

            {/* Панель администратора (доступ только для ADMIN) */}
            <Route
              path={ROUTES.ADMIN}
              element={
                accessToken && userRole === UserRole.ADMIN ? (
                  <AdminDashboard onBack={handleLogout} />
                ) : (
                  <Navigate to={ROUTES.LOGIN} />
                )
              }
            />

            <Route path={ROUTES.HOME} element={<HomePage />} />
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

/**
 * Обертка для страницы деталей фильма.
 * Отвечает за загрузку данных о конкретном фильме по ID из URL.
 */
function MovieDetailsWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [film, setFilm] = useState<movie.Film | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    movie
      .getFilmById(id)
      .then(setFilm)
      .catch((err) => {
        console.error(err);
        setError("Не удалось загрузить данные фильма");
      });
  }, [id]);

  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;
  if (!film) return <div className="text-center mt-5">Загрузка...</div>;

  const handleSelectSession = (sessionId: number) => {
    navigate(`/sessions/${sessionId}`, {
      state: { from: "movie_details", timestamp: new Date().toISOString() },
    });
  };

  return <MovieDetailsPage film={film} onSelectSession={handleSelectSession} />;
}
