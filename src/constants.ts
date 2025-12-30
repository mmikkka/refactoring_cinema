// constants.ts
export const UserRole = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

// Это позволит использовать UserRole в качестве типа (ADMIN | USER)
export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export const ROUTES = {
  HOME: "/home",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  ADMIN: "/admin",
  FILM_DETAILS: "/films/:id",
  ROOT: "/",
  ANY: "*",
} as const;