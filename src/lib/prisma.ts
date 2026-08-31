import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

const connectionString = process.env.DATABASE_URL!;

// Limit connection pool size per serverless container.
// Serverless environments (like Vercel) spawn multiple lambda instances concurrently.
// Limiting each instance to max 2 connections and dropping idle connections quickly prevents
// exhausting PostgreSQL role limits (e.g. Locaweb limits per role/database).
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 2,
    idleTimeoutMillis: 1000,
    connectionTimeoutMillis: 5000,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;
globalForPrisma.pool = pool;
