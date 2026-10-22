// TanStack Query hooks over features/admin/api/adminApi.js.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listAuditLog,
  listConfig,
  listUsers,
  suspendUser,
  unsuspendUser,
  updateConfig,
} from "../api/adminApi.js";

export function useConfigList() {
  return useQuery({ queryKey: ["admin", "config"], queryFn: listConfig });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }) => updateConfig(key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "config"] }),
  });
}

export function useUserList(filters) {
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => listUsers(filters),
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }) => suspendUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-log"] });
    },
  });
}

export function useUnsuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => unsuspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-log"] });
    },
  });
}

export function useAuditLog() {
  return useQuery({ queryKey: ["admin", "audit-log"], queryFn: listAuditLog });
}
