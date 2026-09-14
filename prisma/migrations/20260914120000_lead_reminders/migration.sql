-- An enquiry still sitting at "New" is listed in a daily reminder email.
-- Each inclusion is written to the lead's timeline, which is also how the
-- reminder knows not to repeat itself the same day or nag forever.
ALTER TYPE "LeadEventType" ADD VALUE IF NOT EXISTS 'REMINDED';
