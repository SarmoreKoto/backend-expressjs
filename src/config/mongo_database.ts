import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let defaultDB: Db;

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) throw new Error('MONGODB_URI missing');

    client = new MongoClient(uri);
    await client.connect();

    defaultDB = client.db('user_auth'); // default DB

    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ DB Connection Error:', error);
    process.exit(1);
  }
};

// "getDB fetches all database separately right"
export const getDB = (dbName?: string): Db => {
  if (!client) throw new Error('DB not initialized');
  return dbName ? client.db(dbName) : defaultDB;
};

export const getClient = (): MongoClient => {
  if (!client) throw new Error('Client not initialized');
  return client;
};


// MongoClient (connected)
//         │
//         ├── getDB() → user_auth (default)
//         │
//         ├── getDB('db1') → db1
//         │
//         ├── getDB('db2') → db2
//         │
//         └── getClient().admin().listDatabases() → ALL DBs