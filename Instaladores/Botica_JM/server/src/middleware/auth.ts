import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_botica_jm_2026';

export interface AuthRequest extends Request {
    userId?: number;
    userRole?: string;
    userPermissions?: any;
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
        req.userPermissions = decoded.permisos;
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

export const checkPermission = (modulo: string, accion: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        // ADMIN siempre tiene acceso
        if (req.userRole === 'ADMIN') {
            return next();
        }

        const permisos = req.userPermissions || {};
        const permisosModulo = permisos[modulo] || [];

        // Verificar si tiene el permiso específico o 'admin' en ese módulo (por si acaso)
        if (permisosModulo.includes(accion) || permisosModulo.includes('admin')) {
            return next();
        }

        return res.status(403).json({
            error: `Acceso denegado: Requiere permiso de '${accion}' en módulo '${modulo}'`
        });
    };
};
