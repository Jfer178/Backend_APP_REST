"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.getUserById = exports.deleteUser = exports.updateUserPatch = exports.updateUserPut = exports.createUser = exports.listUsers = void 0;
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const userCreateSchema = zod_1.z.object({
    nombres: zod_1.z.string().min(1),
    apellidos: zod_1.z.string().min(1),
    correo: zod_1.z.string().email(),
    contrasena: zod_1.z.string().min(6),
});
const userPutSchema = userCreateSchema;
const userPatchSchema = userCreateSchema.partial();
const listUsers = async (_req, res) => {
    try {
        const users = await db_1.db
            .select({
            id: schema.usuarios.id,
            correo: schema.usuarios.correo,
            nombres: schema.usuarios.nombres,
            apellidos: schema.usuarios.apellidos,
            id_rol: schema.usuarios.id_rol,
        })
            .from(schema.usuarios);
        res.json(users);
    }
    catch (error) {
        console.error('Error list users:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.listUsers = listUsers;
const createUser = async (req, res) => {
    try {
        const parsed = userCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [exists] = await db_1.db.select().from(schema.usuarios).where((0, drizzle_orm_1.eq)(schema.usuarios.correo, data.correo)).limit(1);
        if (exists) {
            res.status(409).json({ message: 'El correo ya está registrado' });
            return;
        }
        const hashed = await bcrypt_1.default.hash(data.contrasena, 10);
        const [created] = await db_1.db
            .insert(schema.usuarios)
            .values({ nombres: data.nombres, apellidos: data.apellidos, correo: data.correo, contrasena: hashed })
            .returning({ id: schema.usuarios.id, correo: schema.usuarios.correo, nombres: schema.usuarios.nombres, apellidos: schema.usuarios.apellidos });
        res.status(201).json(created);
    }
    catch (error) {
        console.error('Error create user:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createUser = createUser;
const updateUserPut = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (Number.isNaN(userId)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const parsed = userPutSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [existing] = await db_1.db.select().from(schema.usuarios).where((0, drizzle_orm_1.eq)(schema.usuarios.id, userId)).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        // Access: psicólogo o dueño
        if (req.user?.role !== 'psicologo' && req.user?.id !== userId) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const hashed = await bcrypt_1.default.hash(data.contrasena, 10);
        const [updated] = await db_1.db
            .update(schema.usuarios)
            .set({ nombres: data.nombres, apellidos: data.apellidos, correo: data.correo, contrasena: hashed, updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, userId))
            .returning({ id: schema.usuarios.id, correo: schema.usuarios.correo, nombres: schema.usuarios.nombres, apellidos: schema.usuarios.apellidos });
        res.json(updated);
    }
    catch (error) {
        console.error('Error put user:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateUserPut = updateUserPut;
const updateUserPatch = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (Number.isNaN(userId)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const parsed = userPatchSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const [existing] = await db_1.db.select().from(schema.usuarios).where((0, drizzle_orm_1.eq)(schema.usuarios.id, userId)).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        if (req.user?.role !== 'psicologo' && req.user?.id !== userId) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const data = parsed.data;
        const payload = { updated_at: new Date() };
        if (data.nombres !== undefined)
            payload.nombres = data.nombres;
        if (data.apellidos !== undefined)
            payload.apellidos = data.apellidos;
        if (data.correo !== undefined)
            payload.correo = data.correo;
        if (data.contrasena !== undefined)
            payload.contrasena = await bcrypt_1.default.hash(data.contrasena, 10);
        const [updated] = await db_1.db.update(schema.usuarios).set(payload).where((0, drizzle_orm_1.eq)(schema.usuarios.id, userId)).returning({ id: schema.usuarios.id, correo: schema.usuarios.correo, nombres: schema.usuarios.nombres, apellidos: schema.usuarios.apellidos });
        res.json(updated);
    }
    catch (error) {
        console.error('Error patch user:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateUserPatch = updateUserPatch;
const deleteUser = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (Number.isNaN(userId)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const [existing] = await db_1.db.select().from(schema.usuarios).where((0, drizzle_orm_1.eq)(schema.usuarios.id, userId)).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        if (req.user?.role !== 'psicologo') {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        await db_1.db.delete(schema.usuarios).where((0, drizzle_orm_1.eq)(schema.usuarios.id, userId));
        res.json({ message: 'Usuario eliminado' });
    }
    catch (error) {
        console.error('Error delete user:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.deleteUser = deleteUser;
const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const [user] = await db_1.db
            .select()
            .from(schema.usuarios)
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, Number(userId)))
            .limit(1);
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getUserById = getUserById;
/**
 * Get current authenticated user profile
 */
const getProfile = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const [user] = await db_1.db
            .select()
            .from(schema.usuarios)
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, req.user.id))
            .limit(1);
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        // Eliminamos la contraseña antes de devolver el usuario
        const { contrasena, ...userSinContrasena } = user;
        res.json(userSinContrasena);
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getProfile = getProfile;
