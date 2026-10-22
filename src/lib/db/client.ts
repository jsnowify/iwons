import "server-only";
import { MongoClient } from "mongodb";
import { z } from "zod";
import { unavailable } from "../judge0/errors";

const config = z.object({ MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//),
  MONGODB_DB: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/) });
const pooled = globalThis as typeof globalThis & { iwonsMongo?: Promise<MongoClient> };
export async function database() {
  const parsed = config.safeParse(process.env);
  if (!parsed.success) throw unavailable();
  if (!pooled.iwonsMongo) {
    const client = new MongoClient(parsed.data.MONGODB_URI, {
      maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 30_000,
      serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, waitQueueTimeoutMS: 5000,
    });
    pooled.iwonsMongo = client.connect().catch(error => {
      pooled.iwonsMongo = undefined;
      void client.close();
      throw error;
    });
  }
  return (await pooled.iwonsMongo).db(parsed.data.MONGODB_DB);
}
