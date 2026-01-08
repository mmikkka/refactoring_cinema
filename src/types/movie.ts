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
  const res = await fetch(`${httpClient}/films`);
  if (!res.ok) throw new Error("Ошибка загрузки фильмов");
  const json: FilmResponse = await res.json();
  return json.data;
  return new Promise(resolve => setTimeout(() => resolve(MOCK_FILMS), 300));
  
}

export async function getFilmById(id: string): Promise<Film> {
  const res = await fetch(`${httpClient}/films/${id}`);
  if (!res.ok) throw new Error("Фильм не найден");
  return res.json();
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
  const res = await fetch(`${httpClient}/films`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildFilmPayload(film)),
  });

  if (!res.ok) {
    throw new Error("Не удалось создать фильм");
  }

  const json = await res.json();
  return json as Film;
}

export async function updateFilm(film: Film): Promise<Film> {
  if (!film.id) {
    throw new Error("Нельзя обновить фильм без id");
  }

  const res = await fetch(`${httpClient}/films/${film.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildFilmPayload(film)),
  });

  if (!res.ok) {
    throw new Error("Не удалось обновить фильм");
  }

  return film;
}
