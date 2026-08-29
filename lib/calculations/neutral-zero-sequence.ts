/**
 * TODO(Power Quality): Neutral / Zero-sequence Analysis
 *
 * Facility 3상 전류 편차율 계산기에 영상분·중성선 식을 섞지 않습니다.
 * 비선형 단상부하와 triplen harmonic으로 중성선 전류가 커질 수 있다는 설명은
 * Reference 문서에만 두고, 계산기는 이후 Power Quality 영역에서 독립 구현합니다.
 */

/** 향후 Neutral / Zero-sequence Analysis 입력 후보. 지금은 계산하지 않습니다. */
export type NeutralZeroSequenceDraft = {
  ia?: number;
  ib?: number;
  ic?: number;
  in?: number;
  van?: number;
  vbn?: number;
  vcn?: number;
  thdi?: number;
  i3rd?: number;
};

export const NEUTRAL_ZERO_SEQUENCE_PLANNED_INPUTS = [
  "Ia",
  "Ib",
  "Ic",
  "In",
  "Phase-Neutral Voltage",
  "THDi",
  "3rd harmonic current",
] as const;
