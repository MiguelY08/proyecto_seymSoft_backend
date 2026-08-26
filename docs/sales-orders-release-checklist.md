# Validación y despliegue gradual: Pedidos y Ventas

## Validación completada localmente

- `npm test`: 21 pruebas exitosas; 3 contratos de integración permanecen pendientes de un entorno de BD aislado.
- Revisión sintáctica de repositorios y casos de uso modificados: correcta.
- `git diff --check`: sin errores de espacios.

## Pruebas obligatorias en staging

Usar un cliente de prueba, stock limitado y registros identificables. Tras cada prueba, consultar pedido, pagos, venta, crédito, saldo a favor y stock.

| Escenario | Inyección de fallo | Resultado esperado |
| --- | --- | --- |
| Pago parcial | Forzar error al actualizar pedido dentro de la transacción | No queda pago ni descuento de saldo a favor. |
| Pago final | Forzar error al crear venta, crédito o descontar stock | No queda último pago, venta, crédito ni cambio a Pagado. |
| Aprobación de comprobante | Forzar error al actualizar comprobante | No queda pago, venta, descuento de stock ni comprobante aprobado. |
| Rechazo de comprobante | Forzar error al actualizar comprobante | No cambia el plazo de pago. |
| Venta directa | Forzar error al crear venta, crédito o descontar stock | No queda pedido, detalle, pago ni saldo a favor descontado. |
| Stock concurrente | Dos ventas simultáneas por la última unidad | Sólo una tiene éxito; el stock nunca queda negativo. |
| Saldo a favor concurrente | Dos pagos simultáneos que exceden el saldo conjunto | Sólo operaciones cubiertas por el saldo tienen éxito; nunca queda negativo. |
| Crédito concurrente | Dos ventas simultáneas que, juntas, superan el cupo | La segunda se rechaza al recalcular el cupo. |
| Imagen huérfana | Forzar fallo de BD después de subir el archivo | La imagen se elimina; si falla 3 veces, aparece `ORPHAN_PAYMENT_RECEIPT_IMAGE` en logs. |

## Despliegue gradual

1. Crear o actualizar un entorno de staging con una copia anonimizada o datos de prueba y ejecutar la tabla anterior.
2. Confirmar una copia de seguridad recuperable de producción y que `npm run migrate:deploy` no contiene migraciones pendientes inesperadas.
3. Desplegar en una ventana de bajo tráfico. Render ejecutará `preDeployCommand: npm run db:deploy` y verificará `/api/health`.
4. Durante los primeros 30 minutos, vigilar:
   - respuestas 5xx y latencia de `POST /api/orders`, pagos, comprobantes y `POST /api/vendings`;
   - errores Prisma, especialmente timeout, deadlock y restricciones únicas;
   - errores `Stock insuficiente`, saldo a favor y cupo de crédito, comparados con el nivel normal;
   - eventos `ORPHAN_PAYMENT_RECEIPT_IMAGE`;
   - diferencia entre pedidos pagados y ventas asociadas.
5. Criterio de reversión: aumento sostenido de 5xx, deadlocks/timeouts, o inconsistencias de negocio. Revertir el release y conservar los logs e identificadores de pedidos afectados antes de reintentar.

## Limitación actual

El repositorio no incluye una base de datos de integración aislada ni un mecanismo de inyección de fallos de Prisma. Por ello los tres contratos de integración siguen como `todo`; deben activarse al provisionar staging para probar rollback real del motor de base de datos, no sólo los contratos de caso de uso.
