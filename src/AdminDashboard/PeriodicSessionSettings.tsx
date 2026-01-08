// src/AdminDashboard/PeriodicSessionSettings.tsx
import type { Period } from "../hooks/usePeriodicSessions";

interface PeriodicSessionSettingsProps {
  isPeriodic: boolean;
  onTogglePeriodic: (value: boolean) => void;
  period: Period;
  onChangePeriod: (value: Period) => void;
  periodEnd: string | null;
  onChangePeriodEnd: (value: string) => void;
  sessionCount: number | null;
}

export function PeriodicSessionSettings({
  isPeriodic,
  onTogglePeriodic,
  period,
  onChangePeriod,
  periodEnd,
  onChangePeriodEnd,
  sessionCount,
}: PeriodicSessionSettingsProps) {
  return (
    <div className="mt-3">
      <div className="form-check mb-2">
        <input
          className="form-check-input"
          type="checkbox"
          id="isPeriodic"
          checked={isPeriodic}
          onChange={(e) => onTogglePeriodic(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="isPeriodic">
          Повторяющиеся сеансы
        </label>
      </div>

      {isPeriodic && (
        <>
          <select
            className="form-select mb-2"
            value={period}
            onChange={(e) => onChangePeriod(e.target.value as Period)}
          >
            <option value="EVERY_DAY">Каждый день</option>
            <option value="EVERY_WEEK">Каждую неделю</option>
          </select>

          <input
            className="form-control mb-2"
            type="date"
            value={periodEnd ?? ""}
            onChange={(e) => onChangePeriodEnd(e.target.value)}
          />

          {sessionCount !== null && (
            <p className="small text-muted">
              Будет создано сеансов: <strong>{sessionCount}</strong>
            </p>
          )}
        </>
      )}
    </div>
  );
}
