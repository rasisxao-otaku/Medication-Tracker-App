import { emptyAppData, type AppData, type DosePeriod, type Medication } from "./types";
import { dosePeriods } from "./types";

const STORAGE_KEY = "kusuri-nokori-data-v1";

function isDoseSchedule(value: unknown): value is Medication["schedule"] {
  if (typeof value !== "object" || value === null) return false;
  return dosePeriods.every((period) => {
    const amount = (value as Record<DosePeriod, unknown>)[period];
    return typeof amount === "number" && Number.isFinite(amount) && amount >= 0;
  });
}

function isMedication(value: unknown): value is Medication {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string"
    && typeof item.name === "string"
    && typeof item.stock === "number"
    && Number.isFinite(item.stock)
    && item.stock >= 0
    && typeof item.stockAsOf === "string"
    && (item.refillAtAppointment === undefined
      || (typeof item.refillAtAppointment === "number"
        && Number.isFinite(item.refillAtAppointment)
        && item.refillAtAppointment >= 0))
    && isDoseSchedule(item.schedule);
}

export function loadAppData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return emptyAppData;

  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("保存データの形式を確認できませんでした。");
  }
  const data = parsed as Record<string, unknown>;
  if (!Array.isArray(data.medications) || !data.medications.every(isMedication)) {
    throw new Error("保存データの形式を確認できませんでした。");
  }
  if (data.appointmentDate !== null && typeof data.appointmentDate !== "string") {
    throw new Error("保存データの形式を確認できませんでした。");
  }
  return {
    medications: data.medications,
    appointmentDate: data.appointmentDate
  };
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
