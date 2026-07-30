ALTER TABLE "credits"
  ADD COLUMN "overdue_notification_sent_at" TIMESTAMP(6);

CREATE INDEX "idx_credits_overdue_notification"
  ON "credits"("due_date", "remaining_balance", "overdue_notification_sent_at");

