import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user_routes';
import authRoutes from './routes/auth_routes';
import collectionRoutes from './routes/collection_routes';


const app = express();

app.use(cors({
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collections', collectionRoutes);

export default app;