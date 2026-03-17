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
exports.deleteRespuesta = exports.updateRespuestaPatch = exports.updateRespuestaPut = exports.createRespuesta = exports.getRespuestaById = exports.listRespuestas = void 0;
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const createSchema = zod_1.z.object({
    usuario_id: zod_1.z.number().optional(),
    encuesta_id: zod_1.z.number(),
    respuesta: zod_1.z.any(),
});
const putSchema = createSchema;
const patchSchema = createSchema.partial();
const listRespuestas = async (req, res) => {
    try {
        const { usuario_id, encuesta_id } = req.query;
        let q = db_1.db.select().from(schema.encuestasRespuestas);
        const conditions = [];
        if (req.user?.role === 'usuario') {
            conditions.push((0, drizzle_orm_1.eq)(schema.encuestasRespuestas.usuario_id, req.user.id));
        }
        else {
            if (usuario_id)
                conditions.push((0, drizzle_orm_1.eq)(schema.encuestasRespuestas.usuario_id, Number(usuario_id)));
        }
        if (encuesta_id)
            conditions.push((0, drizzle_orm_1.eq)(schema.encuestasRespuestas.encuesta_id, Number(encuesta_id)));
        if (conditions.length > 0) {
            q = q.where((0, drizzle_orm_1.and)(...conditions));
        }
        const items = await q;
        res.json(items);
    }
    catch (error) {
        console.error('Error list respuestas:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.listRespuestas = listRespuestas;
const getRespuestaById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const [item] = await db_1.db.select().from(schema.encuestasRespuestas).where((0, drizzle_orm_1.eq)(schema.encuestasRespuestas.id, id)).limit(1);
        if (!item) {
            res.status(404).json({ message: 'Respuesta no encontrada' });
            return;
        }
        if (req.user?.role === 'usuario' && item.usuario_id !== req.user.id) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        res.json(item);
    }
    catch (error) {
        console.error('Error get respuesta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getRespuestaById = getRespuestaById;
const createRespuesta = async (req, res) => {
    try {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const usuarioId = data.usuario_id ?? req.user?.id;
        if (!usuarioId) {
            res.status(400).json({ message: 'usuario_id requerido' });
            return;
        }
        const [created] = await db_1.db.insert(schema.encuestasRespuestas).values({
            usuario_id: usuarioId,
            encuesta_id: data.encuesta_id,
            respuesta: typeof data.respuesta === 'string' ? data.respuesta : JSON.stringify(data.respuesta),
        }).returning();
        res.status(201).json(created);
    }
    catch (error) {
        console.error('Error create respuesta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createRespuesta = createRespuesta;
const updateRespuestaPut = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const parsed = putSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [existing] = await db_1.db.select().from(schema.encuestasRespuestas).where((0, drizzle_orm_1.eq)(schema.encuestasRespuestas.id, id)).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Respuesta no encontrada' });
            return;
        }
        if (req.user?.role === 'usuario' && existing.usuario_id !== req.user.id) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const [updated] = await db_1.db.update(schema.encuestasRespuestas).set({
            usuario_id: data.usuario_id ?? existing.usuario_id,
            encuesta_id: data.encuesta_id,
            respuesta: typeof data.respuesta === 'string' ? data.respuesta : JSON.stringify(data.respuesta),
            updated_at: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema.encuestasRespuestas.id, id)).returning();
        res.json(updated);
    }
    catch (error) {
        console.error('Error put respuesta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateRespuestaPut = updateRespuestaPut;
const updateRespuestaPatch = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const parsed = patchSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [existing] = await db_1.db.select().from(schema.encuestasRespuestas).where((0, drizzle_orm_1.eq)(schema.encuestasRespuestas.id, id)).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Respuesta no encontrada' });
            return;
        }
        if (req.user?.role === 'usuario' && existing.usuario_id !== req.user.id) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const payload = { updated_at: new Date() };
        if (data.usuario_id !== undefined)
            payload.usuario_id = data.usuario_id;
        if (data.encuesta_id !== undefined)
            payload.encuesta_id = data.encuesta_id;
        if (data.respuesta !== undefined)
            payload.respuesta = typeof data.respuesta === 'string' ? data.respuesta : JSON.stringify(data.respuesta);
        const [updated] = await db_1.db.update(schema.encuestasRespuestas).set(payload).where((0, drizzle_orm_1.eq)(schema.encuestasRespuestas.id, id)).returning();
        res.json(updated);
    }
    catch (error) {
        console.error('Error patch respuesta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateRespuestaPatch = updateRespuestaPatch;
const deleteRespuesta = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const [existing] = await db_1.db.select().from(schema.encuestasRespuestas).where((0, drizzle_orm_1.eq)(schema.encuestasRespuestas.id, id)).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Respuesta no encontrada' });
            return;
        }
        if (req.user?.role === 'usuario' && existing.usuario_id !== req.user.id) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        await db_1.db.delete(schema.encuestasRespuestas).where((0, drizzle_orm_1.eq)(schema.encuestasRespuestas.id, id));
        res.json({ message: 'Respuesta eliminada' });
    }
    catch (error) {
        console.error('Error delete respuesta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.deleteRespuesta = deleteRespuesta;
