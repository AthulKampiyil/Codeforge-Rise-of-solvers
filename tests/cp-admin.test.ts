import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/cp/client";
import { adminApi, AdminValidationError } from "../src/cp/admin";

let token: string | null = "admin-token";
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => key === "codeforge.accessToken" ? token : null,
} });
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
afterEach(() => { token = "admin-token"; vi.restoreAllMocks(); });

describe("admin API adapter", () => {
  it("maps only M9 admin routes, query strings, and request payloads", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => jsonResponse([]));
    await adminApi.listConfig();
    await adminApi.updateConfig("territory/score", { weight: 2.5 });
    await adminApi.listUsers({ search: "Ada Lovelace", suspended: false, limit: 20, offset: 4 });
    await adminApi.suspendUser("user-1", "Policy violation");
    await adminApi.unsuspendUser("user-1");
    await adminApi.auditLog(10, 3);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/admin/config",
      "/api/admin/config/territory%2Fscore",
      "/api/admin/users?search=Ada+Lovelace&suspended=false&limit=20&offset=4",
      "/api/admin/users/user-1/suspend",
      "/api/admin/users/user-1/unsuspend",
      "/api/admin/audit-log?limit=10&offset=3",
    ]);
    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual(["GET", "PUT", "GET", "POST", "POST", "GET"]);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ value: { weight: 2.5 } });
    expect(JSON.parse(String(fetchMock.mock.calls[3][1]?.body))).toEqual({ reason: "Policy violation" });
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer admin-token");
  });

  it("returns the shared typed authorization failure for a non-admin caller", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => jsonResponse({ detail: "Admin privileges required" }, 403));
    const rejected = adminApi.listConfig();
    await expect(rejected).rejects.toBeInstanceOf(ApiError);
    await expect(rejected).rejects.toMatchObject({ status: 403, detail: "Admin privileges required" });
  });

  it("validates admin inputs before sending requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => jsonResponse([]));
    expect(() => adminApi.updateConfig(" ", 1)).toThrow(AdminValidationError);
    expect(() => adminApi.updateConfig("economy.multiplier", Number.NaN)).toThrow(AdminValidationError);
    expect(() => adminApi.listUsers({ limit: 201 })).toThrow(AdminValidationError);
    expect(() => adminApi.suspendUser("u1", "  ")).toThrow(AdminValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
