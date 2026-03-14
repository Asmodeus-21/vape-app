import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import getDb from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vapeshub-dev-secret-change-in-prod';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function createToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

/** Express middleware — attaches req.user if valid Bearer token present */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  req.user = payload;
  next();
}

/** Optional middleware — populates req.user if token present, doesn't fail if absent */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  token?: string;
  user?: { id: number; email: string; name: string; role: string };
}

export async function registerUser(email: string, password: string, name: string, role: string = 'customer'): Promise<RegisterResult> {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return { success: false, error: 'An account with this email already exists.' };
  }
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }
  const hash = await hashPassword(password);
  const validRole = ['customer', 'vendor', 'admin'].includes(role) ? role : 'customer';
  const stmt = db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)');
  const result = stmt.run(email.toLowerCase().trim(), hash, name.trim(), validRole);
  const userId = result.lastInsertRowid as number;
  const token = createToken({ userId, email: email.toLowerCase().trim(), role: validRole });
  return {
    success: true,
    token,
    user: { id: userId, email: email.toLowerCase().trim(), name: name.trim(), role: validRole },
  };
}

export async function loginUser(email: string, password: string): Promise<RegisterResult> {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;
  if (!user) {
    return { success: false, error: 'No account found with this email.' };
  }
  const match = await verifyPassword(password, user.password_hash);
  if (!match) {
    return { success: false, error: 'Incorrect password.' };
  }
  const token = createToken({ userId: user.id, email: user.email, role: user.role });
  return {
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}
