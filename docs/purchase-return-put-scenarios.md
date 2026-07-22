# Escenarios manuales - PUT /api/purchase-returns/:id

Estos escenarios validan que el endpoint conserve su contrato y que las
mutaciones de detalles, stock y estados se comporten de forma atomica.

## Contrato base

Ruta:

```http
PUT /api/purchase-returns/:id
```

Body permitido:

```json
{
  "detailsToUpdate": [
    {
      "idPurchaseReturnDetail": 1,
      "idReturnStatus": 2
    }
  ],
  "detailsToAdd": [
    {
      "idPurchaseDetail": 10,
      "quantity": 1,
      "idReturnReason": 1,
      "idReturnMethod": 1,
      "supplierDate": "2026-06-22"
    }
  ]
}
```

Al menos uno de los arreglos debe venir con elementos.

## 1. Actualizar solo estados

Precondiciones:

- Existe una devolucion activa.
- El detalle esta en `Pend. envio`.
- El metodo del detalle es `Reemplazo`.

Request:

```json
{
  "detailsToUpdate": [
    {
      "idPurchaseReturnDetail": 1,
      "idReturnStatus": 2
    }
  ]
}
```

Resultado esperado:

- HTTP `200`.
- El detalle queda en `Pend. reemplazo`.
- No cambia el stock.
- La respuesta conserva `success`, `message` y `data`.

## 2. Agregar solo detalles

Precondiciones:

- La compra esta dentro del periodo de devolucion.
- El detalle de compra pertenece a la compra de la devolucion.
- Hay cantidad disponible por devolver.
- Hay stock suficiente en el barcode.

Request:

```json
{
  "detailsToAdd": [
    {
      "idPurchaseDetail": 10,
      "quantity": 1,
      "idReturnReason": 1,
      "idReturnMethod": 2
    }
  ]
}
```

Resultado esperado:

- HTTP `200`.
- Se crea un detalle en `Pend. envio`.
- El stock del barcode baja en `1`.
- La cabecera y la compra quedan recalculadas.

## 3. Actualizar estados y agregar detalles

Precondiciones:

- Hay un detalle actualizable.
- Hay otro detalle de compra disponible para agregar.

Request:

```json
{
  "detailsToUpdate": [
    {
      "idPurchaseReturnDetail": 1,
      "idReturnStatus": 2
    }
  ],
  "detailsToAdd": [
    {
      "idPurchaseDetail": 10,
      "quantity": 1,
      "idReturnReason": 3,
      "idReturnMethod": 1
    }
  ]
}
```

Resultado esperado:

- HTTP `200`.
- Se aplican ambas operaciones.
- Si falla cualquiera, no debe aplicarse ninguna.

## 4. Error al agregar despues de validar actualizaciones

Precondiciones:

- `detailsToUpdate` apunta a un cambio valido.
- `detailsToAdd` solicita mas cantidad de la disponible.

Request:

```json
{
  "detailsToUpdate": [
    {
      "idPurchaseReturnDetail": 1,
      "idReturnStatus": 2
    }
  ],
  "detailsToAdd": [
    {
      "idPurchaseDetail": 10,
      "quantity": 999,
      "idReturnReason": 1,
      "idReturnMethod": 1
    }
  ]
}
```

Resultado esperado:

- HTTP `409`.
- `errorCode` es `RETURN_QUANTITY_EXCEEDED` o `INSUFFICIENT_STOCK`.
- El detalle de `detailsToUpdate` no cambia.
- El stock no cambia.

## 5. Reemplazo pasa a Listo

Precondiciones:

- El detalle tiene metodo `Reemplazo`.
- El detalle esta en `Pend. reemplazo`.

Request:

```json
{
  "detailsToUpdate": [
    {
      "idPurchaseReturnDetail": 1,
      "idReturnStatus": 4
    }
  ]
}
```

Resultado esperado:

- HTTP `200`.
- El detalle queda en `Listo`.
- El stock del barcode sube por la cantidad del detalle.
- Si todos los detalles quedan listos, la cabecera queda en `Listo`.

## 6. Intentar modificar detalle ya Listo

Precondiciones:

- El detalle ya esta en `Listo`.

Request:

```json
{
  "detailsToUpdate": [
    {
      "idPurchaseReturnDetail": 1,
      "idReturnStatus": 2
    }
  ]
}
```

Resultado esperado:

- HTTP `409`.
- `errorCode` es `RETURN_DETAIL_ALREADY_READY`.
- No cambia stock ni estados.

## 7. Producto no conforme pasa a Listo

Precondiciones:

- El detalle tiene metodo `Prod. no conforme`.
- El detalle esta en `Pend. envio`.

Request:

```json
{
  "detailsToUpdate": [
    {
      "idPurchaseReturnDetail": 1,
      "idReturnStatus": 4
    }
  ]
}
```

Resultado esperado:

- HTTP `200`.
- El detalle queda en `Listo`.
- No se incrementa el stock.
- No se exige pasar por `Pend. reemplazo` ni `Pend. reembolso`.

## 8. Devolucion anulada

Precondiciones:

- La devolucion esta en estado `Anulada`.

Request:

```json
{
  "detailsToAdd": [
    {
      "idPurchaseDetail": 10,
      "quantity": 1,
      "idReturnReason": 1,
      "idReturnMethod": 1
    }
  ]
}
```

Resultado esperado:

- HTTP `409`.
- `errorCode` es `PURCHASE_RETURN_ANNULLED`.
- No cambia stock ni detalles.

## 9. Revalidacion fresca dentro de transaccion

Precondiciones:

- Dos solicitudes intentan agregar cantidad sobre el mismo detalle de compra.
- Entre la primera validacion y el commit, la cantidad disponible cambia.

Resultado esperado:

- Solo una solicitud debe aplicar cambios.
- La otra debe responder `409` con `RETURN_QUANTITY_EXCEEDED` o
  `INSUFFICIENT_STOCK`.
- No debe quedar una combinacion parcial de estado actualizado sin detalle
  agregado, ni stock descontado sin detalle creado.
