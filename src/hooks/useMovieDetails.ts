import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import type { Session, HallPlan, Ticket } from "../types/movie";

// Хук для управления сеансами
export const useMovieSessions = (movieId: number | string) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://91.142.94.183:8080/sessions", {
          params: { page: 0, size: 100, filmId: movieId },
        });
        setSessions(res.data.data || []);
      } catch (err) {
        console.error("Ошибка загрузки сеансов:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [movieId]);

  return { sessions, loading };
};

// Хук для работы с залом и билетами
export const useHallData = (sessionId: number | undefined) => {
  const [hallPlan, setHallPlan] = useState<HallPlan | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const [planRes, ticketsRes] = await Promise.all([
        axios.get(`http://91.142.94.183:8080/halls/${sessionId}/plan`), // Предполагаем, что sessionId ~ hallId для упрощения, или берем из сессии
        axios.get(`http://91.142.94.183:8080/sessions/${sessionId}/tickets`),
      ]);
      setHallPlan(planRes.data);
      setTickets(ticketsRes.data);
    } catch (err) {
      console.error("Ошибка загрузки зала:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { hallPlan, tickets, loading, refreshTickets: loadData };
};