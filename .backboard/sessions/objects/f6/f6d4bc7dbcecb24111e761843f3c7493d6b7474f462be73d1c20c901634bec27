import { apiClient } from "../../../shared/api/client.js";

export function getVillage() {
  return apiClient.get("/village/me");
}

export async function getTrophies() {
  try {
    return await apiClient.get("/league/me");
  } catch {
    return { trophy_count: 0 };
  }
}
