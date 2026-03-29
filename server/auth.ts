import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getPostgresClient } from '../db/index.js';
import { findUserByEmail } from './postgres-repo.js';

function resolveJwtSecret(): string {
    const secret = process.env.JWT_SECRET?.trim();
    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production.');
    }
    return 'vapeshub-dev-secret-change-in-prod';
}

const JWT_SECRET = resolveJwtSecret();
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

export interface AuthPayload {
    userId: number;
    email: string;
    role: string;
    storeId: number | null;
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
    user?: { id: number; email: string; name: string; role: string; storeId: number | null };
}

export async function registerUser(
    email: string,
    password: string,
    name: string,
    role: string = 'customer',
    storeInput?: { name?: string; address?: string }
): Promise<RegisterResult> {
    const sql = getPostgresClient();
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await findUserByEmail(sql, normalizedEmail);
    if (existing) {
        return { success: false, error: 'An account with this email already exists.' };
    }
    if (password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters.' };
    }
    const hash = await hashPassword(password);
    const roleAliasMap: Record<string, string> = {
        store_manager: 'vendor',
        super_admin: 'admin',
    };
    const normalizedRoleInput = roleAliasMap[role] || role;
    const validRole = ['customer', 'vendor', 'admin'].includes(normalizedRoleInput) ? normalizedRoleInput : 'customer';
    const normalizedName = name.trim();

    let result: { userId: number; storeId: number | null };
    try {
        result = await sql.begin(async (tx) => {
            let storeId: number | null = null;

            if (validRole === 'vendor') {
                const storeName = storeInput?.name?.trim();
                if (!storeName || storeName.length < 3) {
                    throw new Error('Store name must be at least 3 characters.');
                }
                if (storeName.length > 100) {
                    throw new Error('Store name must be 100 characters or fewer.');
                }

                const storeAddressRaw = storeInput?.address?.trim() || null;
                if (storeAddressRaw && storeAddressRaw.length > 200) {
                    throw new Error('Store address must be 200 characters or fewer.');
                }

                const storeRows = await tx.unsafe<any[]>(
                    'INSERT INTO stores (name, address) VALUES ($1, $2) RETURNING id',
                    [storeName, storeAddressRaw]
                );
                storeId = Number(storeRows[0].id);
            }

            const userRows = await tx.unsafe<any[]>(
                'INSERT INTO users (email, password_hash, name, role, store_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [normalizedEmail, hash, normalizedName, validRole, storeId]
            );
            const userId = Number(userRows[0].id);

            if (storeId) {
                await tx.unsafe('UPDATE stores SET owner_id = $1 WHERE id = $2', [userId, storeId]);
            }

            return { userId, storeId };
        });
    } catch (err: any) {
        return { success: false, error: err?.message || 'Unable to create account.' };
    }

    const token = createToken({
        userId: result.userId,
        email: normalizedEmail,
        role: validRole,
        storeId: result.storeId,
    });

    return {
        success: true,
        token,
        user: { id: result.userId, email: normalizedEmail, name: normalizedName, role: validRole, storeId: result.storeId },
    };
}

export async function loginUser(email: string, password: string): Promise<RegisterResult> {
    const sql = getPostgresClient();
    const user = await findUserByEmail(sql, email.toLowerCase().trim());
    if (!user) {
        return { success: false, error: 'No account found with this email.' };
    }
    const match = await verifyPassword(password, user.password_hash);
    if (!match) {
        return { success: false, error: 'Incorrect password.' };
    }
    const token = createToken({ userId: user.id, email: user.email, role: user.role, storeId: user.store_id ?? null });
    return {
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, storeId: user.store_id ?? null },
    };
}
