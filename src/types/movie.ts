import { httpClient } from "../api/http";
import { PLACEHOLDER_POSTER } from "../config";


export interface Film {
  id: number;
  title: string;
  description: string;
  duration: number; 
  ageRating: string;
  imageUrl?: string;
  genre?: string;
  rating?: number;
  createdAt: string; 
  updatedAt: string;
}

export interface FilmResponse {
  data: Film[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const MOCK_FILMS: Film[] = [
  {
    id: 1,
    title: "Интерстеллар",
    description: "Фантастический фильм о путешествиях во времени и пространстве.",
    duration: 169,
    ageRating: "12+",
    imageUrl: `${PLACEHOLDER_POSTER}/150`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Начало",
    description: "Фильм о снах и подсознании, режиссёр Кристофер Нолан.",
    duration: 148,
    ageRating: "12+",
    imageUrl: `${PLACEHOLDER_POSTER}/150`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getFilms(): Promise<Film[]> {
  // const res = await httpClient.get<FilmResponse>("/films");
  // if (res.status < 200 || res.status >= 300) throw new Error("Ошибка загрузки фильмов");
  // return res.data.data;
  return new Promise(resolve => setTimeout(() => resolve(MOCK_FILMS), 300));
  
}

export async function getFilmById(id: string): Promise<Film> {
  // const res = await httpClient.get<Film>(`/films/${id}`);
  // if (res.status < 200 || res.status >= 300) throw new Error("Фильм не найден");
  // return res.data;

  // Эмулируем поиск фильма по ID в моках
  const film = MOCK_FILMS.find(f => f.id === Number(id));
  
  if (!film) {
    throw new Error("Фильм не найден в моках");
  }
  
  return new Promise(resolve => setTimeout(() => resolve(film), 300));
}

export interface Session {
  startAt: any;
  id: number;
  movieId: number;
  hallId: number;
  date: string;
  time: string;
}

export interface Seat {
  id: number;
  row: number;
  number: number;
  category: "VIP" | "Standard";
  price: number;
  isTaken: boolean;
}

export interface Category {
  id: string;
  name: string;
  priceCents: number;
}

export interface HallPlan {
  hallId: string;
  rows: number;
  seats: Seat[];
  categories: Category[];
}

export interface Ticket {
  id: string;
  seatId: string;
  categoryId: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  priceCents: number;
}

const buildFilmPayload = (film: Partial<Film>) => ({
  title: film.title,
  description: film.description,
  durationMinutes: film.duration, 
  ageRating: film.ageRating,
});

export async function createFilm(
  film: Omit<Film, "id" | "createdAt" | "updatedAt">
): Promise<Film> {
  const res = await httpClient.post<Film>("/films", buildFilmPayload(film));
  if (res.status < 200 || res.status >= 300) {
    throw new Error("Не удалось создать фильм");
  }
  return res.data;
}

export async function updateFilm(film: Film): Promise<Film> {
  if (!film.id) {
    throw new Error("Нельзя обновить фильм без id");
  }

  const res = await httpClient.put<Film>(`/films/${film.id}`, buildFilmPayload(film));
  if (res.status < 200 || res.status >= 300) {
    throw new Error("Не удалось обновить фильм");
  }

  return res.data;
}
