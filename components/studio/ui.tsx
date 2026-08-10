import { cn } from "@/lib/utils";

/**
 * The dashboard's primitives.
 *
 * Server-safe by design — nothing here holds state or reaches for an
 * event handler, so a page can compose a whole screen without shipping a
 * byte of JavaScript for the chrome. The interactive pieces (toasts,
 * drawer, confirm, drag lists) are separate client modules.
 *
 * Every size here is on a 4px grid and every control that can sit beside
 * another control is 34px or 38px tall, so a button and an input on the
 * same row line up without anyone nudging padding.
 */

/* ------------------------------------------------------------------ card */

export function Card({
  className,
  children,
  ...rest
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-s border border-s-border bg-s-surface shadow-s",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * A card's title row. `action` sits hard right — a link, a button, a
 * filter. The divider is optional because a stat card wants none and a
 * table card wants one.
 */
export function CardHead({
  title,
  hint,
  action,
  divided = false,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  divided?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-4",
        divided && "border-b border-s-border",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-s-text">
          {title}
        </h2>
        {hint && <p className="mt-0.5 truncate text-[0.8125rem] text-s-text-3">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- button */

const BUTTON_BASE =
  "relative inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-s-sm font-medium transition-[background-color,border-color,color,opacity] duration-150 disabled:pointer-events-none disabled:opacity-45";

const BUTTON_VARIANT = {
  primary: "bg-s-solid text-s-on-solid hover:bg-s-solid-hover",
  secondary:
    "border border-s-border bg-s-surface text-s-text hover:bg-s-surface-2 hover:border-s-border-strong",
  ghost: "text-s-text-2 hover:bg-s-surface-3 hover:text-s-text",
  danger: "border border-s-border bg-s-surface text-s-bad hover:bg-s-bad-soft hover:border-s-bad/30",
} as const;

const BUTTON_SIZE = {
  sm: "h-[30px] px-2.5 text-[0.8125rem]",
  md: "h-[34px] px-3.5 text-[0.8125rem]",
  lg: "h-[38px] px-4 text-sm",
  icon: "size-[34px]",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT;

export function buttonClass(
  variant: ButtonVariant = "secondary",
  size: keyof typeof BUTTON_SIZE = "md",
  className?: string,
) {
  return cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className);
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: keyof typeof BUTTON_SIZE;
}) {
  return <button className={buttonClass(variant, size, className)} {...rest} />;
}

/* ----------------------------------------------------------------- badge */

const TONE = {
  neutral: "bg-s-muted-soft text-s-muted",
  accent: "bg-s-accent-soft text-s-accent",
  info: "bg-s-info-soft text-s-info",
  good: "bg-s-good-soft text-s-good",
  warn: "bg-s-warn-soft text-s-warn",
  bad: "bg-s-bad-soft text-s-bad",
} as const;

export type Tone = keyof typeof TONE;

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[0.75rem] font-medium leading-none",
        TONE[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

/**
 * A quieter chip for facts rather than states — budget, location, the
 * kind of thing that is metadata, not status.
 */
export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-s-xs border border-s-border bg-s-surface-2 px-1.5 py-[2px] text-[0.75rem] leading-[1.35] text-s-text-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- input */

export const inputClass =
  "h-[34px] w-full rounded-s-sm border border-s-border bg-s-surface px-2.5 text-[0.8125rem] text-s-text outline-none transition-colors placeholder:text-s-text-3 hover:border-s-border-strong focus:border-s-accent focus:ring-2 focus:ring-s-accent/15 disabled:opacity-50";

export const textareaClass = cn(inputClass, "h-auto min-h-20 resize-y py-2 leading-relaxed");

/**
 * The select needs its own chevron because `appearance-none` removes the
 * native one, and the native one is the single most platform-specific
 * thing in a form — a Windows select next to a custom input is the
 * clearest possible tell that a dashboard was assembled rather than
 * designed.
 */
export function Select({ className, children, ...rest }: React.ComponentProps<"select">) {
  return (
    <div className="relative inline-grid">
      <select
        className={cn(
          inputClass,
          "cursor-pointer appearance-none bg-none pr-7",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-s-text-3"
      >
        <path
          d="M4 6.5 8 10.5 12 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Label + control + hint/error, with the error replacing the hint. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string[];
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[0.8125rem] font-medium text-s-text-2"
      >
        {label}
      </label>
      {children}
      {error?.length ? (
        <p className="mt-1.5 text-[0.75rem] text-s-bad">{error[0]}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.75rem] text-s-text-3">{hint}</p>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------- table */

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="s-scroll overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-[0.8125rem]", className)}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, children, ...rest }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-s-border bg-s-surface-2 px-4 py-2.5 text-[0.75rem] font-medium text-s-text-3",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, ...rest }: React.ComponentProps<"td">) {
  return (
    <td className={cn("border-b border-s-border px-4 py-3 align-middle", className)} {...rest}>
      {children}
    </td>
  );
}

/* ------------------------------------------------------------ empty state */

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      {icon && (
        <div className="mb-4 grid size-10 place-items-center rounded-full bg-s-surface-3 text-s-text-3">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-s-text">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-[0.8125rem] leading-relaxed text-s-text-3">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- layout */

/** A screen's title block. One per page, above the cards. */
export function PageHead({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-s-text">{title}</h1>
        {subtitle && <p className="mt-1 text-[0.8125rem] text-s-text-3">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function SectionLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("s-label", className)}>{children}</p>;
}
