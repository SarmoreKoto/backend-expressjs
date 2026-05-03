// import { Router } from 'express';
// import { getCollections } from '../controllers/collection_controler';

// const router = Router();

// router.get('/', getCollections);

// export default router;

import { Router } from 'express';
import {
  getDatabases,
  createDatabase,
  deleteDatabase,
  getCollections,
  createCollection,
  deleteCollection,
  insertDocument,    
} from '../controllers/collection_controler';

const router = Router();

// 🔹 DATABASE
router.get('/databases', getDatabases);
router.post('/databases', createDatabase);
router.delete('/databases/:dbName', deleteDatabase);

// 🔹 COLLECTION
router.get('/:dbName', getCollections);
router.post('/:dbName', createCollection);
router.delete('/:dbName/:collectionName', deleteCollection);

// 🔹 DOCUMENTS
router.post('/:dbName/:collectionName/documents', insertDocument); 

export default router;