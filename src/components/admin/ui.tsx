import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AlertCircle,
  CheckCircle2,
  CircleAlert,
  Info,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";

export { clsx, twMerge };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ============================ Shared types ============================ */

export type ContentKind = "winners" | "nominations";

export type WinnerRow = {
  id: string;
  awardTitle: string;
  recipientName: string;
  organization: string | null;
  category: string;
  year: number;
  market: string;
  summary: string;
  imageUrl: string | null;
  slug: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type NominationRow = {
  id: string;
  awardTitle: string;
  nomineeName: string;
  organization: string | null;
  category: string;
  year: number;
  market: string;
  summary: string;
  notes: string;
  imageUrl: string | null;
  slug: string;
  status: "draft" | "submitted" | "shortlisted" | "published" | "archived";
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type RowRecord = WinnerRow | NominationRow;

export type ApiList<T> = {
  rows: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type Stats = {
  winners: { total: number; published: number; draft: number };
  nominations: { total: number; shortlisted: number; submitted: number };
};

export type FormState = {
  id?: string;
  awardTitle: string;
  personName: string;
  organization: string;
  category: string;
  year: string;
  market: string;
  summary: string;
  notes: string;
  imageUrl: string;
  slug: string;
  status: string;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
};

/* ============================ Palette tokens ============================ */
/* Refined admin dark palette with strong, accessible contrast. */

export const admin = {
  page: "bg-[#0a0a0c]",
  sidebar: "bg-[#0c0c0e]",
  panel: "bg-[#121215] border-white/[0.06]",
  surface: "bg-[#17171b]",
  surfaceHover: "hover:bg-white/[0.045]",
  border: "border-white/[0.07]",
  borderStrong: "border-white/[0.12]",
  text: "text-zinc-100",
  textSecondary: "text-zinc-400",
  textTertiary: "text-zinc-500",
  input:
    "bg-[#0e0e11] border-white/[0.08] text-zinc-100 placeholder:text-zinc-500 focus:border-[#ffb001]/55 focus:ring-2 focus:ring-[#ffb001]/20",
};

/* ============================ Spinner ============================ */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin", className)} />;
}

/* ============================ Button ============================ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-[#ffc424] to-[#f59e0b] text-[#1a1206] font-semibold shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_6px_20px_-6px_rgba(245,158,11,0.7)] hover:from-[#ffcf45] hover:to-[#fba71d] hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_10px_28px_-6px_rgba(245,158,11,0.8)] border border-[#d9930a]/40",
  secondary:
    "bg-[#1b1b1f] text-zinc-100 border border-white/[0.09] hover:bg-[#222227] hover:border-white/[0.16]",
  ghost:
    "bg-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100 border border-transparent",
  danger:
    "bg-red-500/10 text-red-300 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-200",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-5 text-[15px] rounded-xl gap-2",
  icon: "h-9 w-9 rounded-lg justify-center",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-medium leading-none outline-none transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-[#ffb001]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:scale-[0.98]",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={16} /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

/* ============================ Form fields ============================ */

const fieldBase =
  "w-full rounded-lg border bg-[#0e0e11] px-3.5 text-[15px] text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-[#ffb001]/55 focus:ring-2 focus:ring-[#ffb001]/18 disabled:opacity-50";

export function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-zinc-300">
      {children}
      {required ? <span className="text-[#f59e0b]">*</span> : null}
    </span>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  autoFocus?: boolean;
};

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  hint,
  autoFocus,
}: TextFieldProps) {
  return (
    <label className="flex flex-col">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        className={cn(fieldBase, "h-11")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {hint ? <span className="mt-1 text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
};

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  required,
  placeholder,
}: TextAreaProps) {
  return (
    <label className="flex flex-col">
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        className={cn(fieldBase, "resize-y py-2.5 leading-relaxed")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}

type SelectFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
};

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: SelectFieldProps) {
  return (
    <label className="flex flex-col">
      {label ? <FieldLabel required={required}>{label}</FieldLabel> : null}
      <div className="relative">
        <select
          className={cn(
            fieldBase,
            "h-11 cursor-pointer appearance-none pr-9 [&>option]:bg-[#17171b] [&>option]:text-zinc-100",
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </label>
  );
}

/* ============================ Status badge ============================ */

type BadgeVariant = "gold" | "emerald" | "sky" | "amber" | "zinc" | "violet" | "rose";

const badgeVariants: Record<BadgeVariant, string> = {
  gold: "bg-[#ffb001]/12 text-[#ffd05a] ring-[#ffb001]/25",
  emerald: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  sky: "bg-sky-400/10 text-sky-300 ring-sky-400/25",
  amber: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  violet: "bg-violet-400/10 text-violet-300 ring-violet-400/25",
  rose: "bg-rose-400/10 text-rose-300 ring-rose-400/25",
  zinc: "bg-zinc-400/10 text-zinc-400 ring-zinc-400/20",
};

export function Badge({
  variant = "zinc",
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        badgeVariants[variant],
      )}
    >
      {children}
    </span>
  );
}

export function statusBadgeVariant(
  status: string,
): BadgeVariant {
  switch (status) {
    case "published":
      return "emerald";
    case "shortlisted":
      return "violet";
    case "submitted":
      return "sky";
    case "archived":
      return "zinc";
    default:
      return "gold";
  }
}

/* ============================ Empty state ============================ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-white/[0.03] text-zinc-500 ring-1 ring-inset ring-white/[0.06]">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-zinc-200">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

/* ============================ Toast system ============================ */

type ToastVariant = "success" | "error" | "info";
type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (toast: {
    title: string;
    description?: string;
    variant?: ToastVariant;
  }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toastConfig: Record<
  ToastVariant,
  { icon: LucideIcon; ring: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, ring: "ring-emerald-400/30", iconColor: "text-emerald-400" },
  error: { icon: AlertCircle, ring: "ring-rose-400/30", iconColor: "text-rose-400" },
  info: { icon: Info, ring: "ring-sky-400/30", iconColor: "text-sky-400" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    ({
      title,
      description,
      variant = "info",
    }: {
      title: string;
      description?: string;
      variant?: ToastVariant;
    }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    [],
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const cfg = toastConfig[toast.variant];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 rounded-xl border border-white/[0.07] bg-[#161619] p-3.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)] ring-1 ring-inset backdrop-blur-xl",
                  cfg.ring,
                )}
              >
                <cfg.icon size={18} className={cn("mt-0.5 shrink-0", cfg.iconColor)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-100">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">
                      {toast.description}
                    </p>
                  ) : null}
                </div>
                <button
                  className="shrink-0 rounded-md p-1 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss"
                  type="button"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/* ============================ Modal ============================ */

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onClose();
    }
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const root = containerRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keydown", trap);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <div className="flex min-h-full items-start justify-center p-4 py-8">
            <motion.div
              ref={containerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelledBy}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className={cn(
                "relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101013] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={pending ? () => {} : onClose} labelledBy="confirm-dialog-title">
      <div className="max-w-lg">
        <div className="border-b border-white/[0.06] px-6 py-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset",
                tone === "danger"
                  ? "bg-rose-500/10 text-rose-300 ring-rose-500/25"
                  : "bg-[#ffb001]/10 text-[#ffd05a] ring-[#ffb001]/25",
              )}
            >
              <CircleAlert size={20} />
            </div>
            <div>
              <h2 id="confirm-dialog-title" className="text-lg font-bold text-zinc-50">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.04] bg-[#0c0c0f] px-6 py-4">
          <Button variant="ghost" type="button" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            type="button"
            onClick={onConfirm}
            loading={pending}
          >
            {pending ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================ Misc helpers ============================ */

export function personName(kind: ContentKind, row: RowRecord) {
  return kind === "winners"
    ? (row as WinnerRow).recipientName
    : (row as NominationRow).nomineeName;
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
