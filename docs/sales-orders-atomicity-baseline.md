# Línea base de atomicidad: Pedidos y Ventas

Fecha de revisión: 2026-08-12.

## Contrato objetivo

Una solicitud de negocio debe ser atómica respecto a sus datos persistentes: si cualquiera de sus escrituras falla, ningún cambio de esa solicitud debe quedar confirmado. Los correos, notificaciones y archivos externos no participan en una transacción de base de datos; se tratan como efectos posteriores o compensables.

## Mapa de flujos

| Flujo | Escrituras de negocio | Estado actual | Riesgo ante fallo intermedio | Prioridad |
| --- | --- | --- | --- | --- |
| Crear pedido pendiente | pedido, detalles, pagos iniciales, saldo a favor | Una transacción | Se revierte completamente | Cubierto |
| Editar pedido | cabecera y reemplazo de detalles | Una transacción | Se revierte completamente | Cubierto |
| Registrar pago parcial | pago, saldo a favor, estado de pago | Una transacción (`registerPartialPayment`) | Se revierte completamente | Cubierto |
| Completar pago y crear venta | último pago, saldo a favor, venta, crédito, estado, stock | Una transacción en `completeOrderPaymentAndCreateSale` | Se revierte completamente | Cubierto |
| Recuperar pedido pagado sin venta | venta, métodos de pago, crédito, stock, estado de pago | Una transacción de creación de venta | Se revierte completamente | Cubierto |
| Aprobar comprobante | pago, saldo a favor, venta, crédito, stock, estado y comprobante aprobado | Una transacción de pago/venta | Se revierte completamente | Cubierto |
| Rechazar comprobante | nuevo plazo y comprobante rechazado | Una transacción (`rejectPaymentReceiptAndResetDeadline`) | Se revierte completamente | Cubierto |
| Venta directa | pedido, detalles, pagos, saldo a favor, venta, crédito y stock | Una transacción (`createDirectSaleWithOrder`) | Se revierte completamente | Cubierto |
| Cancelar/expirar pedido | estado cancelado, motivo, saldo a favor | Una transacción | Se revierte completamente | Cubierto |
| Anular venta | estado venta/pedido, crédito, saldo a favor, stock | Una transacción | Se revierte completamente | Cubierto |
| Adjuntar comprobante | archivo externo y fila de comprobante | Compensación del archivo | Puede quedar archivo huérfano si la limpieza falla | Media |

## Límites y reglas de implementación

1. Las validaciones pueden hacerse antes de abrir la transacción, pero las comprobaciones que protegen saldo, crédito, stock y unicidad deben volver a comprobarse dentro de ella.
2. Una operación compuesta debe exponerse mediante un método de repositorio transaccional único; el caso de uso no debe encadenar commits independientes.
3. No se enviarán correos ni notificaciones dentro de transacciones. Su fallo no revierte datos de negocio.
4. Los archivos externos requieren compensación (borrado seguro) y registro para reintento; una transacción Prisma no puede revertirlos.
5. Las pruebas de este directorio se clasifican así:
   - Caracterización: documentan una inconsistencia actual reproducible.
   - Contrato: se activarán al implementar cada flujo y exigirán reversión total.

## Protección frente a concurrencia

- **Stock:** cada código de barras se descuenta con `updateMany` condicionado a `stock >= cantidad`; sólo una solicitud concurrente puede consumir la última unidad.
- **Saldo a favor:** se descuenta con `updateMany` condicionado a `credit_balance >= monto`; no puede quedar negativo por solicitudes simultáneas.
- **Cupo de crédito:** la fila del cliente se bloquea dentro de la transacción antes de recalcular la deuda activa y crear el crédito. Las ventas concurrentes del mismo cliente se serializan y la segunda operación observa el crédito ya confirmado por la primera.

## Efectos externos

- Correos y notificaciones se programan desde los controladores después de que la respuesta se confirma; no se ejecutan dentro de las transacciones de negocio y un fallo de entrega no revierte una operación válida.
- El comprobante se sube antes de crear su fila. Si falla la persistencia en la BD, el archivo se elimina hasta tres veces. Si no es posible, se registra el evento estructurado `ORPHAN_PAYMENT_RECEIPT_IMAGE` con pedido, bucket y URL para recuperación manual.
- Siguiente mejora: persistir esos eventos y los de notificación en una tabla **outbox**, procesada por un worker con reintentos, backoff e idempotencia. No se incluye todavía para evitar introducir una migración y proceso de ejecución nuevos sin su operación y monitoreo correspondientes.

## Orden de intervención

1. Pago parcial.
2. Pago final y recuperación de venta.
3. Revisión de comprobantes.
4. Venta directa.
5. Concurrencia y efectos externos.
