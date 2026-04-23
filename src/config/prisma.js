// Prisma configuration

const { PrismaClient } = require("@prisma/client");

export const prisma = new PrismaClient({
    log: ["warn","error"],
}); 


