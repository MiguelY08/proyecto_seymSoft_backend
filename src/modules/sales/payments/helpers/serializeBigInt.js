/**
 * Convierte BigInt a string.
 */
export default function serializeBigInt(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "bigint" ? value.toString() : value;
}
