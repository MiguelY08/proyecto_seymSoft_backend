// Prisma configuration

import { PrismaClient } from "../../generated/prisma/index.js";

export const prisma = new PrismaClient({
  log: ["warn", "error"],
});
