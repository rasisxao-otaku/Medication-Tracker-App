export const dosePeriods = ["朝", "昼", "夜"] as const;

export type DosePeriod = (typeof dosePeriods)[number];
export type DoseSchedule = Record<DosePeriod, number>;

export interface Medication {
  id: string;
  name: string;
  stock: number;
  stockAsOf: string;
  schedule: DoseSchedule;
  refillAtAppointment?: number;
}

export interface AppData {
  medications: Medication[];
  appointmentDate: string | null;
}

export const emptyAppData: AppData = {
  medications: [],
  appointmentDate: null
};
