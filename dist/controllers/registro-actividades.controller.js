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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRegistro = exports.updateRegistroPatch = exports.updateRegistroPut = exports.createRegistro = exports.getRegistroById = exports.listRegistros = void 0;
const zod_1 = require("zod");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const createSchema = zod_1.z.object({
    opcion_id: zod_1.z.number().int().positive(),
    vencimiento: zod_1.z.coerce.date().optional(),
    fecha: zod_1.z.coerce.date().optional(),
    observaciones: zod_1.z.string().optional(),
});
const putSchema = createSchema;
const patchSchema = createSchema.partial();
const listRegistros = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'No autenticado' });
            return;
        }
        const registros = await db_1.db
            .select()
            .from(schema.registro_actividades_usuarios)
            .where((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.usuario_id, req.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema.registro_actividades_usuarios.fecha));
        res.json(registros);
    }
    catch (error) {
        console.error('Error list registros actividades:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.listRegistros = listRegistros;
const getRegistroById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        if (!req.user?.id) {
            res.status(401).json({ message: 'No autenticado' });
            return;
        }
        const [registro] = await db_1.db
            .select()
            .from(schema.registro_actividades_usuarios)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.id, id), (0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.usuario_id, req.user.id)))
            .limit(1);
        if (!registro) {
            res.status(404).json({ message: 'Registro no encontrado' });
            return;
        }
        res.json(registro);
    }
    catch (error) {
        console.error('Error get registro actividad:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getRegistroById = getRegistroById;
const createRegistro = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'No autenticado' });
            return;
        }
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [inserted] = await db_1.db
            .insert(schema.registro_actividades_usuarios)
            .values({
            usuario_id: req.user.id,
            opcion_id: data.opcion_id,
            vencimiento: data.vencimiento ?? new Date(),
            fecha: data.fecha ?? new Date(),
            observaciones: data.observaciones,
        })
            .returning();
        res.status(201).json(inserted);
    }
    catch (error) {
        console.error('Error create registro actividad:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createRegistro = createRegistro;
const updateRegistroPut = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        if (!req.user?.id) {
            res.status(401).json({ message: 'No autenticado' });
            return;
        }
        const parsed = putSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [existing] = await db_1.db
            .select({ id: schema.registro_actividades_usuarios.id })
            .from(schema.registro_actividades_usuarios)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.id, id), (0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.usuario_id, req.user.id)))
            .limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Registro no encontrado' });
            return;
        }
        const [updated] = await db_1.db
            .update(schema.registro_actividades_usuarios)
            .set({
            opcion_id: data.opcion_id,
            vencimiento: data.vencimiento ?? new Date(),
            fecha: data.fecha ?? new Date(),
            observaciones: data.observaciones,
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.id, id))
            .returning();
        res.json(updated);
    }
    catch (error) {
        console.error('Error put registro actividad:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateRegistroPut = updateRegistroPut;
const updateRegistroPatch = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        if (!req.user?.id) {
            res.status(401).json({ message: 'No autenticado' });
            return;
        }
        const parsed = patchSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [existing] = await db_1.db
            .select({ id: schema.registro_actividades_usuarios.id })
            .from(schema.registro_actividades_usuarios)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.id, id), (0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.usuario_id, req.user.id)))
            .limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Registro no encontrado' });
            return;
        }
        const payload = { updated_at: new Date() };
        if (data.opcion_id !== undefined)
            payload.opcion_id = data.opcion_id;
        if (data.vencimiento !== undefined)
            payload.vencimiento = data.vencimiento;
        if (data.fecha !== undefined)
            payload.fecha = data.fecha;
        if (data.observaciones !== undefined)
            payload.observaciones = data.observaciones;
        const [updated] = await db_1.db
            .update(schema.registro_actividades_usuarios)
            .set(payload)
            .where((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.id, id))
            .returning();
        res.json(updated);
    }
    catch (error) {
        console.error('Error patch registro actividad:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateRegistroPatch = updateRegistroPatch;
const deleteRegistro = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        if (!req.user?.id) {
            res.status(401).json({ message: 'No autenticado' });
            return;
        }
        const [existing] = await db_1.db
            .select({ id: schema.registro_actividades_usuarios.id })
            .from(schema.registro_actividades_usuarios)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.id, id), (0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.usuario_id, req.user.id)))
            .limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Registro no encontrado' });
            return;
        }
        await db_1.db.delete(schema.registro_actividades_usuarios).where((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.id, id));
        res.json({ message: 'Registro eliminado' });
    }
    catch (error) {
        console.error('Error delete registro actividad:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.deleteRegistro = deleteRegistro;
