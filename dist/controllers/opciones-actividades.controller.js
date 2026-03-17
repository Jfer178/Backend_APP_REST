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
exports.deleteOpcion = exports.updateOpcionPatch = exports.updateOpcionPut = exports.createOpcion = exports.getOpcionById = exports.listOpciones = void 0;
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const optionSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1),
    descripcion: zod_1.z.string().optional(),
    url_imagen: zod_1.z.string().min(1),
});
const optionPatchSchema = optionSchema.partial();
const listOpciones = async (_req, res) => {
    try {
        const items = await db_1.db.select().from(schema.opciones_registro_actividades);
        res.json(items);
    }
    catch (error) {
        console.error('Error list opciones:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.listOpciones = listOpciones;
const getOpcionById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const [item] = await db_1.db.select().from(schema.opciones_registro_actividades).where((0, drizzle_orm_1.eq)(schema.opciones_registro_actividades.id, id)).limit(1);
        if (!item) {
            res.status(404).json({ message: 'Opción no encontrada' });
            return;
        }
        res.json(item);
    }
    catch (error) {
        console.error('Error get opción:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getOpcionById = getOpcionById;
const createOpcion = async (req, res) => {
    try {
        const parsed = optionSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [created] = await db_1.db.insert(schema.opciones_registro_actividades).values({
            nombre: data.nombre,
            descripcion: data.descripcion,
            url_imagen: data.url_imagen,
        }).returning();
        res.status(201).json(created);
    }
    catch (error) {
        console.error('Error create opción:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createOpcion = createOpcion;
const updateOpcionPut = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const parsed = optionSchema.safeParse(req.body);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [updated] = await db_1.db.update(schema.opciones_registro_actividades).set({
            nombre: data.nombre,
            descripcion: data.descripcion,
            url_imagen: data.url_imagen,
            updated_at: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema.opciones_registro_actividades.id, id)).returning();
        if (!updated) {
            res.status(404).json({ message: 'Opción no encontrada' });
            return;
        }
        res.json(updated);
    }
    catch (error) {
        console.error('Error put opción:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateOpcionPut = updateOpcionPut;
const updateOpcionPatch = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const parsed = optionPatchSchema.safeParse(req.body);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const payload = { updated_at: new Date() };
        if (data.nombre !== undefined)
            payload.nombre = data.nombre;
        if (data.descripcion !== undefined)
            payload.descripcion = data.descripcion;
        if (data.url_imagen !== undefined)
            payload.url_imagen = data.url_imagen;
        const [updated] = await db_1.db.update(schema.opciones_registro_actividades).set(payload).where((0, drizzle_orm_1.eq)(schema.opciones_registro_actividades.id, id)).returning();
        if (!updated) {
            res.status(404).json({ message: 'Opción no encontrada' });
            return;
        }
        res.json(updated);
    }
    catch (error) {
        console.error('Error patch opción:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateOpcionPatch = updateOpcionPatch;
const deleteOpcion = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const [deleted] = await db_1.db.delete(schema.opciones_registro_actividades).where((0, drizzle_orm_1.eq)(schema.opciones_registro_actividades.id, id)).returning();
        if (!deleted) {
            res.status(404).json({ message: 'Opción no encontrada' });
            return;
        }
        res.json({ message: 'Opción eliminada' });
    }
    catch (error) {
        console.error('Error delete opción:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.deleteOpcion = deleteOpcion;
