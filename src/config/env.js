// Environment configuration
import dotenv from "dotenv";

dotenv.config();

const getOptionalList = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const normalizeUrl = (value, fallback) =>
  (value || fallback).trim().replace(/\/+$/, "");

const requiredEnv = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

const missingEnv = requiredEnv.filter((key) => {
  if (key === "JWT_ACCESS_SECRET") {
    return !process.env.JWT_ACCESS_SECRET && !process.env.JWT_SECRET;
  }

  return !process.env[key];
});

if (missingEnv.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnv.join(", ")}`
  );
}

export const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",
  FRONTEND_URL: normalizeUrl(process.env.FRONTEND_URL, "http://localhost:5173"),
  CORS_ORIGIN: getOptionalList(process.env.CORS_ORIGIN || process.env.FRONTEND_URL),
<<<<<<< HEAD
  LOCATION_CACHE_TTL_MINUTES:
    Number(process.env.LOCATION_CACHE_TTL_MINUTES) || 1440,
=======
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_SECURE:
    process.env.EMAIL_SECURE === "true" ||
    process.env.EMAIL_PORT === "465",
>>>>>>> 88e03c2c613e8ec432d1aded03f5d4fc22e252a0
};
