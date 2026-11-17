import { CalendarDays, Clock3, Pill } from "lucide-react";
import { daysBetween, depletionForecast, formatDate, parseDateKey } from "../dateUtils";
import { formatAmount } from "../formatAmount";
import type { Medication } from "../types";

export type MedicationStock = { medication: Medication; remaining: number };
export type AppointmentStock = { medication: Medication; remaining: number | null };
export type DepletionItem = {
  medication: Medication;
  forecast: NonNullable<ReturnType<typeof depletionForecast>>;
};

export function MedicationStockSummary({ medications }: { medications: MedicationStock[] }) {
  return (
    <section className="summary-card stock-summary">
      <div className="summary-card-heading">
        <span className="summary-icon green"><Pill size={19} /></span>
        <div className="summary-text">
          <span className="summary-label">薬別の残薬</span>
          <span className="summary-detail">今日・服用前の目安</span>
        </div>
      </div>
      {medications.length > 0 ? (
        <ul className="stock-breakdown">
          {medications.map(({ medication, remaining }) => (
            <li key={medication.id}>
              <span title={medication.name}>{medication.name}</span>
              <strong>{formatAmount(remaining)} <small>錠</small></strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="stock-summary-empty">お薬を登録すると種類別に表示します</p>
      )}
    </section>
  );
}

export function AppointmentStockSummary({ appointmentDate, medications }: {
  appointmentDate: string | null;
  medications: AppointmentStock[] | null;
}) {
  return (
    <section className="summary-card stock-summary appointment-summary">
      <div className="summary-card-heading">
        <span className="summary-icon lavender"><CalendarDays size={19} /></span>
        <div className="summary-text">
          <span className="summary-label">次回受診日の薬別残薬</span>
          <span className="summary-detail">
            {appointmentDate
              ? formatDate(parseDateKey(appointmentDate), { month: "long", day: "numeric" })
              : "受診日を登録できます"}
          </span>
        </div>
      </div>
      {!appointmentDate ? (
        <p className="stock-summary-empty">受診日を登録すると薬ごとの残数を確認できます</p>
      ) : medications ? (
        medications.length > 0 ? (
          <ul className="stock-breakdown">
            {medications.map(({ medication, remaining }) => (
              <li key={medication.id}>
                <span title={medication.name}>{medication.name}</span>
                <strong>{remaining === null ? "—" : formatAmount(remaining)} <small>{remaining === null ? "" : "錠"}</small></strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="stock-summary-empty">お薬を登録すると残数を確認できます</p>
        )
      ) : (
        <p className="stock-summary-empty">受診日が過ぎているため、予測できません</p>
      )}
      {medications?.some((item) => item.remaining === null) && (
        <p className="appointment-stock-note">薬の登録日より前は計算できません</p>
      )}
    </section>
  );
}

export function UpcomingDepletions({ items, today }: { items: DepletionItem[]; today: Date }) {
  const [first, ...later] = items;
  return (
    <section className="summary-card depletion-summary">
      <div className="depletion-summary-heading">
        <span className="summary-icon peach"><Clock3 size={19} /></span>
        <div className="summary-text">
          <span className="summary-label">次に切れるお薬</span>
          <span className="summary-detail">切れる日が近い順・最大3種類</span>
        </div>
      </div>
      {first ? (
        <div className="depletion-summary-items">
          <article className="depletion-featured">
            <div className="depletion-rank">1</div>
            <div className="depletion-featured-info">
              <strong title={first.medication.name}>{first.medication.name}</strong>
              <span>{formatDate(first.forecast.date)} {first.forecast.period}ごろ</span>
            </div>
            <strong className="depletion-countdown">{depletionCountdown(first.forecast.date, today)}</strong>
          </article>
          {later.length > 0 && (
            <div className="depletion-secondary-list">
              {later.map(({ medication, forecast }, index) => (
                <div className="depletion-secondary" key={medication.id}>
                  <span className="depletion-secondary-rank">{index + 2}</span>
                  <span className="depletion-secondary-name" title={medication.name}>{medication.name}</span>
                  <span className="depletion-secondary-date">{formatDate(forecast.date, { month: "numeric", day: "numeric" })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="depletion-summary-empty">服用設定から自動で計算します</p>
      )}
    </section>
  );
}

function depletionCountdown(date: Date, today: Date): string {
  const days = daysBetween(today, date);
  if (days === 0) return "今日";
  if (days === 1) return "明日";
  return `あと ${days} 日`;
}
