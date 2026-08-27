-- A notification the studio chose not to send is not a failed one.
-- Without its own value it would have to be recorded as NOTIFY_FAILED,
-- which paints every enquiry red while alerts are deliberately off.
ALTER TYPE "LeadEventType" ADD VALUE IF NOT EXISTS 'NOTIFY_SKIPPED';
