import { CalendarDays, Clock3, Plus, Settings2 } from "lucide-react";
import { depletionForecast, formatDate, parseDateKey } from "../dateUtils";
import { formatAmount } from "../formatAmount";
import type { FormEvent } from "react";
import type { Medication } from "../types";

export type PostVisitMedication = {
  medication: Medication;
  remaining: number | null;
  stockAfterVisit: number | null;
  forecast: ReturnType<typeof depletionForecast>;
};

export interface AppointmentPanelProps {
  appointmentDate: string | null;
  daysUntilAppointment: number | null;
  appointmentInput: string;
  showAppointmentForm: boolean;
  postVisitForecast: PostVisitMedication[];
  earliestDepletion: ReturnType<typeof depletionForecast>;
  onInputChange: (value: string) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onOpenForm: () => void;
  onCancelForm: () => void;
  onRemoveAppointment: () => void;
  onRefillAmountChange: (medicationId: string, value: string) => void;
}

export function AppointmentPanel({
  appointmentDate,
  daysUntilAppointment,
  appointmentInput,
  showAppointmentForm,
  postVisitForecast,
  earliestDepletion,
  onInputChange,
  onSave,
  onOpenForm,
  onCancelForm,
  onRemoveAppointment,
  onRefillAmountChange
}: AppointmentPanelProps) {
  return (
    <section className="panel appointment-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">NEXT VISIT</p>
          <h2>次回の受診</h2>
        </div>
        <span className="visit-icon"><CalendarDays size={19} /></span>
      </div>
      {appointmentDate ? (
        <div className="appointment-info">
          <div>
            <strong>{formatDate(parseDateKey(appointmentDate), { year: "numeric", month: "long", day: "numeric" })}</strong>
            <span>{daysUntilAppointment === 0 ? "今日" : daysUntilAppointment !== null && daysUntilAppointment > 0 ? `あと ${daysUntilAppointment} 日` : "日付を確認してください"}</span>
          </div>
          <button className="text-button edit-appointment" onClick={onOpenForm}><Settings2 size={15} />変更</button>
        </div>
      ) : (
        <p className="appointment-empty">受診日を登録すると、受診時の残数を確認できます。</p>
      )}
      {!showAppointmentForm ? (
        <button className="appointment-action" onClick={onOpenForm}>
          <Plus size={16} />{appointmentDate ? "受診日を変更" : "受診日を登録"}
        </button>
      ) : (
        <form className="appointment-form" onSubmit={onSave}>
          <label htmlFor="appointment-date">受診日</label>
          <input id="appointment-date" type="date" value={appointmentInput} onChange={(event) => onInputChange(event.target.value)} />
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onCancelForm}>キャンセル</button>
            <button type="submit" className="primary-button compact-button">保存</button>
          </div>
          {appointmentDate && <button type="button" className="remove-appointment" onClick={onRemoveAppointment}>受診日を削除</button>}
        </form>
      )}
      {appointmentDate && daysUntilAppointment !== null && daysUntilAppointment >= 0 && (
        <PostVisitForecast
          appointmentDate={appointmentDate}
          items={postVisitForecast}
          earliestDepletion={earliestDepletion}
          onRefillAmountChange={onRefillAmountChange}
        />
      )}
    </section>
  );
}

function PostVisitForecast({ appointmentDate, items, earliestDepletion, onRefillAmountChange }: {
  appointmentDate: string;
  items: PostVisitMedication[];
  earliestDepletion: ReturnType<typeof depletionForecast>;
  onRefillAmountChange: (medicationId: string, value: string) => void;
}) {
  const totalAfterVisit = items.reduce((total, item) => total + (item.stockAfterVisit ?? 0), 0);
  const hasUnknownBalance = items.some((item) => item.stockAfterVisit === null);
  const appointment = parseDateKey(appointmentDate);

  return (
    <section className="post-visit-forecast" aria-label="受診後の残薬見込み">
      <div className="post-visit-heading">
        <div>
          <strong>受診後の見込み</strong>
          <p>受診日に受け取る量を薬ごとに入力</p>
        </div>
        <CalendarDays size={16} />
      </div>
      {items.length > 0 ? (
        <div className="post-visit-list">
          {items.map(({ medication, remaining, stockAfterVisit, forecast }) => (
            <article className="post-visit-item" key={medication.id}>
              <div className="post-visit-item-heading">
                <strong title={medication.name}>{medication.name}</strong>
                <label>
                  <span>受取予定</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    aria-label={`${medication.name}の受診時受取予定量`}
                    value={medication.refillAtAppointment ?? 0}
                    onChange={(event) => onRefillAmountChange(medication.id, event.target.value)}
                  />
                  <small>錠</small>
                </label>
              </div>
              <div className="post-visit-calculation">
                <span>
                  受診時 {remaining === null ? "—" : `${formatAmount(remaining)}錠`}
                  <span className="calculation-operator">＋</span>
                  {formatAmount(medication.refillAtAppointment ?? 0)}錠
                </span>
                <strong>
                  {stockAfterVisit === null ? "残数を計算できません" : `受診後 ${formatAmount(stockAfterVisit)}錠`}
                </strong>
              </div>
              <p className="post-visit-depletion">
                {stockAfterVisit === null
                  ? "薬の登録日より前のため、受診後の予測はできません"
                  : forecast
                    ? `${formatDate(forecast.date)} ${forecast.period}ごろに薬切れ予測`
                    : stockAfterVisit === 0
                      ? "受診後の残数がありません"
                      : "薬切れ日を計算できません"}
              </p>
            </article>
          ))}
          <div className="post-visit-total">
            <span>{hasUnknownBalance ? "受診後の合計（計算可能分）" : "受診後の合計残数"}</span>
            <strong>{formatAmount(totalAfterVisit)} <small>錠</small></strong>
          </div>
          {hasUnknownBalance && <p className="post-visit-note">一部の薬は登録日より前のため、合計に含まれていません。</p>}
          {earliestDepletion && (
            <p className="post-visit-next">
              <Clock3 size={14} />
              次回の受診目安: {formatDate(earliestDepletion.date)} {earliestDepletion.period}ごろ
            </p>
          )}
        </div>
      ) : (
        <p className="post-visit-empty">お薬を登録すると受診後の見込みを確認できます。</p>
      )}
      <p className="post-visit-disclaimer">
        {formatDate(appointment, { month: "long", day: "numeric" })}の服用前残数に受取予定量を加算した目安です。設定した服用量を毎日続ける前提です。
      </p>
    </section>
  );
}
