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
exports.deleteEncuesta = exports.updateEncuestaPatch = exports.updateEncuestaPut = exports.createEncuesta = exports.getEncuestaById = exports.listEncuestas = void 0;
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const encuestaSchema = zod_1.z.object({
    codigo: zod_1.z.string().min(1),
    titulo: zod_1.z.string().min(1),
    opciones: zod_1.z.any().optional(),
});
const encuestaPatchSchema = encuestaSchema.partial();
const listEncuestas = async (_req, res) => {
    try {
        const items = await db_1.db.select().from(schema.encuestas);
        res.json(items);
    }
    catch (error) {
        console.error('Error listing encuestas:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.listEncuestas = listEncuestas;
const getEncuestaById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const [item] = await db_1.db.select().from(schema.encuestas).where((0, drizzle_orm_1.eq)(schema.encuestas.id, id)).limit(1);
        if (!item) {
            res.status(404).json({ message: 'Encuesta no encontrada' });
            return;
        }
        res.json(item);
    }
    catch (error) {
        console.error('Error getting encuesta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getEncuestaById = getEncuestaById;
const createEncuesta = async (req, res) => {
    try {
        const parsed = encuestaSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [created] = await db_1.db.insert(schema.encuestas).values({
            codigo: data.codigo,
            titulo: data.titulo,
            opciones: data.opciones ? JSON.stringify(data.opciones) : null,
        }).returning();
        res.status(201).json(created);
    }
    catch (error) {
        console.error('Error creating encuesta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createEncuesta = createEncuesta;
const updateEncuestaPut = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const parsed = encuestaSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [updated] = await db_1.db.update(schema.encuestas).set({
            codigo: data.codigo,
            titulo: data.titulo,
            opciones: data.opciones ? JSON.stringify(data.opciones) : null,
            updated_at: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema.encuestas.id, id)).returning();
        if (!updated) {
            res.status(404).json({ message: 'Encuesta no encontrada' });
            return;
        }
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating encuesta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateEncuestaPut = updateEncuestaPut;
const updateEncuestaPatch = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const parsed = encuestaPatchSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const payload = { updated_at: new Date() };
        if (data.codigo !== undefined)
            payload.codigo = data.codigo;
        if (data.titulo !== undefined)
            payload.titulo = data.titulo;
        if (data.opciones !== undefined)
            payload.opciones = data.opciones ? JSON.stringify(data.opciones) : null;
        const [updated] = await db_1.db.update(schema.encuestas).set(payload).where((0, drizzle_orm_1.eq)(schema.encuestas.id, id)).returning();
        if (!updated) {
            res.status(404).json({ message: 'Encuesta no encontrada' });
            return;
        }
        res.json(updated);
    }
    catch (error) {
        console.error('Error patch encuesta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateEncuestaPatch = updateEncuestaPatch;
const deleteEncuesta = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const [deleted] = await db_1.db.delete(schema.encuestas).where((0, drizzle_orm_1.eq)(schema.encuestas.id, id)).returning();
        if (!deleted) {
            res.status(404).json({ message: 'Encuesta no encontrada' });
            return;
        }
        res.json({ message: 'Encuesta eliminada' });
    }
    catch (error) {
        console.error('Error deleting encuesta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.deleteEncuesta = deleteEncuesta;
