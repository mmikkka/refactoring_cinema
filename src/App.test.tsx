import { render, screen, cleanup } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import App from "./App";
import { ROUTES, UserRole } from "./constants";
import * as authApi from "./api/auth";
import { jwtDecode } from "jwt-decode";

// Мокаем зависимости
vi.mock("./api/auth");
vi.mock("jwt-decode");
// Мокаем компоненты страниц, чтобы тесты работали быстрее и не требовали их логики
vi.mock("./Header", () => ({ default: () => <header>Header</header> }));
vi.mock("./HomePage", () => ({ default: () => <div>Home Page</div> }));
vi.mock("./LoginPage", () => ({ default: () => <div>Login Page</div> }));
vi.mock("./AdminDashboard/AdminDashboard", () => ({
  default: () => <div>Admin Dashboard</div>,
}));
vi.mock("./UserProfilePage", () => ({
  default: () => <div>User Profile Page</div>,
}));

describe("App Unit Tests (Routing & Auth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    // Сбрасываем URL перед каждым тестом в корень
    window.history.pushState({}, "", "/");
  });

  // 1. Граничные данные: Доступ к профилю без токена
  it("должен перенаправить на логин при попытке зайти в профиль без токена", () => {
    // Вручную меняем путь в "браузере" теста
    window.history.pushState({}, "", ROUTES.PROFILE);

    render(<App />);

    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  // 2. Логические пути: Редирект авторизованного Админа с логина
  it("админ при заходе на страницу логина должен попасть в админку", () => {
    window.history.pushState({}, "", ROUTES.LOGIN);
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "admin-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({ role: UserRole.ADMIN });

    render(<App />);

    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
  });

  // 3. Логические пути: Редирект авторизованного Юзера с логина
  it("пользователь при заходе на логин не должен видеть страницу логина", () => {
    window.history.pushState({}, "", ROUTES.LOGIN);
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "user-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({ role: UserRole.USER });

    render(<App />);

    expect(screen.queryByText(/Login Page/i)).not.toBeInTheDocument();
  });

  // 4. Типичные данные: Восстановление сессии
  it("должен проверять наличие пользователя в localStorage при старте", () => {
    render(<App />);
    expect(authApi.getCurrentUser).toHaveBeenCalled();
  });

  // 5. Плохие данные: Ошибка декодирования токена
  it("должен вызвать logout при ошибке в токене", () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "broken",
    });
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error();
    });

    render(<App />);

    expect(authApi.logout).toHaveBeenCalled();
  });

  // 6. Состояние: Защита админки от обычного юзера
  it("юзер не должен попасть в админку (должен быть переброшен на главную)", () => {
    window.history.pushState({}, "", ROUTES.ADMIN);

    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "user-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({ role: UserRole.USER });

    render(<App />);

    // Проверяем, что админка НЕ отображается
    expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();

    // Теперь мы ожидаем переход на главную страницу, а не в профиль
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  // 7. Поведение: Редирект с корня
  it("должен перенаправлять на главную страницу с корня", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  // 8. Поведение: Обработка 404 (любой другой путь)
  it("должен уводить на корень при неизвестном URL", () => {
    window.history.pushState({}, "", "/some-random-page");
    render(<App />);
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });
});
