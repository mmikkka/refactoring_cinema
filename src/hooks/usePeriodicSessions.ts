// src/hooks/usePeriodicSessions.ts
import { useEffect, useState } from "react";

export type Period = "EVERY_DAY" | "EVERY_WEEK";

interface UsePeriodicSessionsParams {
  startAt: string;
  period: Period;
  periodEnd: string | null;
  isPeriodic: boolean;
}

export function usePeriodicSessions({
  startAt,
  period,
  periodEnd,
  isPeriodic,
}: UsePeriodicSessionsParams) {
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isPeriodic || !periodEnd) {
      setSessionCount(null);
      return;
    }
    const diffDays =
      (new Date(periodEnd).getTime() - new Date(startAt).getTime()) /
      (1000 * 60 * 60 * 24);

    const count =
      period === "EVERY_DAY"
        ? Math.floor(diffDays) + 1
        : Math.floor(diffDays / 7) + 1;

    setSessionCount(count);
  }, [startAt, periodEnd, period, isPeriodic]);

  return { sessionCount };
}
