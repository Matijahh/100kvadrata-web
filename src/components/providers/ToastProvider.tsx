"use client";

import BellIcon from "@assets/icons/bell-icon.svg";
import CheckIcon from "@assets/icons/check-icon.svg";
import CloseIcon from "@assets/icons/close-icon.svg";
import { cn } from "@/lib/cn";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Same API as flatswipe/src/components/providers/ToastProvider.tsx, so ported
// screens call `useToast().showToast({ type, message })` unchanged.

export type ToastType = "success" | "error" | "info" | "notification";

export type ToastOptions = {
  message: string;
  title?: string;
  type?: ToastType;
  durationMs?: number;
  onPress?: () => void;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const DEFAULT_DURATION_MS = 3200;

const accentClass = (type: ToastType | undefined) => {
  switch (type) {
    case "success":
      return "text-success";
    case "error":
      return "text-destructive";
    default:
      return "text-primary";
  }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ ...options, id: Date.now() });
    timerRef.current = setTimeout(
      () => setToast(null),
      options.durationMs ?? DEFAULT_DURATION_MS,
    );
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const Icon = toast?.type === "success" ? CheckIcon : toast?.type === "error" ? CloseIcon : BellIcon;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4"
      >
        {toast ? (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            onClick={() => {
              toast.onPress?.();
              hide();
            }}
            className={cn(
              "pointer-events-auto flex w-full max-w-md cursor-pointer items-start gap-3 rounded-2xl",
              "bg-surface-elevated px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)]",
              "animate-[toast-in_180ms_ease-out]",
            )}
          >
            <Icon width={18} height={18} className={cn("mt-0.5 shrink-0", accentClass(toast.type))} />
            <div className="min-w-0 flex-1">
              {toast.title ? (
                <p className="text-sm font-semibold text-text">{toast.title}</p>
              ) : null}
              <p className="text-sm text-text">{toast.message}</p>
            </div>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
