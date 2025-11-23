import dotenv from "dotenv";
import path from "path";

// force-load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET not found in .env file");
}
