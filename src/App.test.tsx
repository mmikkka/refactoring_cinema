import { render, screen, cleanup } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import App from "./App";
import { ROUTES, UserRole } from "./constants";
import * as authApi from "./api/auth";
import { jwtDecode } from "jwt-decode";

vi.mock("./api/auth");
vi.mock("jwt-decode");

vi.mock("./api/http", () => ({
  httpClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: "" },
  },
}));

vi.mock("./Header", () => ({ default: () => <header>Header</header> }));
vi.mock("./HomePage", () => ({ default: () => <div>Home Page</div> }));
vi.mock("./LoginPage", () => ({ default: () => <div>Login Page</div> }));
vi.mock("./AdminDashboard/AdminDashboard", () => ({
  default: () => <div>Admin Dashboard</div>,
}));
vi.mock("./UserProfilePage", () => ({
  default: () => <div>Profile Page</div>,
}));

describe("App Auth & Routing (Fixed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", ROUTES.ROOT);
  });

  afterEach(cleanup);

  // 1. Тестирование типичных данных:
  //    Проверка стандартного сценария: неавторизованный пользователь
  //    заходит на главную страницу и видит ожидаемый контент.
  it("1. Типичные данные: Аноним на главной видит Home Page", () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue(null);
    render(<App />);
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  // 2. Тестирование граничных условий:
  //    Попытка неавторизованного пользователя попасть на защищенный
  //    роут /profile должна привести к редиректу на страницу логина.
  it("2. Граничные данные: Доступ к профилю без токена редиректит на Login", () => {
    window.history.pushState({}, "", ROUTES.PROFILE);
    vi.mocked(authApi.getCurrentUser).mockReturnValue(null);
    render(<App />);
    expect(window.location.pathname).toBe(ROUTES.LOGIN);
  });

  // 3. Тестирование плохих данных:
  //    Имитация поврежденного JWT-токена, который при декодировании
  //    вызывает ошибку и должен приводить к logout.
  it("3. Плохие данные: Поврежденный JWT вызывает logout", () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "broken",
    });
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    render(<App />);

    expect(authApi.logout).toHaveBeenCalled();
  });

  // 4. Тестирование логических путей:
  //    Проверка логики перенаправления для роли ADMIN при попытке
  //    открытия страницы логина уже авторизованным администратором.
  it("4. Логические пути: Редирект авторизованного админа с Login", async () => {
    window.history.pushState({}, "", ROUTES.LOGIN);
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "admin-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({
      role: UserRole.ADMIN,
      exp: Date.now() + 10000,
    });

    render(<App />);

    expect(window.location.pathname).toBe(ROUTES.ADMIN);
  });

  // 5. Тестирование граничных условий:
  //    Токен формально корректен, но его срок действия (exp) уже истек,
  //    поэтому приложение должно разлогинить пользователя.
  it("5. Граничные данные: Токен истек", () => {
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "old-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({ role: UserRole.USER, exp: 1000 }); // 1970 год

    render(<App />);

    expect(authApi.logout).toHaveBeenCalled();
  });

  // 6. Тестирование логических путей:
  //    Проверка разграничения прав доступа: обычный пользователь
  //    не должен получать доступ к компонентам админ-панели.
  it("6. Состояние: Юзер не видит админку", () => {
    window.history.pushState({}, "", ROUTES.ADMIN);
    vi.mocked(authApi.getCurrentUser).mockReturnValue({
      accessToken: "user-token",
    });
    vi.mocked(jwtDecode).mockReturnValue({
      role: UserRole.USER,
      exp: Date.now() + 10000,
    });

    render(<App />);

    expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
  });

  // 7. Тестирование взаимодействий (State):
  //    Проверка того, что при инициализации приложения вызывается
  //    API-метод проверки текущей сессии пользователя.
  it("7. Взаимодействие: Проверка сессии при старте", () => {
    render(<App />);
    expect(authApi.getCurrentUser).toHaveBeenCalled();
  });

  // 8. Тестирование плохих данных:
  //    Обработка некорректного ввода URL: при переходе на несуществующий
  //    путь приложение должно редиректить на главную страницу.
  it("8. Плохие данные: Редирект с несуществующего роута на Home", () => {
    window.history.pushState({}, "", "/garbage");
    render(<App />);
    expect(window.location.pathname).toBe(ROUTES.HOME);
  });
});
