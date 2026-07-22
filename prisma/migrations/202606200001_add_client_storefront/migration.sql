CREATE TABLE "client_favorites" (
  "id_favorite" SERIAL NOT NULL,
  "id_client" INTEGER NOT NULL,
  "id_product" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_favorites_pkey" PRIMARY KEY ("id_favorite")
);

CREATE TABLE "shopping_cart_items" (
  "id_cart_item" SERIAL NOT NULL,
  "id_client" INTEGER NOT NULL,
  "id_product" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shopping_cart_items_pkey" PRIMARY KEY ("id_cart_item"),
  CONSTRAINT "shopping_cart_items_quantity_check" CHECK ("quantity" > 0)
);

CREATE TABLE "order_payment_receipts" (
  "id_order_payment_receipt" SERIAL NOT NULL,
  "id_order" INTEGER NOT NULL,
  "image_url" VARCHAR(500) NOT NULL,
  "file_name" VARCHAR(255),
  "observations" VARCHAR(255),
  "verification_status" VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  "uploaded_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_payment_receipts_pkey" PRIMARY KEY ("id_order_payment_receipt")
);

CREATE UNIQUE INDEX "uq_client_favorites_client_product"
  ON "client_favorites"("id_client", "id_product");
CREATE INDEX "idx_client_favorites_client"
  ON "client_favorites"("id_client");
CREATE INDEX "idx_client_favorites_product"
  ON "client_favorites"("id_product");

CREATE UNIQUE INDEX "uq_shopping_cart_items_client_product"
  ON "shopping_cart_items"("id_client", "id_product");
CREATE INDEX "idx_shopping_cart_items_client"
  ON "shopping_cart_items"("id_client");
CREATE INDEX "idx_shopping_cart_items_product"
  ON "shopping_cart_items"("id_product");

CREATE INDEX "idx_order_payment_receipts_id_order"
  ON "order_payment_receipts"("id_order");

ALTER TABLE "client_favorites"
  ADD CONSTRAINT "fk_client_favorites_client"
  FOREIGN KEY ("id_client") REFERENCES "clients"("id_client")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "client_favorites"
  ADD CONSTRAINT "fk_client_favorites_product"
  FOREIGN KEY ("id_product") REFERENCES "products"("id_product")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "shopping_cart_items"
  ADD CONSTRAINT "fk_shopping_cart_items_client"
  FOREIGN KEY ("id_client") REFERENCES "clients"("id_client")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "shopping_cart_items"
  ADD CONSTRAINT "fk_shopping_cart_items_product"
  FOREIGN KEY ("id_product") REFERENCES "products"("id_product")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "order_payment_receipts"
  ADD CONSTRAINT "fk_order_payment_receipts_order"
  FOREIGN KEY ("id_order") REFERENCES "sales_orders"("id_order")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "sale_return_details"
  ADD COLUMN "description" VARCHAR(255);
