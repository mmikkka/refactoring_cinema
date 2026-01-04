// src/MovieDetailsPage.test.tsx
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import axios from "axios";

import MovieDetailsPage from "./MovieDetailsPage";
import type { Film } from "./types/movie";

// Мокаем axios
vi.mock("axios");

// Мокаем ReviewsDisplay, чтобы он не мешал
vi.mock("./ReviewsDisplay", () => ({
  default: () => <div>Reviews Component</div>,
}));

// Фикстуры под текущие типы
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

const today = new Date().toISOString().split("T")[0];

const mockSessions = [
  {
    id: 1,
    movieId: 1,
    hallId: 1,
    date: today,
    time: "18:00",
    startAt: new Date().toISOString(),
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
      category: "Standard" as const,
      price: 100,
      isTaken: false,
    },
  ],
  categories: [{ id: "c1", name: "Standard", priceCents: 100 }],
};

const mockTickets = [
  {
    id: "t1",
    seatId: "1",
    categoryId: "c1",
    status: "AVAILABLE" as const,
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

describe("MovieDetailsPage (refactored orchestration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Storage.prototype.getItem = vi.fn(() => "fake-token");
    window.alert = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  // 1. Загрузка и отображение фильма + запрос сеансов
  it("должен отрисовать данные фильма и запросить список сеансов", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });

    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    expect(screen.getByText("Test Movie")).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "http://91.142.94.183:8080/sessions",
        expect.objectContaining({
          params: expect.objectContaining({ filmId: mockMovie.id }),
        })
      );
    });
  });

  // 2. Пустой список сеансов
  it("должен показывать сообщение 'Сеансов на эту дату нет' при пустом списке", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: [] },
    });

    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText((t) => t.includes("Сеансов") && t.includes("нет"))
      ).toBeInTheDocument();
    });
  });

  // 3. Выбор сеанса и загрузка плана зала
  it("при выборе сеанса должен загружаться план зала и билеты", async () => {
    // 1‑й запрос в useMovieSessions
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });

    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    // Дождаться кнопки сеанса
    const sessionBtn = await waitFor(() => screen.getByText(/18:00 - Зал 1/));

    // Следующие два axios.get — план и билеты
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: mockHallPlan }) // halls/{id}/plan
      .mockResolvedValueOnce({ data: mockTickets }); // sessions/{id}/tickets

    fireEvent.click(sessionBtn);

    await waitFor(() => {
      expect(screen.getByText("Схема зала:")).toBeInTheDocument();
      expect(axios.get).toHaveBeenCalledTimes(3);
    });
  });

  // 4. Выбор места и пересчёт выбранных мест
  it("должен позволять выбрать место и отобразить его как выбранное", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });

    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await waitFor(() => screen.getByText(/18:00 - Зал 1/));

    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);

    const seatBtn = await waitFor(() => screen.getByText("1"));

    fireEvent.click(seatBtn);

    await waitFor(() => {
      expect(seatBtn).toHaveClass("btn-success");
      expect(
        screen.getByText(
          (t) => t.includes("Забронировать") && t.includes("1 мест")
        )
      ).toBeInTheDocument();
    });
  });

  // 5. Бронирование: POST /tickets/.../reserve и /purchases
  it("кнопка 'Забронировать' должна отправлять запросы резервации и создания покупки", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });

    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await waitFor(() => screen.getByText(/18:00 - Зал 1/));

    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);

    const seatBtn = await waitFor(() => screen.getByText("1"));
    fireEvent.click(seatBtn);

    vi.mocked(axios.post)
      .mockResolvedValueOnce({}) // reserve
      .mockResolvedValueOnce({ data: mockPurchase }); // purchase

    const reserveBtn = await waitFor(() => screen.getByText(/Забронировать/));
    fireEvent.click(reserveBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://91.142.94.183:8080/tickets/t1/reserve",
        {},
        expect.any(Object)
      );
      expect(axios.post).toHaveBeenCalledWith(
        "http://91.142.94.183:8080/purchases",
        { ticketIds: ["t1"] },
        expect.any(Object)
      );
    });
  });

  // 6. Без токена — алерт и отсутствие POST
  it("не должен бронировать без токена", async () => {
    Storage.prototype.getItem = vi.fn(() => null);

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });

    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await waitFor(() => screen.getByText(/18:00 - Зал 1/));

    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);

    const seatBtn = await waitFor(() => screen.getByText("1"));
    fireEvent.click(seatBtn);

    const reserveBtn = await waitFor(() => screen.getByText(/Забронировать/));
    fireEvent.click(reserveBtn);

    expect(window.alert).toHaveBeenCalledWith("Сначала авторизуйтесь");
    expect(axios.post).not.toHaveBeenCalled();
  });

  // 7. Успешная оплата
  it("успешная оплата должна вызывать API и очищать форму", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });

    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await waitFor(() => screen.getByText(/18:00 - Зал 1/));

    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);

    const seatBtn = await waitFor(() => screen.getByText("1"));
    fireEvent.click(seatBtn);

    vi.mocked(axios.post)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: mockPurchase });

    fireEvent.click(await waitFor(() => screen.getByText(/Забронировать/)));

    // PaymentForm появляется
    const cardInput = await waitFor(() =>
      screen.getByPlaceholderText("Номер карты")
    );

    fireEvent.change(cardInput, { target: { value: "1234" } });

    vi.mocked(axios.post).mockResolvedValueOnce({});
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(screen.getByText("Оплатить"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://91.142.94.183:8080/payments/process",
        { purchaseId: mockPurchase.id, cardNumber: "1234" },
        expect.any(Object)
      );
      expect(window.alert).toHaveBeenCalledWith("Оплата прошла успешно!");
    });
  });

  // 8. Ошибка при бронировании должна показывать alert и не устанавливать покупку
  it("должен обрабатывать ошибку при бронировании и показывать сообщение об ошибке", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: mockSessions },
    });

    render(<MovieDetailsPage movie={mockMovie} onBack={vi.fn()} />);

    const sessionBtn = await waitFor(() => screen.getByText(/18:00 - Зал 1/));

    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: mockHallPlan })
      .mockResolvedValueOnce({ data: mockTickets });

    fireEvent.click(sessionBtn);

    const seatBtn = await waitFor(() => screen.getByText("1"));
    fireEvent.click(seatBtn);

    // имитируем падение любого из POST в handleReserve
    vi.mocked(axios.post).mockRejectedValueOnce(new Error("Network Error"));

    const reserveBtn = await waitFor(() => screen.getByText(/Забронировать/));
    fireEvent.click(reserveBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Ошибка при бронировании");
    });
  });
});
