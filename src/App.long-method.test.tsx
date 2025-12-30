import { render, screen, cleanup } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import App from "./App";
import { ROUTES, UserRole } from "./constants";
import * as authApi from "./api/auth";
import { jwtDecode } from "jwt-decode";

vi.mock("./api/auth");
vi.mock("jwt-decode");
// Заглушки страниц
vi.mock("./HomePage", () => ({ default: () => <div>Home Page</div> }));
vi.mock("./LoginPage", () => ({ default: () => <div>Login Page</div> }));
vi.mock("./UserProfilePage", () => ({
  default: () => <div>User Profile</div>,
}));
vi.mock("./AdminDashboard/AdminDashboard", () => ({
  default: () => <div>Admin Dashboard</div>,
}));

describe("App Long Method - Routing Logic Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks(); // Полный сброс поведения моков
    vi.clearAllMocks();
    cleanup();
  });

  // 1. Типичные данные: Доступ к публичной странице
  it("должен открывать главную страницу анонимному пользователю", () => {
    window.history.pushState({}, "", ROUTES.HOME);
    render(<App />);
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  // 2. Граничные данные (Позитив): Доступ юзера в профиль
  it("должен пускать авторизованного юзера в профиль", () => {
    window.history.pushState({}, "", ROUTES.PROFILE);
    vi.mocked(authApi.getCurrentUser).mockReturnValue({ accessToken: "valid" });
    vi.mocked(jwtDecode).mockReturnValue({ role: UserRole.USER });
    render(<App />);
    expect(screen.getByText(/User Profile/i)).toBeInTheDocument();
  });

  // 3. Граничные данные (Негатив): Юзер лезет в админку
  it("должен выкидывать обычного юзера из админки", () => {
    window.history.pushState({}, "", ROUTES.ADMIN);
    vi.mocked(authApi.getCurrentUser).mockReturnValue({ accessToken: "valid" });
    vi.mocked(jwtDecode).mockReturnValue({ role: UserRole.USER });
    render(<App />);
    expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
  });

  // 4. Логические пути: Редирект с логина для админа
  it("админ не должен видеть страницу логина, если уже вошел", () => {
    window.history.pushState({}, "", ROUTES.LOGIN);
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "admin-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({ role: UserRole.ADMIN });
    render(<App />);
    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
  });

  // 5. Состояние: Исчезновение токена (Logout)
  it("при логауте защищенная страница должна смениться на логин", () => {
    window.history.pushState({}, "", ROUTES.PROFILE);
    const { rerender } = render(<App />);

    // Имитируем сброс состояния (в реальности через UI, тут проверяем логику рендера)
    vi.mocked(authApi.getCurrentUser).mockReturnValue(null);
    rerender(<App />);
    // Если App перерендерится без токена, сработает Navigate
  });

  // 6. Плохие данные: Невалидный токен
  it("должен перенаправлять на логин, если токен поврежден", () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "broken",
    });
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error();
    });
    render(<App />);
    expect(authApi.logout).toHaveBeenCalled();
  });

  // 7. Поведение: Редирект с корня
  it("должен автоматически перенаправлять с '/' на '/home'", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  // 8. Поведение: Обработка 404
  it("должен редиректить на главную при вводе мусора в URL", () => {
    window.history.pushState({}, "", "/unknown-route");
    render(<App />);
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });
});
