import { CalendarDays, ChevronLeft, ChevronRight, Pill } from "lucide-react";
import { daysBetween, depletionForecast, formatDate, monthGridDays, parseDateKey, stockAtStartOfDate, toDateKey } from "../dateUtils";
import { formatAmount } from "../formatAmount";
import type { Medication } from "../types";

export interface CalendarPanelProps {
  visibleMonth: Date;
  selectedDate: string;
  today: Date;
  todayKey: string;
  medications: Medication[];
  appointmentDate: string | null;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDate: (dateKey: string) => void;
}

export function CalendarPanel({
  visibleMonth,
  selectedDate,
  today,
  todayKey,
  medications,
  appointmentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onSelectDate
}: CalendarPanelProps) {
  const calendarDays = monthGridDays(visibleMonth);

  return (
    <section className="panel calendar-panel">
      <div className="panel-heading calendar-heading">
        <div>
          <p className="section-kicker">SCHEDULE</p>
          <h2>カレンダー</h2>
        </div>
        <div className="calendar-controls">
          <button className="icon-button" aria-label="前の月" onClick={onPreviousMonth}><ChevronLeft size={18} /></button>
          <span className="month-label">{visibleMonth.getFullYear()}年{visibleMonth.getMonth() + 1}月</span>
          <button className="icon-button" aria-label="次の月" onClick={onNextMonth}><ChevronRight size={18} /></button>
          <button className="today-button" onClick={onToday}>今日</button>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-label={`${visibleMonth.getFullYear()}年${visibleMonth.getMonth() + 1}月`}>
        {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
          <div className={`weekday ${index === 0 ? "sunday" : ""} ${index === 6 ? "saturday" : ""}`} role="columnheader" key={day}>{day}</div>
        ))}
        {calendarDays.map((date) => {
          const dateKey = toDateKey(date);
          const inMonth = date.getMonth() === visibleMonth.getMonth();
          const isToday = dateKey === todayKey;
          const isAppointment = dateKey === appointmentDate;
          const depletedMeds = medications.filter((medication) => {
            const forecast = depletionForecast(medication);
            return forecast && toDateKey(forecast.date) === dateKey;
          });
          const isSelected = dateKey === selectedDate;
          return (
            <button
              type="button"
              role="gridcell"
              aria-label={`${formatDate(date, { month: "long", day: "numeric", weekday: "long" })}${isAppointment ? "、受診日" : ""}${depletedMeds.length ? "、お薬切れ予測日" : ""}`}
              aria-pressed={isSelected}
              key={dateKey}
              className={[
                "calendar-day",
                !inMonth && "outside-month",
                isToday && "is-today",
                isSelected && "is-selected",
                isAppointment && "has-appointment",
                depletedMeds.length > 0 && "has-depletion"
              ].filter(Boolean).join(" ")}
              onClick={() => onSelectDate(dateKey)}
            >
              <span className="day-number">{date.getDate()}</span>
              {isAppointment && <span className="day-event appointment-event">受診</span>}
              {depletedMeds.map((item) => (
                <span className="day-event depletion-event" key={item.id}>{item.name}切れ</span>
              ))}
            </button>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span><i className="legend-dot appointment-dot" />受診日</span>
        <span><i className="legend-dot depletion-dot" />お薬切れ予測</span>
        <span><i className="legend-dot today-dot" />今日</span>
      </div>
      <SelectedDay
        dateKey={selectedDate}
        today={today}
        todayKey={todayKey}
        medications={medications}
        appointmentDate={appointmentDate}
      />
    </section>
  );
}

function SelectedDay({ dateKey, today, todayKey, medications, appointmentDate }: {
  dateKey: string;
  today: Date;
  todayKey: string;
  medications: Medication[];
  appointmentDate: string | null;
}) {
  const date = parseDateKey(dateKey);
  const isPast = daysBetween(date, today) > 0;
  const depletionItems = medications.flatMap((medication) => {
    const forecast = depletionForecast(medication);
    return forecast && toDateKey(forecast.date) === dateKey
      ? [{ medication, forecast }]
      : [];
  });
  const stock = medications.map((medication) => ({
    medication,
    remaining: daysBetween(parseDateKey(medication.stockAsOf), date) < 0
      ? null
      : stockAtStartOfDate(medication, date)
  }));
  return (
    <div className="selected-day-panel">
      <div className="selected-day-heading">
        <strong>{formatDate(date, { month: "long", day: "numeric", weekday: "short" })}</strong>
        {dateKey === todayKey && <span className="today-pill">今日</span>}
      </div>
      {appointmentDate === dateKey && <p className="selected-event visit-selected"><CalendarDays size={14} />受診予定日</p>}
      {!isPast && depletionItems.map(({ medication, forecast }) => (
        <p className="selected-event depletion-selected" key={medication.id}>
          <Pill size={14} />{medication.name}が{forecast.period}ごろになくなる予測
        </p>
      ))}
      {medications.length > 0 ? (
        <div className="selected-stock-list">
          {stock.map(({ medication, remaining }) => (
            <div className="selected-stock-item" key={medication.id}>
              <span>{medication.name}</span>
              <strong>{remaining === null ? "—" : `${formatAmount(remaining)} 錠`}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="selected-empty">お薬を登録すると、この日の残数が表示されます。</p>
      )}
      {medications.length > 0 && stock.every((item) => item.remaining !== null) && (
        <p className="selected-footnote">この日・服用前の残数目安</p>
      )}
      {medications.length > 0 && stock.some((item) => item.remaining === null) && (
        <p className="selected-footnote">登録日より前の残数は計算できません</p>
      )}
    </div>
  );
}
