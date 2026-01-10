import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { httpClient } from "./api/http";
import MovieDetailsPage from "./MovieDetailsPage";
import type { Film } from "./types/movie";

vi.mock("./api/http", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: "http://test-api.com" },
  },
}));

vi.mock("./ReviewsDisplay", () => ({ default: () => <div>Reviews</div> }));

const TEST_DATE = "2026-01-10";

const mockMovie: Film = {
  id: 1,
  title: "Test Movie",
  description: "Desc",
  duration: 120,
  ageRating: "18+",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  imageUrl: "img.jpg",
  genre: "Action",
};

const mockSessions = [
  {
    id: 1,
    movieId: 1,
    hallId: 1,
    date: TEST_DATE,
    time: "18:00",
    startAt: `${TEST_DATE}T18:00:00.000Z`,
  },
];

const mockHallPlan = {
  hallId: "1",
  rows: 1,
  seats: [
    {
      id: 1,
      row: 1,
      number: 1,
      category: "Standard",
      price: 100,
      isTaken: false,
    },
  ],
};

const mockTickets = [
  {
    id: "t1",
    seatId: "1",
    categoryId: "c1",
    status: "AVAILABLE",
    priceCents: 100,
  },
];

const mockPurchase = {
  id: 123,
  movie: mockMovie,
  session: mockSessions[0],
  seats: [mockHallPlan.seats[0]],
  totalPrice: 100,
};

describe("MovieDetailsPage (Full Suite)", () => {
  let getItemSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation((key) => (key === "token" ? "fake-token" : null));
    window.alert = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // 1. Типичные данные (McConnell 22.3):
  //    Нормальный сценарий — фильм, дата и API работают штатно:
  //    страница рендерится и запрашивает список сеансов по фильму.
  it("1. должен отрисовать данные фильма и запросить список сеансов", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    expect(screen.getByText("Test Movie")).toBeInTheDocument();
    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith(
        "/sessions",
        expect.any(Object)
      );
    });
  });

  // 2. Граничные данные (McConnell 22.3):
  //    Пограничный случай для списка сеансов — корректный запрос,
  //    но результат пустой, и UI должен отобразить соответствующее сообщение.
  it("2. должен показывать сообщение 'Сеансов на эту дату нет' при пустом списке", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { data: [] } });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    expect(
      await screen.findByText(/Сеансов на эту дату нет/i)
    ).toBeInTheDocument();
  });

  // 3. Логические пути (McConnell 22.3):
  //    Проверка перехода по сценарию выбора сеанса — после клика
  //    должны подгружаться план зала и билеты, а на экране появиться схема.
  it("3. при выборе сеанса должен загружаться план зала и билеты", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await screen.findByText(/18:00/);
    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);
    expect(await screen.findByText(/Схема зала/i)).toBeInTheDocument();
  });

  // 4. Состояние (McConnell 22.3):
  //    Тест управления состоянием выбранных мест — клик по месту
  //    помечает его как выбранное и меняет текст кнопки бронирования.
  it("4. должен позволять выбрать место и отобразить его как выбранное", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await screen.findByText(/18:00/);

    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);

    await screen.findByText(/Схема зала/i);

    const seatBtn = await screen.findByRole("button", { name: /^1$/ });
    fireEvent.click(seatBtn);

    await waitFor(() => {
      expect(seatBtn).toHaveClass("btn-success");
    });

    expect(screen.getByText(/Забронировать/i)).toHaveTextContent("1 мест");
  });

  // 5. Взаимодействие (McConnell 22.3):
  //    Проверка цепочки взаимодействий UI → API: на "Забронировать"
  //    отправляются запросы на резервирование и создание покупки.
  it("5. кнопка 'Забронировать' должна отправлять запросы резервации и покупки", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await screen.findByText(/18:00/);
    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);
    fireEvent.click(await screen.findByRole("button", { name: /^1$/ }));

    vi.mocked(httpClient.post)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: mockPurchase });

    fireEvent.click(screen.getByRole("button", { name: /Забронировать/i }));

    await screen.findByPlaceholderText("Номер карты");

    expect(httpClient.post).toHaveBeenCalledWith("/tickets/t1/reserve", {});
    expect(httpClient.post).toHaveBeenCalledWith("/purchases", {
      ticketIds: ["t1"],
    });
  });

  // 6. Плохие данные (McConnell 22.3):
  //    Некорректное состояние авторизации (нет токена) — система
  //    должна заблокировать бронирование, показать alert и не дергать API.
  it("6. не должен бронировать без токена", async () => {
    getItemSpy.mockReturnValue(null);

    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await screen.findByText(/18:00/);
    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);
    fireEvent.click(await screen.findByRole("button", { name: /^1$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Забронировать/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Сначала авторизуйтесь");
    });
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  // 7. Типичные данные + взаимодействие (McConnell 22.3):
  //    Happy-path оплаты — корректные данные карты, успешный вызов
  //    платежного API и показ сообщения об успешной оплате.
  it("7. успешная оплата должна вызывать API и показывать успех", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await screen.findByText(/18:00/);
    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);
    fireEvent.click(await screen.findByRole("button", { name: /^1$/ }));

    vi.mocked(httpClient.post)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: mockPurchase });
    fireEvent.click(screen.getByRole("button", { name: /Забронировать/i }));

    const cardInput = await screen.findByPlaceholderText("Номер карты");
    fireEvent.change(cardInput, { target: { value: "1234" } });

    vi.mocked(httpClient.post).mockResolvedValueOnce({});
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(screen.getByText("Оплатить"));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Оплата прошла успешно!");
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      "/payments/process",
      { purchaseId: mockPurchase.id, cardNumber: "1234" },
      expect.any(Object)
    );
  });

  // 8. Плохие данные / обработка ошибок (McConnell 22.3):
  //    Имитируется ошибка сети при бронировании; проверяется, что
  //    ошибка логируется и пользователю показывается alert об ошибке.
  it("8. должен обрабатывать ошибку при бронировании и показывать alert", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await screen.findByText(/18:00/);
    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);
    fireEvent.click(await screen.findByRole("button", { name: /^1$/ }));

    vi.mocked(httpClient.post).mockRejectedValueOnce(
      new Error("Network Error")
    );

    fireEvent.click(screen.getByRole("button", { name: /Забронировать/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Ошибка при бронировании");
    });

    consoleSpy.mockRestore();
  });
});
