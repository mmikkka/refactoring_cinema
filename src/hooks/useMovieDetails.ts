import { useState, useEffect, useCallback } from "react";
import type { Session, HallPlan, Ticket } from "../types/movie";
import { MESSAGES } from "../config";
//DEFAULT_PAGINATION,
//import { httpClient } from "../api/http";

// Хук для управления сеансами
export const useMovieSessions = (movieId: number | string) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        /* // СТАРЫЙ КОД ЗАПРОСА
        const res = await httpClient.get(`/sessions`, {
          params: { 
            ...DEFAULT_PAGINATION, 
            filmId: movieId 
          },
        });
        setSessions(res.data.data || []);
        */

        // МОКОВЫЕ ДАННЫЕ СЕАНСОВ
        await new Promise(resolve => setTimeout(resolve, 400));
        const mockSessions: Session[] = [
          { id: 101, movieId: Number(movieId), hallId: 1, date: "2026-01-09", time: "10:00", startAt: "" },
          { id: 102, movieId: Number(movieId), hallId: 2, date: "2026-01-09", time: "10:00", startAt: "" },
          { id: 103, movieId: Number(movieId), hallId: 1, date: "2026-01-09", time: "10:00", startAt: "" },
        ];
        setSessions(mockSessions);

      } catch (err) {
        console.error(MESSAGES.sessionError, err);
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

      /* // СТАРЫЙ КОД ЗАПРОСА
      const [planRes, ticketsRes] = await Promise.all([
        httpClient.get(`/halls/${sessionId}/plan`), 
        httpClient.get(`/sessions/${sessionId}/tickets`),
      ]);
      if (planRes && planRes.data) setHallPlan(planRes.data);
      if (ticketsRes && ticketsRes.data) setTickets(ticketsRes.data);
      */

      // МОКОВЫЕ ДАННЫЕ ЗАЛА
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHallPlan({
        hallId: "1",
        rows: 5,
        categories: [{ id: "VIP", name: "VIP", priceCents: 100000 }],
        seats: [
           { id: 1, row: 1, number: 1, category: "Standard", price: 500, isTaken: false },
           { id: 2, row: 1, number: 2, category: "Standard", price: 500, isTaken: true }
        ]
      });
      setTickets([]); // Пока пусто, чтобы не было ошибок

    } catch (err) {
      console.error(MESSAGES.hallError, err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { hallPlan, tickets, loading, refreshTickets: loadData };
};