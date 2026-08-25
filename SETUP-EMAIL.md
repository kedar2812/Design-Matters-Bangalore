# Enquiry email — setup

Every enquiry submitted on the site is stored in the database and shown in
**Studio → Enquiries**, exactly as before. This document is about the layer
added on top: an email to the studio the moment one arrives, an
acknowledgement to the person who sent it, and the record in the dashboard
of whether either actually went.

**Nothing here is required for the site to run.** With no API key
configured, enquiries are still captured and still appear in the studio —
each one simply carries a visible "This enquiry was never emailed out"
notice with the reason. That is deliberate: a notification system that
fails quietly is worse than one that was never switched on, because
everybody stops opening the dashboard once they trust the emails.

---

## 1. Create the Resend account

Free tier is 3,000 emails a month and 100 a day. The studio sends two per
enquiry, so the ceiling is roughly 1,500 enquiries a month — several
hundred times what this practice receives.

1. Sign up at <https://resend.com> with the studio's own email address.
   **Kiran should own this account, not the developer** — it is the
   studio's mail, and account recovery has to reach them.
2. Go to **Domains → Add Domain** and enter `designmattersblr.com`.

## 2. Add the DNS records

Resend will show three records. They go wherever the domain's DNS is
managed — the registrar, or Cloudflare if it is proxied there.

| Type  | Purpose | Notes |
| ----- | ------- | ----- |
| `MX`  | Receiving for the sending subdomain | Only on the `send.` subdomain — this does **not** touch the studio's existing mailboxes |
| `TXT` | SPF — says Resend may send as this domain | |
| `TXT` | DKIM — signs each message so it can be proven unaltered | |

Two things worth knowing before touching the DNS:

- **Existing email is unaffected.** The records Resend asks for sit on a
  `send.` subdomain. Whatever handles `kiran@designmattersblr.com` today
  keeps handling it.
- **If the domain is on Cloudflare, set these records to "DNS only"** (grey
  cloud, not orange). Proxying a mail record breaks it.

Verification usually completes in a few minutes; DNS can take up to 48
hours. Resend's dashboard shows the status.

## 3. Configure the app

In `.env` on the server (see `.env.example` for the annotated versions):

```
RESEND_API_KEY="re_..."
MAIL_FROM="Design Matters Architects <studio@designmattersblr.com>"
LEAD_NOTIFY_TO="kiran@designmattersblr.com"
```

`MAIL_FROM` **must** be at the verified domain. The mailbox part
(`studio@`) does not need to exist as a real inbox — replies do not go
there. Every notification carries `Reply-To:` set to the enquirer, so
hitting reply in Gmail writes to them directly.

`LEAD_NOTIFY_TO` takes a comma-separated list if more than one person
should see enquiries. Left unset, it falls back to the studio email
configured in **Studio → Studio details**.

Restart the app (`pm2 restart dma`) — env changes are read at boot.

---

## What the studio receives

**To Kiran, per enquiry:** the name, contact details, project type, budget
and location, the message itself, and four buttons — *Mark contacted*,
*WhatsApp*, *Open in Studio*, plus quiet links for the other stages.

Those buttons are the point. Tapping *Mark contacted* from a phone at a
site visit moves the enquiry in the dashboard without logging in. The links
are signed, they name one enquiry and one stage, they expire after 14 days,
and every use is written to that enquiry's history as having come from the
email.

**To the enquirer:** a short acknowledgement confirming the studio has
their message, what they sent, and the phone number — sent under the
studio's name, so the first thing a prospective client receives reads like
it came from an architect rather than from a form.

To see either without sending anything:

```
npm run emails:preview     # writes .preview/*.html — open in a browser
```

## What the dashboard shows

Each enquiry's panel gains two sections:

- **Notification** — "Emailed 13 Aug, 7:39 pm", or a red block naming the
  reason it failed, with a **Send it now** button. A failed notification is
  also flagged on the enquiry row itself, since that is the one thing worth
  knowing without opening anything.
- **History** — the full trail: received, emailed, acknowledged, every
  stage change, and whether the change came from the dashboard or from a
  tap in the email.

---

## Troubleshooting

Read the reason in the red **Notification** block first — it is passed
through from Resend verbatim, and it is usually the whole answer.

**"The domain is not verified"** — DNS has not propagated or a record was
mistyped. Check the domain's status in the Resend dashboard.

**"You can only send testing emails to your own email address"** — the
account has no verified domain yet, so Resend restricts sending to the
signup address. Finish step 2.

**"RESEND_API_KEY is not set"** — the app booted without it. Confirm it is
in `.env` on the server and restart; env is read at boot, not per request.

**Emails send but land in spam** — expected briefly on a domain that has
never sent automated mail. It settles as the domain builds reputation.
Marking the first few as "not spam" helps. The acknowledgement going to
spam matters more than the notification, since strangers receive it.

**Nothing sends and there is no error** — check that the enquiry produced a
`RECEIVED` entry in its History. If it did not, the submission itself
failed and mail is not the problem.

**Rate limiting.** Five enquiries an hour from one IP address. Beyond that
the form declines politely and points at the phone number. It resets on
deploy — it lives in process memory, which is sufficient for a single-VPS
deployment and would need rethinking if the site ever ran more than one
instance.
