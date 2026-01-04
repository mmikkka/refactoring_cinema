// src/config.ts
import type { PaginationParams } from "./types/common";

export const API_BASE_URL = "http://91.142.94.183:8080";

export const PLACEHOLDER_POSTER = "https://placehold.co/300x450";

export const MESSAGES = {
  authRequired: "Сначала авторизуйтесь",
  reserveError: "Ошибка при бронировании",
  sessionError: "Ошибка загрузки сеансов:",
  hallError: "Ошибка загрузки зала:",
};

export const DEFAULT_PAGINATION: PaginationParams = {
  page: 0,
  size: 100,
};