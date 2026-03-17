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
exports.deletePsychologist = exports.updatePsychologist = exports.getPsychologistById = exports.getPsychologists = exports.getStudentById = exports.getStudents = exports.countUsuarios = exports.registerPsychologist = void 0;
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_controller_1 = require("./auth.controller");
/**
 * Register a new psychologist
 */
const registerPsychologist = async (req, res) => {
    try {
        // Validate request body
        const validationResult = auth_controller_1.registerSchema.safeParse(req.body);
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
            ciudad: userData.ciudad,
            edad: userData.edad,
            sexo: userData.sexo,
            id_rol: 2
        })
            .returning({
            id: schema_1.usuarios.id,
            correo: schema_1.usuarios.correo,
            nombres: schema_1.usuarios.nombres,
            apellidos: schema_1.usuarios.apellidos,
        });
        // Return user data and token
        res.status(201).json({
            message: 'Psicologo registrado exitosamente',
            user: newUser
        });
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.registerPsychologist = registerPsychologist;
/**
 * Get count of users with id_rol = 2, 3
 */
const countUsuarios = async (req, res) => {
    try {
        const result = await db_1.db
            .select({
            rol: schema.usuarios.id_rol,
            total: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema.usuarios)
            .where((0, drizzle_orm_1.sql) `id_rol in (2, 3)`) // Solo roles 2 (psicologo) y 3 (usuario)
            .groupBy(schema.usuarios.id_rol);
        // Convertimos resultado a objeto más claro
        const counts = {
            usuarios: result.find(r => r.rol === 3)?.total || 0,
            psicologos: result.find(r => r.rol === 2)?.total || 0,
        };
        res.json(counts);
    }
    catch (error) {
        console.error("Error contando usuarios y psicólogos:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
exports.countUsuarios = countUsuarios;
/**
 * Get all users with id_rol = 3
 */
const getStudents = async (req, res) => {
    try {
        const result = await db_1.db
            .select({
            id: schema.usuarios.id,
            nombres: schema.usuarios.nombres,
            correo: schema.usuarios.correo,
        })
            .from(schema.usuarios)
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id_rol, 3));
        res.json(result);
    }
    catch (error) {
        console.error("Error obteniendo estudiantes:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
exports.getStudents = getStudents;
/**
 * Get student by id
 */
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: "Falta el ID del estudiante" });
            return;
        }
        const [student] = await db_1.db
            .select({
            id: schema.usuarios.id,
            nombres: schema.usuarios.nombres,
            apellidos: schema.usuarios.apellidos,
            correo: schema.usuarios.correo,
            ciudad: schema.usuarios.ciudad,
            telefono: schema.usuarios.telefono,
            semestre_actual: schema.usuarios.semestre_actual,
            edad: schema.usuarios.edad,
            sexo: schema.usuarios.sexo,
            fecha_nacimiento: schema.usuarios.fecha_nacimiento
        })
            .from(schema.usuarios)
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, Number(id)))
            .limit(1);
        if (!student) {
            res.status(404).json({ message: "Estudiante no encontrado" });
            return;
        }
        res.json(student);
    }
    catch (error) {
        console.error("Error obteniendo estudiante:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
exports.getStudentById = getStudentById;
/**
 * Get all users with id_rol = 2
 */
const getPsychologists = async (req, res) => {
    try {
        const result = await db_1.db
            .select({
            id: schema.usuarios.id,
            nombres: schema.usuarios.nombres,
            apellidos: schema.usuarios.apellidos,
            correo: schema.usuarios.correo,
            ciudad: schema.usuarios.ciudad,
            telefono: schema.usuarios.telefono,
            edad: schema.usuarios.edad,
            sexo: schema.usuarios.sexo
        })
            .from(schema.usuarios)
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id_rol, 2));
        res.json(result);
    }
    catch (error) {
        console.error("Error obteniendo psicologos:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
exports.getPsychologists = getPsychologists;
/**
 * Get psychologist by id
 */
const getPsychologistById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: "Falta el ID del psicologo" });
            return;
        }
        const [psychologist] = await db_1.db
            .select({
            id: schema.usuarios.id,
            nombres: schema.usuarios.nombres,
            apellidos: schema.usuarios.apellidos,
            correo: schema.usuarios.correo,
            ciudad: schema.usuarios.ciudad,
            telefono: schema.usuarios.telefono,
            edad: schema.usuarios.edad,
            sexo: schema.usuarios.sexo
        })
            .from(schema.usuarios)
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, Number(id)))
            .limit(1);
        if (!psychologist) {
            res.status(404).json({ message: "Psicologo no encontrado" });
            return;
        }
        res.json(psychologist);
    }
    catch (error) {
        console.error("Error obteniendo psicologo:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
exports.getPsychologistById = getPsychologistById;
/**
 * Update psychologist by id
 */
const updatePsychologist = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombres, apellidos, correo, telefono, edad, ciudad } = req.body;
        const [updated] = await db_1.db
            .update(schema.usuarios)
            .set({
            nombres,
            apellidos,
            correo,
            telefono,
            edad,
            ciudad,
            updated_at: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, Number(id)))
            .returning(); // devuelve el registro actualizado
        if (!updated) {
            res.status(404).json({ message: "Psicólogo no encontrado" });
            return;
        }
        // 🔑 Excluir contraseña antes de enviar respuesta
        const { contrasena, ...userSinContrasena } = updated;
        res.json(userSinContrasena);
    }
    catch (error) {
        console.error("Error actualizando psicólogo:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
exports.updatePsychologist = updatePsychologist;
/**
 * Delete psychologist by id
 */
const deletePsychologist = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.db
            .delete(schema.usuarios)
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, Number(id)))
            .returning();
        if (result.length === 0) {
            res.status(404).json({ message: "Psicólogo no encontrado" });
            return;
        }
        res.json({ message: "Psicólogo eliminado correctamente" });
    }
    catch (error) {
        console.error("Error eliminando psicólogo:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
exports.deletePsychologist = deletePsychologist;
