import Link from "next/link";
import { PageHead } from "@/components/studio/ui";
import { AlertSettings } from "@/components/studio/AlertSettings";
import { getIdentity, getSection } from "@/lib/settings";
import { mailStatus } from "@/lib/mail";
import { resolveRecipients } from "@/lib/notify-lead";
import { requireUser } from "@/lib/require-auth";

export const metadata = { title: "Studio | Email alerts" };

/**
 * Where enquiry email goes.
 *
 * The settings were originally an environment variable on the server,
 * which meant the studio could not change the address that receives
 * their own leads without asking someone to redeploy. Everything on this
 * screen resolves the same way the sender does, so what it says is what
 * will happen rather than what was configured.
 */
export default async function AlertsPage() {
  await requireUser();

  const [settings, effective, identity] = await Promise.all([
    getSection("notifications"),
    resolveRecipients(),
    getIdentity(),
  ]);

  return (
    <div>
      <PageHead
        title="Email alerts"
        subtitle="Where new enquiries are emailed, and who receives them."
      />

      <AlertSettings
        initial={{
          recipients: [...settings.recipients],
          notifyStudio: settings.notifyStudio,
          acknowledgeEnquirer: settings.acknowledgeEnquirer,
        }}
        effective={effective}
        provider={mailStatus()}
        studioEmail={identity.email}
      />

      <p className="mt-6 max-w-2xl text-[0.75rem] leading-relaxed text-s-text-3">
        Every enquiry is recorded under{" "}
        <Link href="/studio/leads" className="text-s-accent hover:underline">
          Enquiries
        </Link>{" "}
        whatever these settings say, and each one shows whether it was emailed out and to whom.
        Email is the convenience; the dashboard is the record.
      </p>
    </div>
  );
}
