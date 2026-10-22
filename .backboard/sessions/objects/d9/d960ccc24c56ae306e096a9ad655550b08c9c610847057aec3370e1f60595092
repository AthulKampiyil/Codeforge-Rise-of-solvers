import { apiClient } from "../../../shared/api/client.js";

export async function fetchMyGuild() {
    try {
        return await apiClient.get("/guilds/me");
    } catch (err) {
        if (err.status === 404) return null;
        throw err;
    }
}

export function fetchAllGuilds() {
    return apiClient.get("/guilds");
}

export function createGuild(name, description = "") {
    return apiClient.post("/guilds", { name, description });
}

export function requestToJoin(guildId) {
    return apiClient.post(`/guilds/${guildId}/join-requests`);
}

export function fetchJoinRequests(guildId) {
    return apiClient.get(`/guilds/${guildId}/join-requests`);
}

export function approveRequest(guildId, requestId) {
    return apiClient.post(`/guilds/${guildId}/join-requests/${requestId}/approve`);
}

export function rejectRequest(guildId, requestId) {
    return apiClient.post(`/guilds/${guildId}/join-requests/${requestId}/reject`);
}

export function fetchTerritoryZones() {
    return apiClient.get("/guilds/territory/zones");
}
