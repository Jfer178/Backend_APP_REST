"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = exports.registerSchema = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("../config/jwt");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const roles_const_1 = require("../shared/const/roles.const");
// Validation schemas
exports.registerSchema = zod_1.z.object({
    nombres: zod_1.z.string().min(2, 'Nombre demasiado corto'),
    correo: zod_1.z.string().email('Correo inválido'),
    contrasena: zod_1.z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    apellidos: zod_1.z.string().min(2, 'Apellido demasiado corto'),
    telefono: zod_1.z.string().min(7, 'Teléfono inválido'),
    ciudad: zod_1.z.string().min(2, 'Ciudad demasiado corta'),
    edad: zod_1.z.number().min(0, 'Edad inválida'),
    sexo: zod_1.z.enum(['M', 'F']).optional(),
});
const loginSchema = zod_1.z.object({
    correo: zod_1.z.string().email('Correo inválido'),
    contrasena: zod_1.z.string(),
});
/**
 * Register a new user
 */
const register = async (req, res) => {
    try {
        // Validate request body
        const validationResult = exports.registerSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: 'Datos inválidos',
                errors: validationResult.error.errors
            });
            return;
        }
        const userData = validationResult.data;
        // Check if user already exists
        const existingUser = await db_1.db.select()
            .from(schema_1.usuarios)
            .where((0, drizzle_orm_1.eq)(schema_1.usuarios.correo, userData.correo))
            .limit(1);
        if (existingUser.length > 0) {
            res.status(400).json({ message: 'El correo ya está registrado' });
            return;
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(userData.contrasena, 10);
        // Create user - aseguramos que todos los campos requeridos están explícitamente establecidos
        const [newUser] = await db_1.db.insert(schema_1.usuarios)
            .values({
            correo: userData.correo,
            contrasena: hashedPassword,
            nombres: userData.nombres,
            apellidos: userData.apellidos,
            telefono: userData.telefono,
            edad: userData.edad,
            sexo: userData.sexo,
            id_rol: roles_const_1.ROLES.USUARIO.id
        })
            .returning({
            id: schema_1.usuarios.id,
            correo: schema_1.usuarios.correo,
            nombres: schema_1.usuarios.nombres,
            apellidos: schema_1.usuarios.apellidos,
        });
        // Generate token
        const token = (0, jwt_1.generateToken)({
            id: newUser.id,
            correo: newUser.correo,
            role: roles_const_1.ROLES.USUARIO.nombre // Cuando se quiera usar un rol por favor usar el objeto ROLES para mantener consistencia
        });
        // Return user data and token
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: newUser,
            token
        });
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.register = register;
/**
 * Login user or psychologist
 */
const login = async (req, res) => {
    try {
        // Validate request body
        const validationResult = loginSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: 'Datos inválidos',
                errors: validationResult.error.errors
            });
            return;
        }
        const { correo, contrasena } = validationResult.data;
        const results = await db_1.db.select()
            .from(schema_1.usuarios)
            .where((0, drizzle_orm_1.eq)(schema_1.usuarios.correo, correo))
            .limit(1);
        if (results.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        const user = results[0];
        const passwordMatch = await bcrypt_1.default.compare(contrasena, user.contrasena);
        if (!passwordMatch) {
            res.status(401).json({ message: 'Contraseña incorrecta' });
            return;
        }
        let rol;
        switch (user.id_rol) {
            case 1:
                rol = roles_const_1.ROLES.ADMIN.nombre;
                break;
            case 2:
                rol = roles_const_1.ROLES.PSICOLOGO.nombre;
                break;
            default: rol = roles_const_1.ROLES.USUARIO.nombre;
        }
        // Generate token
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            correo: user.correo,
            role: rol
        });
        // Return user data and token
        res.json({
            message: 'Inicio de sesión exitoso',
            user: {
                id: user.id,
                correo: user.correo,
                nombres: user.nombres,
                apellidos: user.apellidos,
            },
            token
        });
    }
    catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.login = login;
