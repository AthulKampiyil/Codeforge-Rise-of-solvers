import { useEffect } from "react";

// Compatible with the shared M8 event bus; the fallback keeps the feature
// independently mountable until the shared hook is available.
export function useRealtimeEvent(eventType, handler) {
  useEffect(() => {
    const listener = (event) => {
      const message = event.detail || event;
      if (message.event_type === eventType || message.type === eventType) handler(message);
    };
    window.addEventListener("codeforge:realtime", listener);
    return () => window.removeEventListener("codeforge:realtime", listener);
  }, [eventType, handler]);
}
