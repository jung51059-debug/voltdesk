/**
 * 향후 계정·Pro·관리자 API 계약.
 * MVP는 클라이언트에서 계산하고 localStorage만 사용합니다.
 */
export type FutureUserRole = "guest" | "registered" | "pro" | "admin";

export interface PreferenceApi {
  get(): Promise<unknown>;
  put(body: unknown): Promise<void>;
}

export interface HistoryApi {
  list(projectId?: string): Promise<unknown[]>;
  save(entry: unknown): Promise<void>;
}

export interface ProjectApi {
  list(): Promise<unknown[]>;
  create(body: unknown): Promise<{ id: string }>;
}

export interface ArticleCmsApi {
  list(): Promise<unknown[]>;
  publish(id: string): Promise<void>;
}
