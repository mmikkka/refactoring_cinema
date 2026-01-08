
import axios from "axios";
import { httpClient } from "./http";

export interface AuthResponse {
  accessToken: string;
}

export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: "MALE" | "FEMALE";
}): Promise<AuthResponse> {
  const response = await axios.post(`${httpClient}/register`, data, {
    headers: { "Content-Type": "application/json" },
  });
  localStorage.setItem("token", response.data.accessToken);
  return response.data;
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await axios.post(`${httpClient}/login`, data, {
    headers: { "Content-Type": "application/json" },
  });
  localStorage.setItem("token", response.data.accessToken);
  return response.data;
}

export function logout() {
  localStorage.removeItem("token");
}

export function getCurrentUser() {
  const token = localStorage.getItem("token");
  return token ? { accessToken: token } : null;
}
