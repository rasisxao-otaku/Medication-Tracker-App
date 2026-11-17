import { Flower2, Pill, Plus } from "lucide-react";
import type { DosePeriod, Medication } from "../types";
import { AppointmentPanel, type AppointmentPanelProps } from "./AppointmentPanel";
import { CalendarPanel, type CalendarPanelProps } from "./CalendarPanel";
import { MedicationDialog, type MedicationDialogProps } from "./MedicationDialog";
import { MedicationListPanel } from "./MedicationListPanel";
import { MedicationPrintSheet } from "./MedicationPrintSheet";
import { AppointmentStockSummary, MedicationStockSummary, UpcomingDepletions, type AppointmentStock, type DepletionItem, type MedicationStock } from "./SummaryCards";

export interface DashboardProps {
  today: Date;
  todayKey: string;
  storageError: string;
  summary: {
    currentStocks: MedicationStock[];
    appointmentDate: string | null;
    stocksAtAppointment: AppointmentStock[] | null;
    upcomingDepletions: DepletionItem[];
  };
  calendar: Omit<CalendarPanelProps, "today" | "todayKey">;
  medicationList: {
    medications: MedicationStock[];
    onAdd: () => void;
    onEdit: (medication: Medication) => void;
    onPrint: () => void;
  };
  appointment: AppointmentPanelProps;
  medicationDialog: MedicationDialogProps & {
    onScheduleChange: (period: DosePeriod, value: string) => void;
  };
}

export function Dashboard({
  today,
  todayKey,
  storageError,
  summary,
  calendar,
  medicationList,
  appointment,
  medicationDialog
}: DashboardProps) {
  const daysUntilAppointment = appointment.daysUntilAppointment;
  const hasPastAppointment = summary.appointmentDate !== null
    && daysUntilAppointment !== null
    && daysUntilAppointment < 0;

  return (
    <>
      <main className="app-shell">
        <header className="topbar">
          <a className="brand" href="#" aria-label="くすりのこり ホーム">
            <span className="brand-mark"><Pill size={21} strokeWidth={2.2} /></span>
            <span>くすりのこり</span>
          </a>
          <div className="topbar-right">
            <span className="offline-badge"><span />オフラインで利用できます</span>
          </div>
        </header>

        <section className="welcome-row">
          <div>
            <p className="eyebrow">{new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(today)}</p>
            <p className="welcome-copy">残数の目安と次の受診日を、カレンダーで確認できます。</p>
          </div>
          <button className="primary-button add-medication-button" onClick={medicationList.onAdd}>
            <Plus size={18} />お薬を追加
          </button>
        </section>

        {storageError && <div className="storage-warning" role="alert">{storageError}</div>}

        <section className="summary-grid" aria-label="残薬サマリー">
          <MedicationStockSummary medications={summary.currentStocks} />
          <AppointmentStockSummary
            appointmentDate={summary.appointmentDate}
            medications={summary.stocksAtAppointment}
          />
          <UpcomingDepletions items={summary.upcomingDepletions} today={today} />
        </section>

        {hasPastAppointment && (
          <div className="inline-notice" role="status">登録した受診日は過ぎています。新しい受診日を設定してください。</div>
        )}

        <div className="content-grid">
          <CalendarPanel {...calendar} today={today} todayKey={todayKey} />
          <aside className="side-column">
            <MedicationListPanel {...medicationList} />
            <AppointmentPanel {...appointment} />
            <div className="privacy-note"><Flower2 size={15} /><span>データはこの端末内に保存されます。<br />外部へ送信されることはありません。</span></div>
          </aside>
        </div>

        <footer className="app-footer">服用量や残数は、必要に応じて医療機関・薬局でご確認ください。</footer>
        <MedicationDialog {...medicationDialog} />
      </main>
      <MedicationPrintSheet medications={summary.currentStocks} generatedAt={today} />
    </>
  );
}
