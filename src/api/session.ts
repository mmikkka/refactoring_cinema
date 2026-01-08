import {httpClient} from "./http";



export const getSessionsByFilm = async (filmId: string) => {
  const res = await httpClient.get("/sessions", { params: { filmId } });
  return res.data.data; 
};

export const getSessionById = async (id: string) => {
  const res = await httpClient.get(`/sessions/${id}`);
  return res.data;
};

export const getHallPlan = async (hallId: string) => {
  const res = await httpClient.get(`/halls/${hallId}/plan`);
  return res.data;
};