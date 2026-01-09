// src/config.ts
import type { PaginationParams } from "./types/common";

export const PLACEHOLDER_POSTER = "https://placehold.co";

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