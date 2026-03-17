"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isPsicologo = exports.isUsuario = exports.authenticate = void 0;
// Config
const jwt_1 = require("../config/jwt");
// Constants
const roles_const_1 = require("../shared/const/roles.const");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded) {
            res.status(401).json({ message: 'Invalid or expired token' });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};
exports.authenticate = authenticate;
const isUsuario = (req, res, next) => {
    if (req.user?.role !== roles_const_1.ROLES.USUARIO.nombre) {
        res.status(403).json({ message: 'Access forbidden: User role required' });
        return;
    }
    next();
};
exports.isUsuario = isUsuario;
const isPsicologo = (req, res, next) => {
    if (req.user?.role !== roles_const_1.ROLES.PSICOLOGO.nombre) {
        res.status(403).json({ message: 'Access forbidden: Psychologist role required' });
        return;
    }
    next();
};
exports.isPsicologo = isPsicologo;
const isAdmin = (req, res, next) => {
    if (req.user?.role !== roles_const_1.ROLES.ADMIN.nombre) {
        res.status(403).json({ message: 'Access forbidden: Admin role required' });
        return;
    }
    next();
};
exports.isAdmin = isAdmin;
