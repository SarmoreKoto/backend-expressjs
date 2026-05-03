import dotenv from 'dotenv';
dotenv.config(); // ✅ MUST BE FIRST

import app from './app';
import { connectDB } from './config/mongo_database';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});