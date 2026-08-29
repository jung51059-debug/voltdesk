import { readJson, writeJson } from "@/lib/storage/local";

/**
 * 현장 측정 공통 기록. 현재는 브라우저 localStorage만 사용합니다.
 * Project / Equipment / Inspection History / Trend / PDF Report 연결은 Phase C에서 붙입니다.
 */
export type MeasurementRecord = {
  version: 1;
  id: string;
  equipmentName: string;
  equipmentType: string;
  measurementType: string;
  measuredAt: string;
  designValue?: number;
  measuredValue: number;
  unit: string;
  tolerance?: number;
  note?: string;
  /** 향후 Project 연결용. 현재 UI에서는 쓰지 않습니다. */
  projectId?: string;
  /** 향후 Equipment 마스터 연결용. */
  equipmentId?: string;
};

export const MEASUREMENT_STORAGE_KEY = "ampory:measurement-records";

export function createMeasurementRecord(
  input: Omit<MeasurementRecord, "version" | "id"> & { id?: string },
): MeasurementRecord {
  return {
    version: 1,
    id: input.id ?? `msr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    equipmentName: input.equipmentName,
    equipmentType: input.equipmentType,
    measurementType: input.measurementType,
    measuredAt: input.measuredAt,
    designValue: input.designValue,
    measuredValue: input.measuredValue,
    unit: input.unit,
    tolerance: input.tolerance,
    note: input.note,
    projectId: input.projectId,
    equipmentId: input.equipmentId,
  };
}

export function loadMeasurementRecords(): MeasurementRecord[] {
  return readJson<MeasurementRecord[]>(MEASUREMENT_STORAGE_KEY, []);
}

export function saveMeasurementRecords(records: MeasurementRecord[]) {
  writeJson(MEASUREMENT_STORAGE_KEY, records);
}
