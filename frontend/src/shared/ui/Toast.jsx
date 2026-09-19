// Toast notifications. Wrap the app once in <ToastProvider>, then call
// useToast().show("Attack launched", { variant: "success" }) anywhere.
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

const VARIANT_BORDER = {
  default: "border-border",
  success: "border-success/60",
  danger: "border-danger/60",
  info: "border-info/60",
};

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { variant = "default", duration = 4000 } = {}) => {
      const id = ++nextId;
      setToasts((current) => [...current, { id, message, variant }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`min-w-[220px] rounded-md border bg-panel px-4 py-2 text-sm text-slate-100 shadow-lg ${
              VARIANT_BORDER[toast.variant] ?? VARIANT_BORDER.default
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
