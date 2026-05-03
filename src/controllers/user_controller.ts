import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDB } from '../config/mongo_database';
import {
  successResponse,
  created,
  badRequest,
  notFound,
  conflict,
  internalError,
} from '../utils/response';

interface Params {
  id: string;
}

// Helper to exclude password from user object
const excludePassword = (user: any) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * ✅ GET ALL USERS
 */
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const db = getDB();
    const users = await db
      .collection('users')
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.json(successResponse('Users fetched successfully', users));
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json(internalError());
  }
};

/**
 * ✅ GET USER BY ID
 */
export const getUserById = async (req: Request<Params>, res: Response) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json(badRequest('Invalid user ID'));
    }

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json(notFound('User not found'));
    }

    res.json(successResponse('User fetched successfully', user));
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json(internalError());
  }
};

/**
 * ✅ CREATE USER (Registration)
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { name, email, phone, password, status, role, avatar } = req.body;

    // 🔒 Validation
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json(badRequest('Name, email, and password are required'));
    }

    // 📧 Check for duplicate email
    const existingUser = await db.collection('users').findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json(conflict('An account with this email already exists'));
    }

    // 🔐 Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const now = new Date().toISOString();

    const userDocument = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      password: hashedPassword,
      status: status || 'active',
      role: role || 'User',
      avatar: avatar || '',
      fcm_token: '',
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('users').insertOne(userDocument);

    // 🚫 Don't return password
    const { password: _, ...userWithoutPassword } = userDocument;

    res.status(201).json(
      created('Account created successfully', {
        id: result.insertedId,
        ...userWithoutPassword,
      })
    );
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json(internalError());
  }
};

/**
 * ✅ UPDATE USER
 */
export const updateUser = async (req: Request<Params>, res: Response) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json(badRequest('Invalid user ID'));
    }

    const updateData = { ...req.body, updatedAt: new Date().toISOString() };

    // Prevent password update through this route
    delete updateData.password;

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json(notFound('User not found'));
    }

    res.json(successResponse('User updated successfully'));
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json(internalError());
  }
};

/**
 * ✅ DELETE USER
 */
export const deleteUser = async (req: Request<Params>, res: Response) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json(badRequest('Invalid user ID'));
    }

    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json(notFound('User not found'));
    }

    res.json(successResponse('User deleted successfully'));
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json(internalError());
  }
};