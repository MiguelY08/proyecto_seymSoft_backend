# Escenarios manuales - PATCH /api/purchase-returns/:id/annul

Estos escenarios validan que la anulacion de devoluciones de compra conserve
las reglas actuales y registre los nuevos datos de auditoria.

## Contrato base

Ruta:

```http
PATCH /api/purchase-returns/:id/annul
```

Body permitido:

```json
{
  "cancellationReason": "Motivo de anulacion"
}
```

El usuario anulador debe salir del token autenticado como `req.user.id_user`.
No debe enviarse `cancelledBy` en el body.

## Consulta base para revisar una devolucion

```sql
SELECT
  pr.id_purchase_return,
  pr.id_purchase,
  pr.id_return_status,
  pr.cancellation_reason,
  pr.cancelled_at,
  pr.cancelled_by
FROM purchases_returns pr
WHERE pr.id_purchase_return = :id_purchase_return;
```

## Consulta base para revisar auditoria

```sql
SELECT
  al.id_purchase_return_audit_log,
  al.id_purchase_return,
  al.id_user,
  al.action,
  al.previous_return_status,
  al.new_return_status,
  al.reason,
  al.metadata,
  al.created_at
FROM purchase_return_audit_logs al
WHERE al.id_purchase_return = :id_purchase_return
ORDER BY al.created_at DESC;
```

## 1. Anular devolucion activa

Precondiciones:

- Existe una devolucion de compra activa.
- La devolucion no tiene `id_return_status = 5`.
- El usuario autenticado tiene permiso `ANULAR` en `Devoluciones_en_compras`.

Request:

```json
{
  "cancellationReason": "Error registrado por el proveedor"
}
```

Resultado esperado:

- HTTP `200`.
- La cabecera `purchases_returns.id_return_status` queda en `5`.
- Todos los detalles `prd` de la devolucion quedan en `id_return_status = 5`.
- `purchases_returns.cancellation_reason` guarda el motivo enviado.
- `purchases_returns.cancelled_at` queda con fecha/hora.
- `purchases_returns.cancelled_by` queda con el usuario autenticado.
- Se crea un registro en `purchase_return_audit_logs`.

## 2. Restauracion de stock normal

Precondiciones:

- La devolucion tiene detalles que no son `Reemplazo` en estado `Listo`.
- Tomar nota del stock actual de cada barcode.

Consulta previa:

```sql
SELECT b.id_barcode, b.stock
FROM prd d
JOIN purchase_details pd ON pd.id_purchase_detail = d.id_purchase_detail
JOIN barcodes b ON b.id_barcode = pd.id_barcode
WHERE d.id_purchase_return = :id_purchase_return;
```

Resultado esperado:

- Al anular, el stock sube por la cantidad de cada detalle restaurable.
- La regla de disponibilidad de devoluciones sigue ignorando detalles anulados.

## 3. Reemplazo Listo no restaura stock

Precondiciones:

- La devolucion tiene un detalle con `id_return_method = 1` y `id_return_status = 4`.
- Tomar nota del stock del barcode antes de anular.

Resultado esperado:

- HTTP `200`.
- El detalle queda anulado.
- El stock de ese barcode no cambia por ese detalle.

## 4. No permite anular dos veces

Precondiciones:

- La devolucion ya tiene `id_return_status = 5`.

Request:

```json
{
  "cancellationReason": "Segundo intento"
}
```

Resultado esperado:

- HTTP `409`.
- `errorCode` es `PURCHASE_RETURN_ALREADY_ANNULLED`.
- No se crea un nuevo registro de auditoria.
- No cambia stock.

## 5. Motivo obligatorio

Request:

```json
{
  "cancellationReason": ""
}
```

Resultado esperado:

- HTTP `400`.
- La respuesta indica que el motivo de anulacion es obligatorio.
- No cambia stock, estados, cabecera ni auditoria.

## 6. No aceptar cancelledBy desde el body

Request:

```json
{
  "cancellationReason": "Motivo valido",
  "cancelledBy": 999
}
```

Resultado esperado:

- HTTP `400`.
- El body es rechazado por el validador estricto.
- `cancelled_by` no puede ser suplantado desde el cliente.

## 7. Recalculo de estado de compra

Precondiciones:

- La compra puede tener una o varias devoluciones asociadas.

Resultado esperado:

- Si quedan devoluciones activas y anuladas, la compra queda en `6`.
- Si solo quedan devoluciones anuladas, la compra queda en `5`.
- Si no aplica ninguna devolucion activa, se conserva el comportamiento actual
  de `calculatePurchaseStatusFromReturns`.

## 8. Respuesta de detalle

Luego de anular, consultar:

```http
GET /api/purchase-returns/:id
```

Resultado esperado:

- La respuesta incluye `cancellationReason`.
- La respuesta incluye `cancelledAt`.
- La respuesta incluye `cancelledBy`.
- La respuesta incluye `cancelledByUser`.
- La respuesta incluye `auditLogs`.
