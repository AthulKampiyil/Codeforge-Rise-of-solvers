// Admin & Game-Balance Config calls (UC-11/UC-12). Every route here is
// require_admin-gated on the backend; RequireAuth's `adminOnly` keeps a
// non-admin from ever reaching this page in the first place.
import { apiClient } from "../../../shared/api/client.js";

export function listConfig() {
  return apiClient.get("/admin/config");
}

export function updateConfig(key, value) {
  return apiClient.put(`/admin/config/${encodeURIComponent(key)}`, { value });
}

export function listUsers({ search, suspended } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (suspended !== undefined && suspended !== null) params.set("suspended", String(suspended));
  const qs = params.toString();
  return apiClient.get(`/admin/users${qs ? `?${qs}` : ""}`);
}

export function suspendUser(userId, reason) {
  return apiClient.post(`/admin/users/${userId}/suspend`, { reason });
}

export function unsuspendUser(userId) {
  return apiClient.post(`/admin/users/${userId}/unsuspend`);
}

export function listAuditLog() {
  return apiClient.get("/admin/audit-log");
}
