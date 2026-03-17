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
exports.deleteDiario = exports.updateDiarioPatch = exports.updateDiarioPut = exports.createDiario = exports.getDiarioById = exports.listDiario = void 0;
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const diarioSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1),
    contenido: zod_1.z.string().min(1),
    fecha: zod_1.z.string().datetime().optional(),
});
const diarioPatchSchema = diarioSchema.partial();
const listDiario = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const items = await db_1.db.select().from(schema.diario).where((0, drizzle_orm_1.eq)(schema.diario.usuario_id, req.user.id));
        res.json(items);
    }
    catch (error) {
        console.error('Error list diario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.listDiario = listDiario;
const getDiarioById = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const [item] = await db_1.db.select().from(schema.diario).where((0, drizzle_orm_1.eq)(schema.diario.id, id)).limit(1);
        if (!item) {
            res.status(404).json({ message: 'Entrada no encontrada' });
            return;
        }
        if (item.usuario_id !== req.user.id) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        res.json(item);
    }
    catch (error) {
        console.error('Error get diario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getDiarioById = getDiarioById;
const createDiario = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const parsed = diarioSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [created] = await db_1.db.insert(schema.diario).values({
            usuario_id: req.user.id,
            titulo: data.titulo,
            contenido: data.contenido,
            fecha: data.fecha ? new Date(data.fecha) : undefined,
        }).returning();
        res.status(201).json(created);
    }
    catch (error) {
        console.error('Error create diario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createDiario = createDiario;
const updateDiarioPut = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const id = Number(req.params.id);
        const parsed = diarioSchema.safeParse(req.body);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const [existing] = await db_1.db.select().from(schema.diario).where((0, drizzle_orm_1.eq)(schema.diario.id, id)).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Entrada no encontrada' });
            return;
        }
        if (existing.usuario_id !== req.user.id) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const data = parsed.data;
        const [updated] = await db_1.db.update(schema.diario).set({
            titulo: data.titulo,
            contenido: data.contenido,
            fecha: data.fecha ? new Date(data.fecha) : existing.fecha,
            updated_at: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema.diario.id, id)).returning();
        res.json(updated);
    }
    catch (error) {
        console.error('Error put diario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateDiarioPut = updateDiarioPut;
const updateDiarioPatch = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const id = Number(req.params.id);
        const parsed = diarioPatchSchema.safeParse(req.body);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const [existing] = await db_1.db.select().from(schema.diario).where((0, drizzle_orm_1.eq)(schema.diario.id, id)).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Entrada no encontrada' });
            return;
        }
        if (existing.usuario_id !== req.user.id) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const data = parsed.data;
        const payload = { updated_at: new Date() };
        if (data.titulo !== undefined)
            payload.titulo = data.titulo;
        if (data.contenido !== undefined)
            payload.contenido = data.contenido;
        if (data.fecha !== undefined)
            payload.fecha = data.fecha ? new Date(data.fecha) : null;
        const [updated] = await db_1.db.update(schema.diario).set(payload).where((0, drizzle_orm_1.eq)(schema.diario.id, id)).returning();
        res.json(updated);
    }
    catch (error) {
        console.error('Error patch diario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateDiarioPatch = updateDiarioPatch;
const deleteDiario = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const [existing] = await db_1.db.select().from(schema.diario).where((0, drizzle_orm_1.eq)(schema.diario.id, id)).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Entrada no encontrada' });
            return;
        }
        if (existing.usuario_id !== req.user.id) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        await db_1.db.delete(schema.diario).where((0, drizzle_orm_1.eq)(schema.diario.id, id));
        res.json({ message: 'Entrada eliminada' });
    }
    catch (error) {
        console.error('Error delete diario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.deleteDiario = deleteDiario;
