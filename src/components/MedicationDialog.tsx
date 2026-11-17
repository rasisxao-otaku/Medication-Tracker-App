import { Leaf, Pill, X } from "lucide-react";
import type { FormEvent } from "react";
import { dosePeriods, type DosePeriod, type Medication } from "../types";

export interface MedicationDraft {
  id?: string;
  name: string;
  stock: string;
  schedule: Record<DosePeriod, string>;
}

export function newMedicationDraft(medication?: Medication): MedicationDraft {
  return medication
    ? {
        id: medication.id,
        name: medication.name,
        stock: String(medication.stock),
        schedule: {
          朝: String(medication.schedule.朝),
          昼: String(medication.schedule.昼),
          夜: String(medication.schedule.夜)
        }
      }
    : { name: "", stock: "", schedule: { 朝: "0", 昼: "0", 夜: "0" } };
}

export interface MedicationDialogProps {
  open: boolean;
  editingMedication: Medication | null;
  draft: MedicationDraft;
  formError: string;
  onNameChange: (name: string) => void;
  onStockChange: (stock: string) => void;
  onScheduleChange: (period: DosePeriod, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onDelete: () => void;
}

export function MedicationDialog({
  open,
  editingMedication,
  draft,
  formError,
  onNameChange,
  onStockChange,
  onScheduleChange,
  onSubmit,
  onClose,
  onDelete
}: MedicationDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="medication-form-title">
        <div className="modal-heading">
          <div className="modal-icon"><Pill size={21} /></div>
          <div>
            <p className="section-kicker">{editingMedication ? "UPDATE MEDICINE" : "ADD MEDICINE"}</p>
            <h2 id="medication-form-title">{editingMedication ? "お薬の情報を変更" : "お薬を追加"}</h2>
          </div>
          <button className="icon-button modal-close" aria-label="閉じる" onClick={onClose}><X size={19} /></button>
        </div>
        <form onSubmit={onSubmit}>
          <label className="field-label" htmlFor="medicine-name">お薬の名前</label>
          <input
            id="medicine-name"
            autoFocus
            className="text-input"
            placeholder="例：朝のお薬"
            value={draft.name}
            onChange={(event) => onNameChange(event.target.value)}
            required
          />
          <label className="field-label stock-label" htmlFor="medicine-stock">今ある錠数</label>
          <div className="number-input-wrap">
            <input
              id="medicine-stock"
              className="text-input"
              type="number"
              min="0"
              step="0.5"
              placeholder="例：30"
              value={draft.stock}
              onChange={(event) => onStockChange(event.target.value)}
              required
            />
            <span>錠</span>
          </div>
          <p className="field-help">今日の服用前の残数を入力してください</p>

          <fieldset className="schedule-fieldset">
            <legend>1回に飲む量</legend>
            <div className="schedule-inputs">
              {dosePeriods.map((period) => (
                <label className="dose-input" key={period}>
                  <span className={`period-chip period-${period}`}>{period}</span>
                  <span className="dose-number-wrap">
                    <input
                      aria-label={`${period}の服用量`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={draft.schedule[period]}
                      onChange={(event) => onScheduleChange(period, event.target.value)}
                    />
                    <small>錠</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="estimate-callout"><Leaf size={15} />服用を毎日続けた場合の目安を計算します</p>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="modal-actions">
            {editingMedication && (
              <button type="button" className="delete-button" onClick={onDelete}>削除</button>
            )}
            <button type="button" className="cancel-button" onClick={onClose}>キャンセル</button>
            <button type="submit" className="primary-button save-button">{editingMedication ? "変更を保存" : "追加する"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
