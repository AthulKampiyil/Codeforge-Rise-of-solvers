import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/guildApi';

export function useMyGuild() {
    return useQuery({
        queryKey: ['myGuild'],
        queryFn: api.fetchMyGuild
    });
}

export function useAllGuilds() {
    return useQuery({
        queryKey: ['allGuilds'],
        queryFn: api.fetchAllGuilds
    });
}

export function useJoinRequests(guildId, isOfficer) {
    return useQuery({
        queryKey: ['joinRequests', guildId],
        queryFn: () => api.fetchJoinRequests(guildId),
        enabled: !!guildId && isOfficer
    });
}

export function useTerritoryZones() {
    return useQuery({
        queryKey: ['territory'],
        queryFn: api.fetchTerritoryZones
    });
}
