import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDB } from '../config/mongo_database';
import { v4 as uuidv4 } from 'uuid';
import { buildLoginResponse } from '../models/auth_model';
import { badRequest, internalError, unauthorized } from '../utils/response';

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(badRequest('Email and password are required'));
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json(unauthorized('Invalid email or password'));
    }

    // 🔐 Secure password comparison using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(unauthorized('Invalid email or password'));
    }

    const token = uuidv4();
    const sessionId = `sess_${uuidv4()}`;
    const createdAt = new Date().toISOString();
    const newFcmToken = uuidv4();

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { fcm_token: newFcmToken, updatedAt: createdAt } }
    );

    return res.json(
      buildLoginResponse(user, token, sessionId, createdAt, newFcmToken)
    );
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json(internalError('Internal server error'));
  }
};