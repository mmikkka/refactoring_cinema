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

// 1. Мокаем httpClient
vi.mock("./api/http", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: "http://test-api.com" },
  },
}));

vi.mock("./ReviewsDisplay", () => ({ default: () => <div>Reviews</div> }));

const TEST_DATE = "2026-01-08";

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
  beforeEach(() => {
    vi.clearAllMocks();
    Storage.prototype.getItem = vi.fn((key) =>
      key === "token" ? "fake-token" : null
    );
    window.alert = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("1. должен отрисовать данные фильма и запросить список сеансов", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);
    expect(screen.getByText("Test Movie")).toBeInTheDocument();
    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith(
        "/sessions",
        expect.objectContaining({
          params: expect.objectContaining({ filmId: mockMovie.id }),
        })
      );
    });
  });

  it("2. должен показывать сообщение 'Сеансов на эту дату нет' при пустом списке", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { data: [] } });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/Сеансов на эту дату нет/i)).toBeInTheDocument();
    });
  });

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
    await waitFor(() => {
      expect(screen.getByText(/Схема зала/i)).toBeInTheDocument();
    });
  });

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
    const seatBtn = await screen.findByText("1");
    fireEvent.click(seatBtn);
    await waitFor(() => {
      expect(seatBtn).toHaveClass("btn-success");
      expect(screen.getByText(/Забронировать/i)).toHaveTextContent("1 мест");
    });
  });

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
    await waitFor(() => {
      expect(httpClient.post).toHaveBeenCalledWith(
        "/tickets/t1/reserve",
        {},
        expect.any(Object)
      );
      expect(httpClient.post).toHaveBeenCalledWith(
        "/purchases",
        { ticketIds: ["t1"] },
        expect.any(Object)
      );
    });
  });

  it("6. не должен бронировать без токена", async () => {
    Storage.prototype.getItem = vi.fn(() => null);

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
    expect(window.alert).toHaveBeenCalledWith("Сначала авторизуйтесь");
    expect(httpClient.post).not.toHaveBeenCalled();
  });

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
      expect(httpClient.post).toHaveBeenCalledWith(
        "/payments/process",
        { purchaseId: mockPurchase.id, cardNumber: "1234" },
        expect.any(Object)
      );
      expect(window.alert).toHaveBeenCalledWith("Оплата прошла успешно!");
    });
  });

  it("8. должен обрабатывать ошибку при бронировании и показывать alert", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });
    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);
    const sessionBtn = await screen.findByText(/18:00/);
    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });
    fireEvent.click(sessionBtn);
    const seat = await screen.findByRole("button", { name: /^1$/ });
    fireEvent.click(seat);
    vi.mocked(httpClient.post).mockRejectedValueOnce(
      new Error("Network Error")
    );
    fireEvent.click(screen.getByRole("button", { name: /Забронировать/i }));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Ошибка при бронировании");
    });
  });
});
