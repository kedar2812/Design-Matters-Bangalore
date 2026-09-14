# Enquiry email: setup

Every enquiry submitted on the site is stored in the database and shown in
**Studio → Enquiries**. This document is about the layer on top of that:

- an **alert** to the studio the moment an enquiry arrives,
- an **acknowledgement** to the person who sent it,
- a daily **reminder** listing enquiries nobody has replied to yet,
- and the record in the dashboard of whether each of those actually went.

**Nothing here is required for the site to run.** With no sending account
configured, enquiries are still captured and still appear in the studio,
each one carrying a visible note that it was not emailed and why. That is
deliberate: a notification system that fails quietly is worse than one
that was never switched on, because everybody stops opening the dashboard
once they trust the emails.

---

## 1. Pick how mail is sent

The studio's mail (`kiran@designmattersblr.com`) is **Google Workspace**:
the domain's MX records point at `aspmx.l.google.com`, and its DNS is at
GoDaddy. There are two ways to send, and the app supports both.

### Option A: a Google account over SMTP (no DNS changes)

Google signs and sends the mail, so it arrives authenticated and lands in
the inbox, and nobody has to touch the domain.

**Use a separate account for sending, not Kiran's own.** Gmail treats mail
sent from an account to itself as "sent by me": it can arrive already
read, and the phone app does not push a notification for it, which
defeats the point of an alert. A dedicated sender (a free Gmail such as
`dma.website.alerts@gmail.com`, or a second Workspace user) arrives as a
normal, notifying email.

1. Create the sending account and sign in to it.
2. Turn on **2-Step Verification**: <https://myaccount.google.com/signinoptions/two-step-verification>.
   App passwords do not exist until it is on.
3. Create an **app password**: <https://myaccount.google.com/apppasswords>.
   Name it "Design Matters website". Google shows 16 letters in four groups.
4. Put these in `.env` on the server:

```
SMTP_USER="dma.website.alerts@gmail.com"
SMTP_PASS="abcd efgh ijkl mnop"
# Optional. Defaults to "Design Matters Architects <SMTP_USER>".
# MAIL_FROM="Design Matters Architects <dma.website.alerts@gmail.com>"
```

`SMTP_HOST` defaults to `smtp.gmail.com` and `SMTP_PORT` to `465`; set them
only for a non-Google mailbox. Spaces in the app password are ignored.

Limits: a free Gmail sends about 500 messages a day, Workspace 2,000. The
studio sends two per enquiry plus one reminder a day.

If the app password is ever revoked (or the account's password changes,
which revokes it), sends fail with "the mail account refused the sign-in",
shown on the enquiry and on **Email alerts**. Make a new app password and
update `.env`.

### Option B: Resend, sending from the studio's own domain

Branded (`studio@designmattersblr.com`) but needs three DNS records at
GoDaddy.

1. Sign up at <https://resend.com> with the studio's own address (Kiran
   should own this account, for recovery).
2. **Domains → Add Domain** → `designmattersblr.com`, then add the MX and two
   TXT records it shows. They sit on a `send.` subdomain, so the existing
   Google Workspace mail is unaffected. On Cloudflare, set them to
   "DNS only".
3. In `.env`:

```
RESEND_API_KEY="re_..."
MAIL_FROM="Design Matters Architects <studio@designmattersblr.com>"
```

If both are configured, **SMTP is used**.

### Either way

Restart the app (`pm2 restart dma --update-env`). Environment variables are
read at boot. Then open **Studio → Email alerts**: the delivery card should
say **Connected**, and **Send a test email** proves the whole path.

## 2. Choose who receives enquiries

**Studio → Email alerts**, in the dashboard. No deploy, no developer.

- **Who gets new enquiries**: any number of addresses. The panel states in
  a sentence where the next enquiry will actually go.
- **Email the studio when an enquiry arrives**: off is a legitimate choice;
  enquiries still land in the dashboard, marked as deliberately not emailed.
- **Send the enquirer a confirmation**: off if the studio would rather every
  first reply be written by hand.
- **Remind me about enquiries nobody has replied to**: one email a day
  listing enquiries still marked New after one, two or three days.
- **Send a test email**: one real alert, through the real template and
  provider.

With no address set there, alerts fall back to `LEAD_NOTIFY_TO` in `.env`,
then to the studio email under **Studio → Studio details**.

