import { httpClient } from "./http";


export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  roleType: "USER" | "ADMIN";
  gender: "MALE" | "FEMALE";
  createdAt: string;
  updatedAt: string;
}


export async function getCurrentUser(token: string): Promise<User> {
  const response = await httpClient.get("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}


export async function updateCurrentUser(
  token: string,
  data: Partial<Pick<User, "firstName" | "lastName" | "email" | "age" | "gender">>
): Promise<User> {
  const response = await httpClient.put("/users/me", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
