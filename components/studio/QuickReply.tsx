import { WhatsAppIcon } from "@/components/studio/icons";

/**
 * The one-tap WhatsApp reply the client asked for in discovery.
 *
 * The opener is prefilled but deliberately unfinished — it thanks them,
 * names the studio and asks when to talk, and then stops. A message that
 * pretends to answer the enquiry would go out under Kiran's name without
 * him having read it.
 */
export function whatsAppReply(name: string, phone: string) {
  const first = name.trim().split(/\s+/)[0] ?? "there";
  const text = `Hello ${first}, thank you for reaching out to Design Matters. We'd be glad to hear more about your project — when is a good time to talk?`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function QuickReply({
  name,
  phone,
  label = false,
}: {
  name: string;
  phone: string;
  /** Show the word as well as the mark — used where there is room. */
  label?: boolean;
}) {
  return (
    <a
      href={whatsAppReply(name, phone)}
      target="_blank"
      rel="noopener noreferrer"
      title={`WhatsApp ${name}`}
      className={
        label
          ? "inline-flex h-[34px] items-center gap-1.5 rounded-s-sm border border-s-border bg-s-surface px-3 text-[0.8125rem] font-medium text-s-text transition-colors hover:border-s-good/40 hover:bg-s-good-soft hover:text-s-good"
          : "grid size-8 shrink-0 place-items-center rounded-s-sm border border-s-border bg-s-surface text-s-text-2 transition-colors hover:border-s-good/40 hover:bg-s-good-soft hover:text-s-good"
      }
    >
      <WhatsAppIcon className="size-4" />
      {label && "WhatsApp"}
      <span className="sr-only">{label ? "" : `WhatsApp ${name}`}</span>
    </a>
  );
}
