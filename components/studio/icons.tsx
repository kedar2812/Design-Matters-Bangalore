/**
 * Studio icon set — 20×20, 1.5px stroke, inherits currentColor.
 * Inline so the dashboard ships no icon dependency.
 */
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function OverviewIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
    </svg>
  );
}

export function ProjectsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <path d="M2.5 12.5l4-3.5 3.5 3 3-2.5 4.5 3.5" />
      <circle cx="7" cy="7.5" r="1.25" />
    </svg>
  );
}

export function ContentIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 2.5h8.5L16 6v11.5H4z" />
      <path d="M12 2.5V6h4M6.75 10h6.5M6.75 13h4.5" />
    </svg>
  );
}

export function EnquiriesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="4" width="15" height="12" rx="2" />
      <path d="M3 6l7 4.5L17 6" />
    </svg>
  );
}

export function AnalyticsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 17V9M8 17V4M13 17v-5M18 17V7" />
    </svg>
  );
}

export function StudioIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 17V8l7-5 7 5v9" />
      <path d="M8 17v-5h4v5" />
    </svg>
  );
}

export function TestimonialsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 4.5h15v9.5h-8l-3.5 3v-3h-3.5z" />
      <path d="M6.5 8v1.5M10 8v1.5M13.5 8v1.5" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  );
}

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 10h11M11 5.5l4.5 4.5-4.5 4.5" />
    </svg>
  );
}

export function ExternalIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M11 3.5h5.5V9M16 4l-7 7M15 11.5v5H3.5V5h5" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M10 1.7a8.2 8.2 0 0 0-7 12.5L1.7 18.3l4.2-1.3A8.2 8.2 0 1 0 10 1.7Zm0 14.9a6.7 6.7 0 0 1-3.4-.94l-.24-.14-2.5.77.77-2.43-.16-.25A6.7 6.7 0 1 1 10 16.6Zm3.7-4.85c-.2-.1-1.2-.6-1.39-.66-.18-.07-.32-.1-.45.1s-.52.65-.64.79c-.12.13-.24.15-.44.05a5.5 5.5 0 0 1-2.74-2.4c-.2-.35.2-.33.59-1.09a.37.37 0 0 0-.02-.35c-.05-.1-.45-1.08-.61-1.48-.16-.39-.33-.33-.45-.34h-.38a.74.74 0 0 0-.53.25 2.24 2.24 0 0 0-.7 1.66 3.9 3.9 0 0 0 .81 2.06 8.9 8.9 0 0 0 3.4 3c1.27.55 1.77.6 2.4.5.39-.05 1.2-.49 1.36-.96s.17-.87.12-.96-.18-.14-.38-.24Z" />
    </svg>
  );
}

/* --- added for the rebuilt dashboard --------------------------------- */

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  );
}

export function WarningIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 2.8 18.2 17H1.8L10 2.8Z" />
      <path d="M10 8v3.6" />
      <path d="M10 14.2h.01" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.2 13.2 3.3 3.3" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  );
}

export function GripIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <circle cx="7.5" cy="5" r="1.35" />
      <circle cx="12.5" cy="5" r="1.35" />
      <circle cx="7.5" cy="10" r="1.35" />
      <circle cx="12.5" cy="10" r="1.35" />
      <circle cx="7.5" cy="15" r="1.35" />
      <circle cx="12.5" cy="15" r="1.35" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2v1.8M10 16.2V18M18 10h-1.8M3.8 10H2M15.7 4.3l-1.3 1.3M5.6 14.4l-1.3 1.3M15.7 15.7l-1.3-1.3M5.6 5.6 4.3 4.3" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M16.5 11.8A7 7 0 0 1 8.2 3.5a7 7 0 1 0 8.3 8.3Z" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 5.5h13" />
      <path d="M7.5 5.5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
      <path d="M5.5 5.5 6.2 16a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9l.7-10.5" />
      <path d="M8.6 8.8v4.7M11.4 8.8v4.7" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="m3 6 6.4 4.6a1 1 0 0 0 1.2 0L17 6" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6.3 3.2 8 3.1a1 1 0 0 1 1 .7l.8 2.4a1 1 0 0 1-.3 1.1L8.2 8.4a9.5 9.5 0 0 0 3.4 3.4l1.1-1.3a1 1 0 0 1 1.1-.3l2.4.8a1 1 0 0 1 .7 1v1.7a1.6 1.6 0 0 1-1.8 1.6A13.4 13.4 0 0 1 3.6 5a1.6 1.6 0 0 1 1.6-1.8Z" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M1.8 10S4.9 4.8 10 4.8 18.2 10 18.2 10 15.1 15.2 10 15.2 1.8 10 1.8 10Z" />
      <circle cx="10" cy="10" r="2.4" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 5.8V10l2.8 1.7" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m7.5 4.5 5 5.5-5 5.5" />
    </svg>
  );
}
