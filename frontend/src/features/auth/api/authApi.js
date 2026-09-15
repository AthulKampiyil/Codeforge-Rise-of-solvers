// Judge-account linking calls (REQ-1.3–1.5) — core login/register/logout
// live in shared/auth/AuthContext.jsx since every lane needs `user`.
import { apiClient } from "../../../shared/api/client.js";

export function requestJudgeLink(judgeType, handle) {
  return apiClient.post("/auth/judge-accounts", { judge_type: judgeType, handle });
}

export function verifyJudgeAccount(judgeAccountId) {
  return apiClient.post(`/auth/judge-accounts/${judgeAccountId}/verify`);
}

export function getMyJudgeAccounts() {
  return apiClient.get("/auth/judge-accounts");
}
