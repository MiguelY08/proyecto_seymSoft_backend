const WHITESPACE_PATTERN = /\s+/g;
const NUMERIC_PATTERN = /^\d+$/;

export const normalizeSpaces = (value) =>
  String(value ?? "")
    .trim()
    .replace(WHITESPACE_PATTERN, " ");

export const normalizeName = (value) =>
  normalizeSpaces(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

export const normalizeEmail = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export const normalizeNumericString = (value) =>
  String(value ?? "").trim();

export const isNumericString = (value) =>
  NUMERIC_PATTERN.test(normalizeNumericString(value));
