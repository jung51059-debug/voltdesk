import { z } from "zod";

export function parseNumber(raw: string | number | undefined, label: string): number {
  if (raw === undefined || raw === "") {
    throw new FieldError("required", `${label}을(를) 입력하세요.`, label);
  }
  const value = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, "").trim());
  if (!Number.isFinite(value)) {
    throw new FieldError("nan", `${label}은(는) 숫자여야 합니다.`, label);
  }
  return value;
}

export class FieldError extends Error {
  readonly code: string;
  readonly fieldLabel: string;

  constructor(code: string, message: string, fieldLabel: string) {
    super(message);
    this.code = code;
    this.fieldLabel = fieldLabel;
  }
}

export const positiveNumber = (label: string, max = 1e12) =>
  z
    .number({ error: `${label}을(를) 입력하세요.` })
    .finite()
    .gt(0, { message: `${label}은(는) 0보다 커야 합니다.` })
    .lte(max, { message: `${label}이(가) 허용 범위를 초과했습니다.` });

export const unitInterval = (label: string) =>
  z
    .number({ error: `${label}을(를) 입력하세요.` })
    .finite()
    .gt(0, { message: `${label}은(는) 0보다 커야 합니다.` })
    .lte(1, { message: `${label}은(는) 1 이하여야 합니다.` });

export const percentFraction = (label: string) =>
  z
    .number({ error: `${label}을(를) 입력하세요.` })
    .finite()
    .gte(0, { message: `${label}은(는) 0 이상이어야 합니다.` })
    .lte(1, { message: `${label}은(는) 1 이하여야 합니다.` });
