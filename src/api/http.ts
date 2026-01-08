import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080" || "http://91.142.94.183:8080" || "http://test-api.com";

export const httpClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);