import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_botica_jm_2026';

export interface AuthRequest extends Request {
    userId?: number;
    userRole?: string;
}

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.userId = decoded.userId;
        req.userRole = decoded.rol;
        next();
    });
};

export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        next();
    };
};
