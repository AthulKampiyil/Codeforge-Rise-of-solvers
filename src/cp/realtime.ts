import { getAccessToken, getApiBaseUrl, onAuthExpired } from "./client";
import type { EventEnvelope } from "./types";
type Handler = (event: EventEnvelope) => void;

export class RealtimeClient {
  private socket?: WebSocket;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private attempts = 0;
  private enabled = false;
  private listeners = new Map<string, Set<Handler>>();
  private unsubscribeAuth?: () => void;
  connect(): void { this.enabled = true; this.unsubscribeAuth ??= onAuthExpired(() => this.disconnect()); this.open(); }
  disconnect(): void {
    this.enabled = false; this.unsubscribeAuth?.(); this.unsubscribeAuth = undefined;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.clearHeartbeat();
    const socket = this.socket; this.socket = undefined; socket?.close();
  }
  subscribe(type: string, handler: Handler): () => void {
    let set = this.listeners.get(type); if (!set) this.listeners.set(type, set = new Set()); set.add(handler);
    return () => { set?.delete(handler); if (!set?.size) this.listeners.delete(type); };
  }
  subscribeAll(handler: Handler): () => void { return this.subscribe("*", handler); }
  private open(): void {
    if (!this.enabled || this.socket || typeof WebSocket === "undefined") return;
    const token = getAccessToken(); if (!token) return;
    const url = new URL(getApiBaseUrl(), globalThis.location?.href ?? "http://localhost");
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "").replace(/\/api$/, "")}/ws/events`;
    url.search = new URLSearchParams({ token }).toString();
    const socket = new WebSocket(url.toString()); this.socket = socket;
    socket.onopen = () => {
      this.attempts = 0;
      this.clearHeartbeat();
      this.heartbeatTimer = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send("ping");
      }, 20_000);
    };
    socket.onmessage = ({ data }) => {
      try { const event = JSON.parse(String(data)) as EventEnvelope; if (!event.event_type) return;
        for (const fn of this.listeners.get(event.event_type) ?? []) fn(event);
        for (const fn of this.listeners.get("*") ?? []) fn(event);
      } catch { /* ignore malformed frames */ }
    };
    socket.onclose = () => {
      this.clearHeartbeat();
      if (this.socket === socket) this.socket = undefined;
      this.retry();
    };
    socket.onerror = () => socket.close();
  }
  private retry(): void {
    if (!this.enabled || this.reconnectTimer || !getAccessToken() || this.attempts >= 10) return;
    const delay = Math.min(1000 * 2 ** this.attempts++, 30_000);
    this.reconnectTimer = setTimeout(() => { this.reconnectTimer = undefined; this.open(); }, delay);
  }
  private clearHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }
}
export const realtimeClient = new RealtimeClient();
