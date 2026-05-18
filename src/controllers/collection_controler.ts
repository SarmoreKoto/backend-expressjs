import { Request, Response } from 'express';
import { getClient, getDB } from '../config/mongo_database';
import {
  successResponse,
  internalError,
  badRequest,
  conflict,
  notFound,
} from '../utils/response';

// ===============================
// 🔐 CONSTANTS
// ===============================
const SYSTEM_DBS = ['admin', 'local', 'config'];
const PROTECTED_DBS = ['admin', 'local', 'config', 'user_auth'];

const validateName = (name: string) => /^[a-zA-Z0-9_-]+$/.test(name);

// ===============================
// 🧠 TYPES
// ===============================
interface DbParams {
  dbName: string;
}

interface CollectionParams {
  dbName: string;
  collectionName: string;
}

interface CreateDbBody {
  dbName: string;
}

interface CreateCollectionBody {
  collectionName: string;
}

// ===============================
// ✅ GET ALL DATABASES
// ===============================
export const getDatabases = async (_req: Request, res: Response) => {
  try {
    const client = getClient();
    const admin = client.db().admin();

    const result = await admin.listDatabases();

    const filtered = result.databases
      .filter((db: any) => !SYSTEM_DBS.includes(db.name))
      .map((db: any) => ({
        name: db.name,
        size: db.sizeOnDisk,
        sizeMB: (db.sizeOnDisk / (1024 * 1024)).toFixed(2),
        empty: db.empty,
      }));

    res.json(successResponse('Databases fetched', filtered));
  } catch (error: any) {
    res.status(500).json(internalError(error.message));
  }
};

// ===============================
// ✅ CREATE DATABASE
// ===============================
export const createDatabase = async (
  req: Request<{}, {}, CreateDbBody>,
  res: Response
) => {
  try {
    const { dbName } = req.body;

    if (!dbName || !validateName(dbName)) {
      return res.status(400).json(badRequest('Valid dbName required'));
    }

    const db = getDB(dbName);

    await db.collection('init').insertOne({
      createdAt: new Date(),
    });

    res.json(successResponse(`Database '${dbName}' created`));
  } catch (error: any) {
    res.status(500).json(internalError(error.message));
  }
};

// ===============================
// ❌ DELETE DATABASE
// ===============================
export const deleteDatabase = async (
  req: Request<DbParams>,
  res: Response
) => {
  try {
    const { dbName } = req.params;

    if (!validateName(dbName)) {
      return res.status(400).json(badRequest('Invalid dbName'));
    }

    if (PROTECTED_DBS.includes(dbName)) {
      return res.status(400).json(badRequest('Cannot delete protected DB'));
    }

    const db = getDB(dbName);

    const collections = await db.listCollections().toArray();

    if (collections.length > 0) {
      return res.status(400).json(
        badRequest('Database not empty. Delete collections first')
      );
    }

    await db.dropDatabase();

    res.json(successResponse(`Database '${dbName}' deleted`));
  } catch (error: any) {
    res.status(500).json(internalError(error.message));
  }
};

// ===============================
// ✅ GET COLLECTIONS
// ===============================
export const getCollections = async (
  req: Request<DbParams>,
  res: Response
) => {
  try {
    const { dbName } = req.params;

    if (!validateName(dbName)) {
      return res.status(400).json(badRequest('Invalid dbName'));
    }

    const db = getDB(dbName);
    const collections = await db.listCollections().toArray();

    const formatted = collections
      .filter((col: any) => !col.name.startsWith('system.'))
      .map((col: any) => ({
        name: col.name,
        status: 'Active',
      }));

    res.json(successResponse('Collections fetched', formatted));
  } catch (error: any) {
    res.status(500).json(internalError(error.message));
  }
};

// ===============================
// ✅ CREATE COLLECTION
// ===============================
export const createCollection = async (
  req: Request<DbParams, {}, CreateCollectionBody>,
  res: Response
) => {
  try {
    const { dbName } = req.params;
    const { collectionName } = req.body;

    if (!collectionName || !validateName(collectionName)) {
      return res.status(400).json(badRequest('Valid collection name required'));
    }

    if (!validateName(dbName)) {
      return res.status(400).json(badRequest('Invalid dbName'));
    }

    const db = getDB(dbName);

    const exists = await db
      .listCollections({ name: collectionName })
      .toArray();

    if (exists.length) {
      return res.status(409).json(conflict('Collection already exists'));
    }

    await db.createCollection(collectionName);

    res.json(successResponse(`Collection '${collectionName}' created`));
  } catch (error: any) {
    res.status(500).json(internalError(error.message));
  }
};

