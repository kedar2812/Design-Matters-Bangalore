/**
 * Ambient live gradient behind the enquiry form — three soft brass/gold
 * pools drifting on transform-only keyframes (GPU-composited, so the
 * motion stays perfectly smooth; the blur itself is static). Colors are
 * the site's own tokens, so the glow warms up automatically in dark mode.
 *
 * Parent must be `relative isolate overflow-hidden`.
 */
export function EnquiryGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* still base wash so the panel reads warm before the eye catches motion */}
      <div className="absolute inset-0 bg-[linear-gradient(115deg,color-mix(in_oklab,var(--color-brass)_14%,transparent),transparent_45%,color-mix(in_oklab,var(--color-chart)_12%,transparent))]" />
      <div className="enquiry-blob enquiry-blob-a left-[-4%] top-[-18%] h-[34rem] w-[34rem] bg-[radial-gradient(closest-side,var(--color-chart)_0%,transparent_74%)]" />
      <div className="enquiry-blob enquiry-blob-b right-[2%] top-[4%] h-[28rem] w-[28rem] bg-[radial-gradient(closest-side,var(--color-brass-bright)_0%,transparent_74%)]" />
      <div className="enquiry-blob enquiry-blob-c bottom-[-22%] left-[34%] h-[30rem] w-[30rem] bg-[radial-gradient(closest-side,var(--color-chart)_0%,transparent_74%)]" />
      <div className="enquiry-blob enquiry-blob-d bottom-[-10%] left-[-6%] h-[26rem] w-[26rem] bg-[radial-gradient(closest-side,var(--color-brass)_0%,transparent_74%)] !opacity-40 dark:!opacity-20" />
    </div>
  );
}
