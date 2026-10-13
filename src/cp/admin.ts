import { apiClient } from "./client";
import type { AdminAuditLogEntry, AdminConfigEntry, AdminConfigUpdate, AdminConfigValue, AdminUser } from "./types";

export class AdminValidationError extends TypeError {
  constructor(message: string) { super(message); this.name = "AdminValidationError"; }
}

export interface AdminUserSearch {
  search?: string;
  suspended?: boolean;
  limit?: number;
  offset?: number;
}

function requiredSegment(value: string, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) throw new AdminValidationError(`${name} must not be empty`);
  return encodeURIComponent(value);
}

function validatePage(limit: number | undefined, offset: number | undefined, maxLimit: number): void {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > maxLimit)) {
    throw new AdminValidationError(`limit must be an integer between 1 and ${maxLimit}`);
  }
  if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
    throw new AdminValidationError("offset must be a non-negative integer");
  }
}

function validateConfigValue(value: AdminConfigValue): void {
  if (typeof value === "string") return;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return;
    throw new AdminValidationError("Configuration number must be finite");
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminValidationError("Configuration value must be a string, finite number, or object");
  }
  try { JSON.stringify(value); }
  catch { throw new AdminValidationError("Configuration object must be JSON serializable"); }
}

const queryString = (values: Record<string, string | number | boolean | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined) params.set(key, String(value));
  const query = params.toString();
  return query ? `?${query}` : "";
};

/** Admin endpoints are protected by the backend's require_admin dependency. */
export const adminApi = {
  listConfig: () => apiClient.get<AdminConfigEntry[]>("/admin/config"),

  updateConfig: (key: string, value: AdminConfigValue) => {
    const segment = requiredSegment(key, "key");
    validateConfigValue(value);
    return apiClient.put<AdminConfigUpdate>(`/admin/config/${segment}`, { value });
  },

  listUsers: (options: AdminUserSearch = {}) => {
    const { search, suspended, limit = 50, offset = 0 } = options;
    validatePage(limit, offset, 200);
    if (search !== undefined && (search.trim().length === 0 || search.length > 500)) {
      throw new AdminValidationError("search must contain 1 to 500 characters");
    }
    return apiClient.get<AdminUser[]>(`/admin/users${queryString({ search, suspended, limit, offset })}`);
  },

  suspendUser: (userId: string, reason: string) => {
    const segment = requiredSegment(userId, "userId");
    if (typeof reason !== "string" || reason.trim().length === 0 || reason.length > 500) {
      throw new AdminValidationError("reason must contain 1 to 500 characters");
    }
    return apiClient.post<AdminUser>(`/admin/users/${segment}/suspend`, { reason });
  },

  unsuspendUser: (userId: string) => apiClient.post<AdminUser>(`/admin/users/${requiredSegment(userId, "userId")}/unsuspend`),

  auditLog: (limit = 50, offset = 0) => {
    validatePage(limit, offset, 200);
    return apiClient.get<AdminAuditLogEntry[]>(`/admin/audit-log${queryString({ limit, offset })}`);
  },
};
