import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/guildApi';

export function useMyGuild() {
    return useQuery({
        queryKey: ['myGuild'],
        queryFn: api.fetchMyGuild
    });
}

export function useJoinRequests(guildId, isOfficer) {
    return useQuery({
        queryKey: ['joinRequests', guildId],
        queryFn: () => api.fetchJoinRequests(guildId),
        enabled: !!guildId && isOfficer
    });
}
