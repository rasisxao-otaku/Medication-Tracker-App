import { dailyDose, depletionForecast, formatDate } from "../dateUtils";
import { formatAmount } from "../formatAmount";
import { dosePeriods } from "../types";
import type { MedicationStock } from "./SummaryCards";

export function MedicationPrintSheet({ medications, generatedAt }: {
  medications: MedicationStock[];
  generatedAt: Date;
}) {
  return (
    <section className="medication-print-sheet">
      <h1>お薬リスト</h1>
      <p className="medication-print-meta">
        作成日: {formatDate(generatedAt, { year: "numeric", month: "long", day: "numeric" })}
        <span>残数は今日・服用前の目安です</span>
      </p>
      <table className="medication-print-table">
        <thead>
          <tr>
            <th scope="col">お薬の名前</th>
            {dosePeriods.map((period) => <th scope="col" key={period}>{period}</th>)}
            <th scope="col">1日量</th>
            <th scope="col">現在の残数</th>
            <th scope="col">薬切れ予測</th>
          </tr>
        </thead>
        <tbody>
          {medications.map(({ medication, remaining }) => {
            const forecast = depletionForecast(medication);
            return (
              <tr key={medication.id}>
                <th scope="row">{medication.name}</th>
                {dosePeriods.map((period) => (
                  <td key={period}>{formatAmount(medication.schedule[period])}錠</td>
                ))}
                <td>{formatAmount(dailyDose(medication))}錠</td>
                <td>{formatAmount(remaining)}錠</td>
                <td>{forecast ? `${formatDate(forecast.date)} ${forecast.period}ごろ` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="medication-print-disclaimer">
        この一覧の残数・薬切れ日は、登録された残数と服用量から計算した目安です。実際の服用内容や残数は、医療機関・薬局でご確認ください。
      </p>
    </section>
  );
}
