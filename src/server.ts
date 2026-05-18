import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/mongo_database';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on PORT ${PORT}`);
  });
});