// ===============================
// ❌ DELETE COLLECTION
// ===============================
export const deleteCollection = async (
  req: Request<CollectionParams>,
  res: Response
) => {
  try {
    const { dbName, collectionName } = req.params;

    if (!validateName(dbName) || !validateName(collectionName)) {
      return res.status(400).json(badRequest('Invalid name'));
    }

    const db = getDB(dbName);

    const exists = await db
      .listCollections({ name: collectionName })
      .toArray();

    if (!exists.length) {
      return res.status(404).json(notFound('Collection not found'));
    }

    await db.collection(collectionName).drop();

    res.json(successResponse(`Collection '${collectionName}' deleted`));
  } catch (error: any) {
    res.status(500).json(internalError(error.message));
  }
};

// ===============================
// ✅ INSERT DOCUMENT
// ===============================
export const insertDocument = async (
  req: Request<CollectionParams>,
  res: Response
) => {
  try {
    const { dbName, collectionName } = req.params;

    if (!validateName(dbName) || !validateName(collectionName)) {
      return res.status(400).json(badRequest('Invalid name'));
    }

    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json(badRequest('Request body is empty'));
    }

    const db = getDB(dbName);

    const exists = await db.listCollections({ name: collectionName }).toArray();
    if (!exists.length) {
      return res.status(404).json(notFound('Collection not found'));
    }

    const result = await db.collection(collectionName).insertOne({
      ...body,
      createdAt: new Date(),
    });

    res.json(successResponse('Document inserted', { insertedId: result.insertedId }));
  } catch (error: any) {
    res.status(500).json(internalError(error.message));
  }
};

// ===============================
// ✅ GET DOCUMENTS
// ===============================
export const getDocuments = async (
  req: Request<CollectionParams>,
  res: Response
) => {
  try {
    const { dbName, collectionName } = req.params;

    if (!validateName(dbName) || !validateName(collectionName)) {
      return res.status(400).json(badRequest('Invalid name'));
    }

    const db = getDB(dbName);

    const exists = await db.listCollections({ name: collectionName }).toArray();
    if (!exists.length) {
      return res.status(404).json(notFound('Collection not found'));
    }

    const documents = await db
      .collection(collectionName)
      .find({})
      .sort({ _id: -1 }) // newest first
      .limit(100)         // safety cap — remove if you want all
      .toArray();

    res.json(successResponse('Documents fetched', documents));
  } catch (error: any) {
    res.status(500).json(internalError(error.message));
  }
};

// ===============================
// ✅ UPDATE DOCUMENT  — ADD THIS to collection_controler.ts
// ===============================
// Also add to imports at the top: ObjectId from 'mongodb'
// import { ObjectId } from 'mongodb';

export const updateDocument = async (
  req: Request<CollectionParams & { documentId: string }>,
  res: Response
) => {
  try {
    const { dbName, collectionName, documentId } = req.params;

    if (!validateName(dbName) || !validateName(collectionName)) {
      return res.status(400).json(badRequest('Invalid name'));
    }

    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json(badRequest('Request body is empty'));
    }

    const db = getDB(dbName);

    // Remove _id from update body to avoid immutable field error
    const { _id, ...updateData } = body;

    const result = await db.collection(collectionName).updateOne(
      { _id: new Object(documentId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json(notFound('Document not found'));
    }

    res.json(successResponse('Document updated', { modifiedCount: result.modifiedCount }));
  } catch (error: any) {
    res.status(500).json(internalError(error.message));
  }
};

// ===============================
// ✅ DELETE DOCUMENT  — ADD THIS too
// ===============================
export const deleteDocument = async (
  req: Request<CollectionParams & { documentId: string }>,
  res: Response
) => {
  try {
    const { dbName, collectionName, documentId } = req.params;

    if (!validateName(dbName) || !validateName(collectionName)) {
      return res.status(400).json(badRequest('Invalid name'));
    }

    const db = getDB(dbName);

    const result = await db.collection(collectionName).deleteOne({
      _id: new Object(documentId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json(notFound('Document not found'));
    }

    res.json(successResponse('Document deleted'));
  } catch (error: any) {
    res.status(500).json(internalError(error.message));
  }
};