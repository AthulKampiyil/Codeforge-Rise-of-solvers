import { useState, useEffect, useCallback } from 'react';
import { getWarRoom } from '../api/warRoomApi';
import { useRealtimeEvent } from '../../../shared/websocket/client';

export function useWarRoom(guildId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWarRoom = useCallback(async () => {
    if (!guildId) return;
    try {
      setLoading(true);
      const res = await getWarRoom(guildId);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchWarRoom();
  }, [fetchWarRoom]);

  useRealtimeEvent("TERRITORY_ZONE_CHANGED", () => {
    fetchWarRoom();
  });

  return { data, loading, error, refresh: fetchWarRoom };
}
