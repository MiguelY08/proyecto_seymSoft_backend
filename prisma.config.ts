import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  generators: [
    {
      name: "client",
      provider: "@prisma/client",
      output: "node_modules/.prisma/client",
    },
  ],
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
