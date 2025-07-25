import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  driver: "pg", // ✅ driver hợp lệ
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});
