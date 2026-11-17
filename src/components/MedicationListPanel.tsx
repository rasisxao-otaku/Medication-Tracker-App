import { Leaf, MoreHorizontal, Pill, Plus, Printer } from "lucide-react";
import { dailyDose, depletionForecast, formatDate } from "../dateUtils";
import { formatAmount } from "../formatAmount";
import { dosePeriods, type Medication } from "../types";
import type { MedicationStock } from "./SummaryCards";

export function MedicationListPanel({ medications, onAdd, onEdit, onPrint }: {
  medications: MedicationStock[];
  onAdd: () => void;
  onEdit: (medication: Medication) => void;
  onPrint: () => void;
}) {
  return (
    <section className="panel medication-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">YOUR MEDICINE</p>
          <h2>お薬リスト <span className="count-badge">{medications.length}</span></h2>
        </div>
        <div className="medication-panel-actions">
          {medications.length > 0 && (
            <button type="button" className="print-button" onClick={onPrint}><Printer size={15} />印刷 / PDF</button>
          )}
          <button className="icon-button add-small" aria-label="お薬を追加" onClick={onAdd}><Plus size={19} /></button>
        </div>
      </div>
      {medications.length === 0 ? (
        <div className="empty-state">
          <span className="empty-illustration"><Pill size={26} /></span>
          <p>お薬を登録すると<br />残数の目安を確認できます</p>
          <button className="text-button" onClick={onAdd}><Plus size={16} />最初のお薬を追加</button>
        </div>
      ) : (
        <div className="medication-list">
          {medications.map(({ medication, remaining }, index) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              remaining={remaining}
              index={index}
              onEdit={() => onEdit(medication)}
            />
          ))}
        </div>
      )}
      <p className="estimate-note"><Leaf size={14} />残数は設定した服用量からの目安です</p>
    </section>
  );
}

function MedicationCard({ medication, remaining, index, onEdit }: {
  medication: Medication;
  remaining: number;
  index: number;
  onEdit: () => void;
}) {
  const forecast = depletionForecast(medication);
  const totalDose = dailyDose(medication);
  const remainingDays = totalDose > 0 ? Math.floor(remaining / totalDose) : 0;
  const percent = medication.stock > 0 ? Math.max(0, Math.min(100, (remaining / Math.max(medication.stock, 1)) * 100)) : 0;
  return (
    <article className="medication-card">
      <div className="medicine-topline">
        <span className={`medicine-symbol medicine-symbol-${index % 3}`}><Pill size={17} /></span>
        <div className="medicine-name-wrap">
          <h3>{medication.name}</h3>
          <p>{dosePeriods.filter((period) => medication.schedule[period] > 0)
            .map((period) => `${period} ${formatAmount(medication.schedule[period])}錠`).join(" ・ ")}</p>
        </div>
        <button className="icon-button card-menu" aria-label={`${medication.name}を編集または削除`} onClick={onEdit}><MoreHorizontal size={19} /></button>
      </div>
      <div className="stock-row">
        <div><strong>{formatAmount(remaining)}</strong><span> / {formatAmount(medication.stock)}錠</span></div>
        <span className="stock-days">{remaining === 0 ? "残数なし" : `約${remainingDays}日分`}</span>
      </div>
      <div className="stock-track"><span style={{ width: `${percent}%` }} /></div>
      <div className="medicine-bottom">
        <span>{forecast ? `${formatDate(forecast.date)} ${forecast.period}ごろ` : "服用量未設定"}</span>
        <button className="edit-link" onClick={onEdit}>在庫を更新</button>
      </div>
    </article>
  );
}
