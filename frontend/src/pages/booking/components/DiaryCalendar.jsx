import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  MONTHS,
  WEEKDAYS_SHORT,
  buildMonthGrid,
  summariseDay,
  toISODate,
} from "../bookingUtils";

export default function DiaryCalendar({
  cursor,
  byDate,
  status,
  error,
  selectedISO,
  mode,
  canGoPrev,
  canGoNext,
  onMonthChange,
  onToday,
  onSelect,
  onRetry,
}) {
  const today = toISODate(new Date());
  const weeks = buildMonthGrid(cursor);
  const isAdmin = mode === "admin";

  return (
    <article className="bk-sheet bk-sheet--calendar" aria-label="Month calendar">
      <div className="bk-rings" aria-hidden="true" />

      <header className="bk-cal-head">
        <div className="bk-cal-title">
          <h2 className="bk-month">{MONTHS[cursor.getMonth()]}</h2>
          <span className="bk-year">{cursor.getFullYear()}</span>
        </div>
        <div className="bk-cal-nav">
          <button
            type="button"
            className="bk-link-btn"
            onClick={onToday}
            title="Go to this month"
          >
            Today
          </button>
          <button
            type="button"
            className="bk-brass"
            onClick={() => onMonthChange(-1)}
            disabled={!canGoPrev}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="bk-brass"
            onClick={() => onMonthChange(1)}
            disabled={!canGoNext}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <div className="bk-rule" aria-hidden="true" />

      {status === "error" && (
        <div className="bk-notice">
          <p>{error}</p>
          <button type="button" className="bk-link-btn" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      <div className="bk-grid" role="grid">
        <div className="bk-grid__row bk-grid__row--head" role="row">
          {WEEKDAYS_SHORT.map((wd, i) => (
            <div
              key={wd}
              role="columnheader"
              className={`bk-wd${i >= 5 ? " is-weekend" : ""}`}
            >
              {wd}
            </div>
          ))}
        </div>

        {weeks.map((week, wIdx) => (
          <div className="bk-grid__row" role="row" key={wIdx}>
            {week.map((cell) => {
              const slots = byDate[cell.iso] || [];
              const summary = summariseDay(slots);
              const isPast = cell.iso < today;
              const isSelected = cell.iso === selectedISO;
              const isToday = cell.iso === today;

              const classes = [
                "bk-day",
                cell.weekend ? "is-weekend" : "",
                !cell.inMonth ? "is-outside" : "",
                isPast ? "is-past" : "",
                isSelected ? "is-selected" : "",
                isToday ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const clickable = cell.inMonth && !isPast;

              return (
                <div className={classes} key={cell.iso} role="gridcell">
                  {clickable ? (
                    <button
                      type="button"
                      className="bk-day__btn"
                      onClick={() => onSelect(cell.iso)}
                      aria-label={`Select ${cell.iso}`}
                    >
                      <span className="bk-num">{cell.day}</span>
                      <DayDots summary={summary} isAdmin={isAdmin} loading={status === "loading"} />
                    </button>
                  ) : (
                    <div className="bk-day__static">
                      <span className="bk-num">{cell.day}</span>
                      <DayDots summary={summary} isAdmin={isAdmin} loading={false} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <footer className="bk-legend">
        <span>
          <i className="bk-dot" aria-hidden="true" />
          Open time
        </span>
        {isAdmin && (
          <span>
            <i className="bk-dot is-booked" aria-hidden="true" />
            Booked
          </span>
        )}
        <span className="bk-legend__note">
          Calls run on weekdays, 15 minutes each.
        </span>
      </footer>
    </article>
  );
}

function DayDots({ summary, isAdmin, loading }) {
  if (loading && summary.total === 0) {
    return <span className="bk-dots" aria-hidden="true" />;
  }
  const { open, taken } = summary;
  if (open === 0 && taken === 0) return <span className="bk-dots" aria-hidden="true" />;
  if (open === 0 && taken > 0) return <span className="bk-full">full</span>;

  const dots = [];
  for (let i = 0; i < Math.min(open, 4); i++) {
    dots.push(<i key={`o${i}`} className="bk-dot" aria-hidden="true" />);
  }
  if (isAdmin) {
    for (let i = 0; i < Math.min(taken, 4); i++) {
      dots.push(<i key={`t${i}`} className="bk-dot is-booked" aria-hidden="true" />);
    }
  }
  return <span className="bk-dots">{dots}</span>;
}
