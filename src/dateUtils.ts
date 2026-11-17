import type { DosePeriod, Medication } from "./types";
import { dosePeriods } from "./types";

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

export function daysBetween(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000);
}

export function dailyDose(medication: Medication): number {
  return dosePeriods.reduce((total, period) => total + medication.schedule[period], 0);
}

export function stockAtStartOfDate(medication: Medication, date: Date): number {
  const elapsedDays = daysBetween(parseDateKey(medication.stockAsOf), date);
  if (elapsedDays <= 0) return medication.stock;
  return Math.max(0, medication.stock - elapsedDays * dailyDose(medication));
}

export interface DepletionForecast {
  date: Date;
  period: DosePeriod;
}

export function depletionForecast(medication: Medication): DepletionForecast | null {
  const totalPerDay = dailyDose(medication);
  if (medication.stock <= 0 || totalPerDay <= 0) return null;

  const fullDaysBeforeDepletion = Math.ceil(medication.stock / totalPerDay) - 1;
  let stockAtStart = medication.stock - fullDaysBeforeDepletion * totalPerDay;

  for (const period of dosePeriods) {
    const amount = medication.schedule[period];
    if (amount <= 0) continue;
    if (stockAtStart <= amount + Number.EPSILON) {
      return {
        date: addDays(parseDateKey(medication.stockAsOf), fullDaysBeforeDepletion),
        period
      };
    }
    stockAtStart -= amount;
  }
  return null;
}

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("ja-JP", options ?? {
    month: "long",
    day: "numeric"
  }).format(date);
}

export function monthGridDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(firstDay, -firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

