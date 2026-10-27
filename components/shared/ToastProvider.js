"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);
const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000;

/* ====== Icons (inline SVG, no deps) ====== */
function IconSuccess() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5l5 5L20 6.5" style={{ strokeDasharray: 24, animation: "checkDraw 350ms ease-out forwards" }} />
    </svg>
  );
}
function IconError() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r="0.6" fill="currentColor" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
function IconLoader() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" className="toast-spin">
      <path d="M21 12a9 9 0 1 1-6.2-8.56" />
    </svg>
  );
}

const TYPE_MAP = {
  success: {
    icon: <IconSuccess />,
    accent: "from-emerald-500/90 to-emerald-400/90",
    ring: "ring-emerald-500/20",
    iconBg: "bg-emerald-500/15 text-emerald-500",
    progress: "bg-emerald-500",
  },
  error: {
    icon: <IconError />,
    accent: "from-rose-500/90 to-rose-400/90",
    ring: "ring-rose-500/20",
    iconBg: "bg-rose-500/15 text-rose-500",
    progress: "bg-rose-500",
  },
  warning: {
    icon: <IconWarning />,
    accent: "from-amber-500/90 to-amber-400/90",
    ring: "ring-amber-500/20",
    iconBg: "bg-amber-500/15 text-amber-500",
    progress: "bg-amber-500",
  },
  info: {
    icon: <IconInfo />,
    accent: "from-sky-500/90 to-sky-400/90",
    ring: "ring-sky-500/20",
    iconBg: "bg-sky-500/15 text-sky-500",
    progress: "bg-sky-500",
  },
  loading: {
    icon: <IconLoader />,
    accent: "from-indigo-500/90 to-indigo-400/90",
    ring: "ring-indigo-500/20",
    iconBg: "bg-indigo-500/15 text-indigo-500",
    progress: "bg-indigo-500",
  },
};

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());     // id -> {start, remaining, timeoutId}
  const hovered = useRef(new Set());

  /* --- Lifecycle --- */
  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const rec = timers.current.get(id);
    if (rec) { clearTimeout(rec.timeoutId); timers.current.delete(id); }
  }, []);

  const startTimer = useCallback((id, duration) => {
    if (!duration || duration <= 0) return;
    const start = Date.now();
    const timeoutId = setTimeout(() => {
      // mark leaving -> animate out -> remove
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => remove(id), 220);
    }, duration);
    timers.current.set(id, { start, remaining: duration, timeoutId });
  }, [remove]);

  const pauseTimer = useCallback((id) => {
    const rec = timers.current.get(id);
    if (!rec) return;
    clearTimeout(rec.timeoutId);
    rec.remaining = Math.max(0, rec.remaining - (Date.now() - rec.start));
    timers.current.set(id, rec);
  }, []);

  const resumeTimer = useCallback((id) => {
    const rec = timers.current.get(id);
    if (!rec || rec.remaining <= 0) return;
    const start = Date.now();
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => remove(id), 220);
    }, rec.remaining);
    timers.current.set(id, { start, remaining: rec.remaining, timeoutId });
  }, [remove]);

  /* --- Public API --- */
  const push = useCallback((opts) => {
    const id = ++counter;
    const type = opts.type || "info";
    const duration = opts.duration ?? (type === "loading" ? 0 : DEFAULT_DURATION);
    const toast = {
      id, type,
      title: opts.title || "",
      message: opts.message || "",
      duration,
      createdAt: Date.now(),
      leaving: false,
    };
    setToasts((prev) => {
      const next = [...prev, toast];
      // Enforce max count
      if (next.length > MAX_TOASTS) {
        const drop = next.shift();
        const rec = timers.current.get(drop.id);
        if (rec) { clearTimeout(rec.timeoutId); timers.current.delete(drop.id); }
      }
      return next;
    });
    startTimer(id, duration);
    return id;
  }, [startTimer]);

  const update = useCallback((id, patch) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (typeof patch.duration === "number") {
      const rec = timers.current.get(id);
      if (rec) clearTimeout(rec.timeoutId);
      timers.current.delete(id);
      if (patch.duration > 0) startTimer(id, patch.duration);
    }
  }, [startTimer]);

  const api = useMemo(() => ({
    push, update, dismiss: remove,
    success: (title, message) => push({ type: "success", title, message }),
    error: (title, message) => push({ type: "error", title, message }),
    warning: (title, message) => push({ type: "warning", title, message }),
    info: (title, message) => push({ type: "info", title, message }),
    loading: (title, message) => push({ type: "loading", title, message }),
    promise: async (promise, labels = {}) => {
      const id = push({ type: "loading", title: labels.loading || "Loading…", duration: 0 });
      try {
        const result = await promise;
        update(id, {
          type: "success",
          title: typeof labels.success === "function" ? labels.success(result) : (labels.success || "Done"),
          message: "",
          duration: 4000,
        });
        return result;
      } catch (e) {
        update(id, {
          type: "error",
          title: typeof labels.error === "function" ? labels.error(e) : (labels.error || "Failed"),
          message: e?.message || "",
          duration: 6000,
        });
        throw e;
      }
    },
  }), [push, update, remove]);

  useEffect(() => () => {
    for (const { timeoutId } of timers.current.values()) clearTimeout(timeoutId);
    timers.current.clear();
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-3 z-[100] flex flex-col items-center gap-2 px-3 sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto sm:items-end sm:w-[400px]"
      >
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onClose={() => remove(t.id)}
            onMouseEnter={() => { hovered.current.add(t.id); pauseTimer(t.id); }}
            onMouseLeave={() => { hovered.current.delete(t.id); resumeTimer(t.id); }}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose, onMouseEnter, onMouseLeave }) {
  const meta = TYPE_MAP[toast.type] || TYPE_MAP.info;
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (toast.type === "error") {
      setShake(true);
      const id = setTimeout(() => setShake(false), 450);
      return () => clearTimeout(id);
    }
  }, [toast.type]);

  return (
    <div
      role="status"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={[
        "toast-item pointer-events-auto relative w-full overflow-hidden rounded-ts-lg",
        "border border-ts-border bg-ts-surface/85 backdrop-blur-md",
        "shadow-ts-2 ring-1", meta.ring,
        "transition-all duration-200",
        toast.leaving ? "toast-leaving" : "",
        shake ? "toast-shake" : "",
      ].join(" ")}
    >
      {/* Top accent strip */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${meta.accent}`} />

      <div className="flex items-start gap-3 p-3">
        <div className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full ${meta.iconBg}`}>
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          {toast.title && <p className="text-sm font-semibold leading-tight">{toast.title}</p>}
          {toast.message && <p className="mt-0.5 text-xs leading-relaxed text-ts-muted">{toast.message}</p>}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          className="group relative flex h-7 w-7 flex-none items-center justify-center rounded-full text-ts-muted transition-colors hover:bg-ts-surface-2 hover:text-ts-text"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Timer progress bar */}
      {toast.duration > 0 && !toast.leaving && (
        <div className="h-0.5 w-full bg-ts-surface-2">
          <div
            className={`h-full ${meta.progress} toast-progress`}
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
