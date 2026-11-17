import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { daysBetween, depletionForecast, parseDateKey, stockAtStartOfDate, toDateKey } from "./dateUtils";
import { Dashboard } from "./components/Dashboard";
import { newMedicationDraft, type MedicationDraft } from "./components/MedicationDialog";
import { loadAppData, saveAppData } from "./storage";
import { dosePeriods, emptyAppData, type AppData, type DosePeriod, type Medication } from "./types";

function App() {
  const [today, setToday] = useState(() => new Date());
  const todayKey = toDateKey(today);
  const [initialLoad] = useState(() => {
    try {
      return { data: loadAppData(), error: "" };
    } catch (error) {
      console.error("保存データを読み込めませんでした。", error);
      return { data: emptyAppData, error: "保存データを読み込めませんでした。データを変更して保存するまで、既存データは上書きしません。" };
    }
  });
  const [data, setData] = useState<AppData>(initialLoad.data);
  const [storageError, setStorageError] = useState(initialLoad.error);
  const isInitialRender = useRef(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [draft, setDraft] = useState<MedicationDraft>(() => newMedicationDraft());
  const [formError, setFormError] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [appointmentInput, setAppointmentInput] = useState(data.appointmentDate ?? "");
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = new Date();
      setToday((previous) => toDateKey(previous) === toDateKey(current) ? previous : current);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    try {
      saveAppData(data);
      setStorageError("");
    } catch (error) {
      console.error("保存データを書き込めませんでした。", error);
      setStorageError("端末に保存できませんでした。ブラウザのストレージ設定をご確認ください。");
    }
  }, [data]);

  const currentStocks = useMemo(
    () => data.medications.map((medication) => ({
      medication,
      remaining: stockAtStartOfDate(medication, today)
    })),
    [data.medications]
  );
  const upcomingDepletions = currentStocks
    .map(({ medication, remaining }) => ({ medication, remaining, forecast: depletionForecast(medication) }))
    .filter((item): item is {
      medication: Medication;
      remaining: number;
      forecast: NonNullable<ReturnType<typeof depletionForecast>>;
    } => item.remaining > 0 && item.forecast !== null)
    .sort((a, b) => daysBetween(today, a.forecast.date) - daysBetween(today, b.forecast.date))
    .slice(0, 3);
  const daysUntilAppointment = data.appointmentDate
    ? daysBetween(today, parseDateKey(data.appointmentDate))
    : null;
  const stocksAtAppointment = data.appointmentDate && daysUntilAppointment !== null && daysUntilAppointment >= 0
    ? data.medications.map((medication) => ({
        medication,
        remaining: daysBetween(parseDateKey(medication.stockAsOf), parseDateKey(data.appointmentDate!)) < 0
          ? null
          : stockAtStartOfDate(medication, parseDateKey(data.appointmentDate!))
      }))
    : null;
  const postVisitForecast = stocksAtAppointment?.map(({ medication, remaining }) => {
    const stockAfterVisit = remaining === null
      ? null
      : remaining + (medication.refillAtAppointment ?? 0);
    const forecast = stockAfterVisit !== null && stockAfterVisit > 0
      ? depletionForecast({
          ...medication,
          stock: stockAfterVisit,
          stockAsOf: data.appointmentDate!
        })
      : null;
    return { medication, remaining, stockAfterVisit, forecast };
  }) ?? null;
  const earliestPostVisitDepletion = postVisitForecast
    ?.filter((item) => item.forecast !== null)
    .sort((a, b) => a.forecast!.date.getTime() - b.forecast!.date.getTime())[0] ?? null;

  function openNewMedication() {
    setEditingMedication(null);
    setDraft(newMedicationDraft());
    setFormError("");
    setDialogOpen(true);
  }

  function openEditMedication(medication: Medication) {
    setEditingMedication(medication);
    setDraft(newMedicationDraft(medication));
    setFormError("");
    setDialogOpen(true);
  }

  function saveMedication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.name.trim();
    const stock = Number(draft.stock);
    const schedule = {
      朝: Number(draft.schedule.朝),
      昼: Number(draft.schedule.昼),
      夜: Number(draft.schedule.夜)
    };
    if (!name || !Number.isFinite(stock) || stock < 0
      || dosePeriods.some((period) => !Number.isFinite(schedule[period]) || schedule[period] < 0)
      || Object.values(schedule).every((amount) => amount === 0)) {
      setFormError("薬の名前・残数・1回量を確認してください。1日の服用量は0にできません。");
      return;
    }

    const medication: Medication = {
      id: editingMedication?.id ?? crypto.randomUUID(),
      name,
      stock,
      stockAsOf: todayKey,
      schedule,
      refillAtAppointment: editingMedication?.refillAtAppointment ?? 0
    };
    setData((current) => ({
      ...current,
      medications: editingMedication
        ? current.medications.map((item) => item.id === medication.id ? medication : item)
        : [...current.medications, medication]
    }));
    setDialogOpen(false);
  }

  function removeMedication(id: string) {
    const medication = data.medications.find((item) => item.id === id);
    if (!medication || !window.confirm(`「${medication.name}」を削除しますか？`)) return;
    setData((current) => ({
      ...current,
      medications: current.medications.filter((item) => item.id !== id)
    }));
  }

  function saveAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setData((current) => ({
      ...current,
      appointmentDate: appointmentInput || null
    }));
    setShowAppointmentForm(false);
  }

  function openAppointmentForm() {
    setAppointmentInput(data.appointmentDate ?? "");
    setShowAppointmentForm(true);
  }

  function removeAppointment() {
    setData((current) => ({ ...current, appointmentDate: null }));
    setAppointmentInput("");
    setShowAppointmentForm(false);
  }

  function updateRefillAmount(medicationId: string, value: string) {
    const amount = value === "" ? 0 : Number(value);
    if (!Number.isFinite(amount) || amount < 0) return;
    setData((current) => ({
      ...current,
      medications: current.medications.map((medication) => medication.id === medicationId
        ? { ...medication, refillAtAppointment: amount }
        : medication)
    }));
  }

  function updateSchedule(period: DosePeriod, value: string) {
    setDraft((current) => ({
      ...current,
      schedule: { ...current.schedule, [period]: value }
    }));
  }

  return (
    <Dashboard
      today={today}
      todayKey={todayKey}
      storageError={storageError}
      summary={{
        currentStocks,
        appointmentDate: data.appointmentDate,
        stocksAtAppointment,
        upcomingDepletions
      }}
      calendar={{
        visibleMonth,
        selectedDate,
        medications: data.medications,
        appointmentDate: data.appointmentDate,
        onPreviousMonth: () => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1)),
        onNextMonth: () => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1)),
        onToday: () => {
          setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
          setSelectedDate(todayKey);
        },
        onSelectDate: setSelectedDate
      }}
      medicationList={{
        medications: currentStocks,
        onAdd: openNewMedication,
        onEdit: openEditMedication,
        onPrint: () => window.print()
      }}
      appointment={{
        appointmentDate: data.appointmentDate,
        daysUntilAppointment,
        appointmentInput,
        showAppointmentForm,
        postVisitForecast: postVisitForecast ?? [],
        earliestDepletion: earliestPostVisitDepletion?.forecast ?? null,
        onInputChange: setAppointmentInput,
        onSave: saveAppointment,
        onOpenForm: openAppointmentForm,
        onCancelForm: () => setShowAppointmentForm(false),
        onRemoveAppointment: removeAppointment,
        onRefillAmountChange: updateRefillAmount
      }}
      medicationDialog={{
        open: dialogOpen,
        editingMedication,
        draft,
        formError,
        onNameChange: (name) => setDraft((current) => ({ ...current, name })),
        onStockChange: (stock) => setDraft((current) => ({ ...current, stock })),
        onScheduleChange: updateSchedule,
        onSubmit: saveMedication,
        onClose: () => setDialogOpen(false),
        onDelete: () => {
          if (!editingMedication) return;
          setDialogOpen(false);
          removeMedication(editingMedication.id);
        }
      }}
    />
  );
}

export default App;
