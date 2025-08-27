import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load env variables
dotenv.config();

// Use the local PostgreSQL connection that matches db.ts
const LOCAL_DATABASE_URL = "postgres://postgres:Octamy%231234@127.0.0.1:5432/chillmandb";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: LOCAL_DATABASE_URL,
  },
});