Every alert carries `Reply-To:` set to the enquirer, so hitting reply
writes to them directly, whichever account sent it.

## 3. Schedule the daily reminder

The reminder is sent by calling `POST /api/cron/lead-reminders` with a
shared secret. Add a secret to `.env`:

```
CRON_SECRET="<any long random string, e.g. openssl rand -hex 32>"
```

and a cron entry on the server, `/etc/cron.d/dma-lead-reminders`. The VPS
clock is UTC, so 04:30 is 10:00 in Bangalore:

```
30 4 * * * root curl -fsS -m 60 -X POST -H "Authorization: Bearer $(grep -oP '^CRON_SECRET="?\K[^"]+' /var/www/design-matters/.env)" http://127.0.0.1:3000/api/cron/lead-reminders >> /var/log/dma-lead-reminders.log 2>&1
```

What gets included: enquiries still at New, older than the chosen wait,
not reminded in the last 20 hours, reminded fewer than three times, and no
older than 30 days. Nothing waiting means no email. Calling it twice in a
day sends nothing the second time. Without `CRON_SECRET` the endpoint
refuses every call.

## 4. The logo

Put a PNG at `public/email/logo.png` and every email uses it in place of
the typeset "Design Matters" name. No code change.

- PNG only (Gmail and Outlook strip SVG).
- Dark artwork on a transparent or light background; it sits on the bone
  page colour above the card.
- About 3x the size it is shown at (it displays 34px tall, up to 220px
  wide), so roughly 100px tall.

The image is served from the site, so it must be deployed with the code
bundle, and the app restarted so it is picked up.

---

## What the studio receives

**The alert, per enquiry:** name, email and phone, what they are looking
for, budget, site location, the page they wrote from, the message, and
buttons: *Mark as contacted*, *Reply on WhatsApp*, *Reply by email*, plus
links for the other stages and the dashboard.

*Mark as contacted* works from a phone without logging in. The links are
signed, name one enquiry and one stage, expire after 14 days, and every use
is written to that enquiry's history.

**The acknowledgement, to the enquirer:** thanks, a photograph of the
studio's work, what they sent, and the phone number and WhatsApp.

**The reminder, daily when something is waiting:** each waiting enquiry
with how long it has waited and its own *Mark as contacted* button.

To see all three without sending anything:

```
npm run emails:preview     # writes .preview/*.html, open in a browser
```

## What the dashboard shows

Each enquiry's panel has a **Notification** section ("Emailed 13 Aug,
7:39 pm", or a red block with the reason and a **Send it now** button) and
a **History** trail: received, emailed, acknowledged, reminded, every stage
change, and whether a change came from the dashboard or from an email tap.

---

## Troubleshooting

Read the reason in the red **Notification** block first.

**"the mail account refused the sign-in"**: wrong or revoked app password,
or 2-Step Verification was turned off (which deletes app passwords). Make
a new app password.

**"the mail server could not be reached"**: outbound port 465 blocked, or a
wrong `SMTP_HOST`. On the VPS, `nc -vz smtp.gmail.com 465` should connect.

**"The domain is not verified"** (Resend): DNS not propagated or mistyped.

**"no sending account is configured"**: the app booted without `SMTP_USER`
and `SMTP_PASS` (or `RESEND_API_KEY`). Check `.env` and restart with
`--update-env`.

**Alerts arrive but the phone does not notify**: the sending account is the
same as the receiving one. See Option A; use a separate sender.

**Emails land in spam**: mark the first few "not spam". Rare over Gmail
SMTP, since Google authenticates the mail itself.

**The reminder never arrives**: check `/var/log/dma-lead-reminders.log`.
`{"sent":false,"reason":"nothing is waiting"}` is the normal quiet day.
A 401 means the secret in the cron line and `.env` differ; a 503 means
`CRON_SECRET` is not set.

**Rate limiting.** Five enquiries an hour from one IP address. Beyond that
the form says so and points at the phone number, and keeps what was typed.
The limit lives in process memory, which suits a single VPS.

## Testing

`scripts/e2e-studio-extended.ts` exercises the whole path against a local
production build, with a local SMTP sink standing in for Gmail: enquiry,
both emails, the one-tap link, the switches, Send it now, the reminder and
its secret. Nothing leaves the machine.

```
npm run build
EMAIL=… PASSWORD=… npm run test:studio:extended
```
