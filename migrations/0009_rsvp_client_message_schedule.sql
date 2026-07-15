ALTER TABLE rsvp_client_messages ADD COLUMN schedule_token TEXT;

ALTER TABLE rsvp_client_messages ADD COLUMN scheduled_for TEXT;

CREATE INDEX IF NOT EXISTS rsvp_client_messages_schedule_idx
  ON rsvp_client_messages (status, scheduled_for);
