const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

export async function fetchMyGuild() {
    const res = await fetch(`${baseUrl}/guilds/me`, { headers: getAuthHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch my guild");
    return await res.json();
}

export async function fetchAllGuilds() {
    const res = await fetch(`${baseUrl}/guilds`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch all guilds");
    return await res.json();
}

export async function createGuild(name, description = "") {
    const res = await fetch(`${baseUrl}/guilds`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, description })
    });
    if (!res.ok) throw new Error("Failed to create guild");
    return await res.json();
}

export async function requestToJoin(guildId) {
    const res = await fetch(`${baseUrl}/guilds/${guildId}/join-requests`, {
        method: "POST",
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to request to join");
    return await res.json();
}

export async function fetchJoinRequests(guildId) {
    const res = await fetch(`${baseUrl}/guilds/${guildId}/join-requests`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch join requests");
    return await res.json();
}

export async function approveRequest(guildId, requestId) {
    const res = await fetch(`${baseUrl}/guilds/${guildId}/join-requests/${requestId}/approve`, {
        method: "POST",
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to approve request");
    return await res.json();
}

export async function rejectRequest(guildId, requestId) {
    const res = await fetch(`${baseUrl}/guilds/${guildId}/join-requests/${requestId}/reject`, {
        method: "POST",
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to reject request");
    return await res.json();
}

export async function fetchTerritoryZones() {
    const res = await fetch(`${baseUrl}/guilds/territory/zones`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch territory zones");
    return await res.json();
}
