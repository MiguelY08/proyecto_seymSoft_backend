import assert from "node:assert/strict";
import test from "node:test";

import { buildSaleCreatedNotification } from "../../src/modules/sales/vendings/use-cases/create.usecase.js";
import { createNotificationSchema } from "../../src/modules/notifications/validators/notificationValidators.js";

test("una venta con ID 42 genera la notificacion esperada", () => {
  const notification = buildSaleCreatedNotification({
    sale: { idSale: 42 },
    total: 82200,
  });

  assert.equal(notification.title, "Nueva venta registrada");
  assert.equal(notification.message, "Se registró la venta #42 por $82200.");
  assert.equal(notification.metadata.idSale, 42);
});

test("no permite crear una notificacion de venta sin ID", () => {
  assert.throws(
    () => buildSaleCreatedNotification({ sale: {}, total: 82200 }),
    /ID de la venta no esta disponible/
  );
});

test("rechaza mensajes de notificacion con valores invalidos", () => {
  for (const invalidValue of ["undefined", "null", "NaN"]) {
    assert.throws(
      () => createNotificationSchema.parse({
        idUser: 1,
        title: "Nueva venta registrada",
        message: `Se registró la venta #${invalidValue} por $82200.`,
      }),
      /mensaje de la notificacion contiene un valor invalido/
    );
  }
});
