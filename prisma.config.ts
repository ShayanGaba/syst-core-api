import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import path from "path"; 

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: `ts-node ${path.join(__dirname, 'prisma', 'seed.ts')}`, 
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});