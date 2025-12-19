import { useEffect, useState } from "react";
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

type UserRole = "ADMIN" | "USER";

interface TokenPayload {
  sub: string;
  role: UserRole;
  exp: number;
  iat: number;
}

interface AuthData {
  accessToken: string;
}

// Главный компонент приложения
export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userInfo, setUserInfo] = useState<TokenPayload | null>(null);

  // При монтировании пытаемся восстановить текущего пользователя
  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser?.accessToken) {
      setAccessToken(currentUser.accessToken);

      try {
        const decoded = jwtDecode<TokenPayload>(currentUser.accessToken);
        setUserRole(decoded.role);
        setUserInfo(decoded);
      } catch (error) {
        setUserRole(null);
        setUserInfo(null);
        console.error("Token decoding failed:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    setAccessToken(null);
    setUserRole(null);
    setUserInfo(null);
  };

  const handleAuthSuccess = (authData: AuthData) => {
    setAccessToken(authData.accessToken);

    try {
      const decoded = jwtDecode<TokenPayload>(authData.accessToken);
      setUserRole(decoded.role);
      setUserInfo(decoded);
    } catch {
      setUserRole(null);
      setUserInfo(null);
    }
  };

  return (
    <Router>
      <div className="app-container min-vh-100 d-flex flex-column bg-dark text-light">
        <Header token={accessToken} onLogout={handleLogout} />
        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />

            <Route
              path="/login"
              element={
                accessToken ? (
                  userRole === "ADMIN" ? (
                    <Navigate to="/admin" />
                  ) : (
                    <Navigate to="/profile" />
                  )
                ) : (
                  <LoginPage onLogin={handleAuthSuccess} />
                )
              }
            />

            <Route
              path="/register"
              element={
                accessToken ? (
                  userRole === "ADMIN" ? (
                    <Navigate to="/admin" />
                  ) : (
                    <Navigate to="/profile" />
                  )
                ) : (
                  <RegisterPage onRegister={handleAuthSuccess} />
                )
              }
            />

            <Route
              path="/profile"
              element={
                accessToken && userRole === "USER" ? (
                  <UserProfilePage token={accessToken} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route
              path="/admin"
              element={
                accessToken && userRole === "ADMIN" ? (
                  <AdminDashboard onBack={handleLogout} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route path="/home" element={<HomePage />} />
            <Route path="/films/:id" element={<MovieDetailsWrapper />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function MovieDetailsWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [film, setFilm] = useState<movie.Film | null>(null);

  // Загружаем данные о фильме при изменении id
  useEffect(() => {
    if (!id) return;
    movie.getFilmById(id).then(setFilm);
  }, [id]);

  if (!film) {
    return <div className="text-center mt-5">Загрузка фильма...</div>;
  }

  const handleSelectSession = (sessionId: number) => {
    navigate(`/sessions/${sessionId}`, {
      state: {
        from: "movie-details",
        timestamp: new Date().toISOString(),
        futureFeature: "reserved_for_future_use",
      },
    });
  };

  return <MovieDetailsPage film={film} onSelectSession={handleSelectSession} />;
}
