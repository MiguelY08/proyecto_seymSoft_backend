CREATE TABLE "notifications" (
  "id_notification" SERIAL NOT NULL,
  "id_user" INTEGER NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "type" VARCHAR(30) NOT NULL DEFAULT 'info',
  "action_url" VARCHAR(500),
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id_notification")
);

ALTER TABLE "notifications"
  ADD CONSTRAINT "fk_notifications_user"
  FOREIGN KEY ("id_user")
  REFERENCES "users"("id_user")
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

CREATE INDEX "idx_notifications_user_read_created"
  ON "notifications"("id_user", "is_read", "created_at");

CREATE INDEX "idx_notifications_user_type"
  ON "notifications"("id_user", "type");

CREATE INDEX "idx_notifications_created_at"
  ON "notifications"("created_at");
