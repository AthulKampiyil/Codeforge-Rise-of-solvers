import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

class RealtimeClient {
  constructor() {
    this.ws = null;
    this.token = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.listeners = new Map();
    this.isConnecting = false;
    this.shouldReconnect = true;
  }

  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.isConnecting) return;

    this.token = token;
    this.shouldReconnect = true;
    this.isConnecting = true;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const wsUrl = baseUrl.replace(/^http/, 'ws') + `/ws/events?token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.event_type) {
          this.notifyListeners(data.event_type, data);
        }
      } catch (e) {
        console.error('Failed to parse websocket message', e);
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.ws = null;
      if (this.shouldReconnect) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached');
      return;
    }

    const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    setTimeout(() => {
      if (this.shouldReconnect && this.token) {
        this.connect(this.token);
      }
    }, timeout);
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    return () => {
      this.unsubscribe(eventType, callback);
    };
  }

  unsubscribe(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  notifyListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => callback(data));
    }
  }
}

export const realtimeClient = new RealtimeClient();

export function useRealtimeEvent(eventType, handler) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const wrappedHandler = (data) => {
      // By default, if the consumer didn't pass a handler but just wants to invalidate
      // we could do some automatic invalidation based on eventType.
      // E.g., for 'VILLAGE_UPDATED', invalidate ['village']
      if (handler) {
        handler(data, queryClient);
      } else {
        // Default invalidations if no specific handler provided
        switch (eventType) {
          case 'VILLAGE_UPDATED':
            queryClient.invalidateQueries({ queryKey: ['village'] });
            break;
          case 'TERRITORY_ZONE_CHANGED':
            queryClient.invalidateQueries({ queryKey: ['territory'] });
            break;
          case 'ATTACK_INCOMING':
          case 'ATTACK_RESOLVED':
            queryClient.invalidateQueries({ queryKey: ['attacks'] });
            break;
          case 'LEAGUE_TIER_CHANGED':
            queryClient.invalidateQueries({ queryKey: ['league'] });
            break;
        }
      }
    };

    const unsubscribe = realtimeClient.subscribe(eventType, wrappedHandler);
    return () => {
      unsubscribe();
    };
  }, [eventType, handler, queryClient]);
}
