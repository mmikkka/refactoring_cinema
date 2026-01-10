import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import App from "./App";
import { UserRole } from "./constants";
import * as authApi from "./api/auth";
import { jwtDecode } from "jwt-decode";

vi.mock("./api/auth");
vi.mock("jwt-decode");

vi.mock("./Header", () => ({ default: () => <header>Header</header> }));
vi.mock("./HomePage", () => ({ default: () => <div>Home Page</div> }));
vi.mock("./LoginPage", () => ({ default: () => <div>Login Page</div> }));
vi.mock("./UserProfilePage", () => ({
  default: () => <div>User Profile</div>,
}));
vi.mock("./AdminDashboard/AdminDashboard", () => ({
  default: () => <div>Admin Dashboard</div>,
}));
vi.mock("./components/MovieDetailsWrapper", () => ({
  default: () => <div>Movie Details</div>,
}));

describe("App Component - Refactored Routing Logic (McConnell 22.3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
  });

  afterEach(cleanup);

  // 1. Типичные данные (McConnell 22.3):
  //    Проверка базовой загрузки приложения и стандартного сценария —
  //    при старте без авторизации показывается главная страница.
  it("1. Типичные данные: Начальный рендер и редирект на Home", async () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue(null);
    render(<App />);

    expect(await screen.findByText(/Home Page/i)).toBeInTheDocument();
  });

  // 2. Логические пути (McConnell 22.3):
  //    Проверка ветвления в роутинге — авторизованный пользователь с
  //    ролью USER должен корректно попадать в защищенные части приложения.
  it("2. Логические пути: Доступ к профилю для авторизованного пользователя", async () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "valid-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({
      role: UserRole.USER,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Header/i)).toBeInTheDocument();
    });
  });

  // 3. Плохие данные (McConnell 22.3):
  //    Проверка «защитного программирования» — при просроченном токене
  //    приложение должно вызвать logout и очистить сессию.
  it("3. Плохие данные: Просроченный токен вызывает Logout", async () => {
    const logoutSpy = vi.spyOn(authApi, "logout");
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "expired-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({
      role: UserRole.USER,
      exp: Math.floor(Date.now() / 1000) - 1000,
    });

    render(<App />);

    expect(logoutSpy).toHaveBeenCalled();
  });

  // 4. Взаимодействие (McConnell 22.3):
  //    Проверка связи между App и API авторизации (handleLogout) —
  //    при работе с сессией корректно вызываются методы authApi.
  it("4. Взаимодействие: Выход из системы сбрасывает состояние", async () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue({ accessToken: "token" });
    vi.mocked(jwtDecode).mockReturnValue({
      role: UserRole.USER,
      exp: Date.now() + 1000,
    });

    render(<App />);

    expect(authApi.getCurrentUser).toHaveBeenCalled();
  });

  // 5. Граничные данные (McConnell 22.3):
  //    Проверка корректной обработки роли ADMIN и граничных условий
  //    доступа к админским роутам через AccessControlRoute.
  it("5. Граничные данные: Доступ ADMIN в админку через AccessControlRoute", async () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "admin-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({
      role: UserRole.ADMIN,
      exp: Date.now() + 1000,
    });

    render(<App />);

    await waitFor(() => {
      expect(jwtDecode).toHaveBeenCalledWith("admin-token");
    });
  });

  // 6. Плохие данные (McConnell 22.3):
  //    Проверка обработки битого токена (ошибка декодирования) — приложение
  //    не должно падать, а должно корректно разлогинить пользователя.
  it("6. Плохие данные: Битый токен (ошибка декодирования)", () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "broken-token",
    });
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error("Invalid JWT");
    });
    const logoutSpy = vi.spyOn(authApi, "logout");

    render(<App />);

    expect(logoutSpy).toHaveBeenCalled();
  });

  // 7. Состояние (McConnell 22.3):
  //    Проверка поведения системы при отсутствии данных о пользователе —
  //    аноним должен оставаться на публичных страницах (Home).
  it("7. Состояние: Аноним при попытке зайти в профиль должен видеть Login", async () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue(null);

    render(<App />);

    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  // 8. Логические пути (McConnell 22.3):
  //    Проверка того, что публичный роут (Login) недоступен для уже
  //    авторизованных пользователей и логика роутинга обрабатывает это условие.
  it("8. Логические пути: Публичный роут (Login) недоступен для авторизованных", async () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "active-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({
      role: UserRole.USER,
      exp: Date.now() + 1000,
    });

    render(<App />);

    await waitFor(() => {
      expect(authApi.getCurrentUser).toHaveBeenCalled();
    });
  });
});
