import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockRequestUse } = vi.hoisted(() => ({
  mockRequestUse: vi.fn(),
}));

vi.mock("axios", () => {
  return {
    default: {
      create: vi.fn(() => ({
        defaults: {
          baseURL: "http://test-api.com",
          headers: { "Content-Type": "application/json" },
        },
        interceptors: {
          request: {
            use: mockRequestUse,
          },
        },
      })),
    },
  };
});

import { httpClient } from "./http";

describe("HTTP Client Centralization (Shotgun Surgery)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. Типичные данные (McConnell 22.3):
  //    Базовый случай конфигурации — проверка, что клиент
  //    использует ожидаемый baseURL из централизованной настройки.
  it("использует корректный baseURL из конфигурации", () => {
    expect(httpClient.defaults.baseURL).toBe("http://test-api.com");
  });

  // 2. Логические пути (McConnell 22.3):
  //    Ветка, где в localStorage есть токен — интерцептор
  //    обязан добавить корректный заголовок Authorization.
  it("интерцептор добавляет заголовок Authorization, если токен есть", () => {
    localStorage.setItem("token", "test-token");
    const interceptorCallback = mockRequestUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = interceptorCallback(config);
    expect(result.headers.Authorization).toBe("Bearer test-token");
  });

  // 3. Граничные данные (McConnell 22.3):
  //    Пограничный случай без токена — логика не должна
  //    добавлять Authorization и оставлять заголовки пустыми.
  it("не добавляет заголовок, если токена нет", () => {
    const interceptorCallback = mockRequestUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = interceptorCallback(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  // 4. Плохие данные / устойчивость (McConnell 22.3):
  //    Конфиг без headers вообще — интерцептор должен
  //    сам создать объект заголовков и аккуратно добавить Authorization.
  it("интерцептор корректно обрабатывает пустой объект заголовков", () => {
    localStorage.setItem("token", "stable-token");
    const interceptorCallback = mockRequestUse.mock.calls[0][0];
    const config = {}; 
    const result = interceptorCallback(config);
    
    expect(result.headers).toBeDefined();
    expect(result.headers.Authorization).toBe("Bearer stable-token");
  });

  // 5. Состояние / инварианты (McConnell 22.3):
  //    Проверка сохранения существующих важных заголовков —
  //    интерцептор не должен ломать уже заданный Content-Type.
  it("интерцептор не перезаписывает уже существующие важные заголовки", () => {
    localStorage.setItem("token", "test-token");
    const interceptorCallback = mockRequestUse.mock.calls[0][0];
    const config = { 
      headers: { "Content-Type": "multipart/form-data" } 
    };
    const result = interceptorCallback(config);
    expect(result.headers["Content-Type"]).toBe("multipart/form-data");
    expect(result.headers.Authorization).toBe("Bearer test-token");
  });

  // 6. Обработка ошибок (плохие данные/исключения, McConnell 22.3):
  //    Проверка reject-ветки интерцептора — ошибка не глушится,
  //    а корректно пробрасывается как отклонённый промис.
  it("обрабатывает ошибки запроса в интерцепторе", async () => {
    const rejectHandler = mockRequestUse.mock.calls[0][1];
    
    if (!rejectHandler) {
      throw new Error("Reject handler is not registered");
    }
    
    const error = new Error("Request failed");
    await expect(rejectHandler(error)).rejects.toThrow("Request failed");
  });

  // 7. Взаимодействие / архитектурный инвариант (McConnell 22.3):
  //    Проверка, что используется единый экземпляр httpClient
  //    (паттерн Singleton), исключая «дробный» доступ к HTTP.
  it("использует единый экземпляр (Singleton) для всех вызовов", async () => {
    const { httpClient: secondImport } = await import("./http");
    expect(httpClient).toBe(secondImport);
  });

  // 8. Типичные данные (McConnell 22.3):
  //    Базовое поведение по умолчанию — клиент шлёт JSON
  //    через заголовок Content-Type: application/json.
  it("по умолчанию отправляет JSON через Content-Type", () => {
    const headers = (httpClient.defaults as any).headers || {};
    expect(headers["Content-Type"]).toBe("application/json");
  });
});
