import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TIMING } from "@vytrix/config";

interface Toast { id: number; text: string; kind: "info" | "error" }
interface ToastApi { notify: (text: string, kind?: "info" | "error") => void; toasts: Toast[] }

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((text: string, kind: "info" | "error" = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-3), { id, text, kind }]);
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), TIMING.toastDurationMs);
  }, []);
  const value = useMemo(() => ({ notify, toasts }), [notify, toasts]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => <div key={toast.id} className={`toast ${toast.kind}`}>{toast.text}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("ToastProvider missing");
  return context;
}
