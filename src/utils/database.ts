import { type Db, MongoClient } from "mongodb";
import config from "../config";
import NodeCache from "node-cache";

let db: Db;
export const cacheClient: NodeCache = new NodeCache({ stdTTL: 45 });

async function initializeClient(): Promise<Db> {
  const client = await MongoClient.connect(config.DB_URI);

  return client.db();
}

export default async (): Promise<Db> => {
  if (!db) {
    db = await initializeClient();
  }
  return db;
};
