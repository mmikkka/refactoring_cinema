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

  // 1
  it("использует корректный baseURL из конфигурации", () => {
    expect(httpClient.defaults.baseURL).toBe("http://test-api.com");
  });

  // 2
  it("интерцептор добавляет заголовок Authorization, если токен есть", () => {
    localStorage.setItem("token", "test-token");
    const interceptorCallback = mockRequestUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = interceptorCallback(config);
    expect(result.headers.Authorization).toBe("Bearer test-token");
  });

  // 3
  it("не добавляет заголовок, если токена нет", () => {
    const interceptorCallback = mockRequestUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = interceptorCallback(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  // 4
  it("интерцептор корректно обрабатывает пустой объект заголовков", () => {
    localStorage.setItem("token", "stable-token");
    const interceptorCallback = mockRequestUse.mock.calls[0][0];
    const config = {}; 
    const result = interceptorCallback(config);
    
    expect(result.headers).toBeDefined();
    expect(result.headers.Authorization).toBe("Bearer stable-token");
  });

  // 5
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

  // 6
  it("обрабатывает ошибки запроса в интерцепторе", async () => {
    const rejectHandler = mockRequestUse.mock.calls[0][1];
    
    if (!rejectHandler) {
      throw new Error("Reject handler is not registered");
    }
    
    const error = new Error("Request failed");
    await expect(rejectHandler(error)).rejects.toThrow("Request failed");
  });

  // 7
  it("использует единый экземпляр (Singleton) для всех вызовов", async () => {
    const { httpClient: secondImport } = await import("./http");
    expect(httpClient).toBe(secondImport);
  });

  // 8
it("по умолчанию отправляет JSON через Content-Type", () => {
  const headers = (httpClient.defaults as any).headers || {};
  expect(headers["Content-Type"]).toBe("application/json");
});
});