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
exports.deleteMensaje = exports.updateMensajePatch = exports.updateMensajePut = exports.createMensaje = exports.getMensajeById = exports.listMensajes = void 0;
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const mensajeSchema = zod_1.z.object({
    mensaje: zod_1.z.string().min(1),
    usuario_id: zod_1.z.number().optional(),
});
const mensajePatchSchema = mensajeSchema.partial();
function assertCanAccessChat(userId, chat) {
    if (!userId)
        return false;
    return chat.estudiante_id === userId || chat.psicologo_id === userId;
}
const listMensajes = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const chatId = Number(req.params.chatId);
        if (Number.isNaN(chatId)) {
            res.status(400).json({ message: 'chatId inválido' });
            return;
        }
        const [chat] = await db_1.db.select().from(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).limit(1);
        if (!chat) {
            res.status(404).json({ message: 'Chat no encontrado' });
            return;
        }
        if (!assertCanAccessChat(req.user.id, chat)) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const mensajes = await db_1.db.select().from(schema.mensajes_chat).where((0, drizzle_orm_1.eq)(schema.mensajes_chat.chat_id, chatId)).orderBy((0, drizzle_orm_1.desc)(schema.mensajes_chat.enviado_en));
        res.json(mensajes);
    }
    catch (error) {
        console.error('Error list mensajes:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.listMensajes = listMensajes;
const getMensajeById = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const chatId = Number(req.params.chatId);
        const mensajeId = Number(req.params.mensajeId);
        if (Number.isNaN(chatId) || Number.isNaN(mensajeId)) {
            res.status(400).json({ message: 'IDs inválidos' });
            return;
        }
        const [chat] = await db_1.db.select().from(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).limit(1);
        if (!chat) {
            res.status(404).json({ message: 'Chat no encontrado' });
            return;
        }
        if (!assertCanAccessChat(req.user.id, chat)) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const [mensaje] = await db_1.db.select().from(schema.mensajes_chat).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.mensajes_chat.id, mensajeId), (0, drizzle_orm_1.eq)(schema.mensajes_chat.chat_id, chatId))).limit(1);
        if (!mensaje) {
            res.status(404).json({ message: 'Mensaje no encontrado' });
            return;
        }
        res.json(mensaje);
    }
    catch (error) {
        console.error('Error get mensaje:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getMensajeById = getMensajeById;
const createMensaje = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const chatId = Number(req.params.chatId);
        if (Number.isNaN(chatId)) {
            res.status(400).json({ message: 'chatId inválido' });
            return;
        }
        const [chat] = await db_1.db.select().from(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).limit(1);
        if (!chat) {
            res.status(404).json({ message: 'Chat no encontrado' });
            return;
        }
        if (!assertCanAccessChat(req.user.id, chat)) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const parsed = mensajeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const usuarioId = data.usuario_id ?? req.user.id;
        const [created] = await db_1.db.insert(schema.mensajes_chat).values({
            chat_id: chatId,
            usuario_id: usuarioId,
            mensaje: data.mensaje,
        }).returning();
        // update chat last activity
        await db_1.db.update(schema.chats).set({ ultima_actividad: new Date() }).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId));
        res.status(201).json(created);
    }
    catch (error) {
        console.error('Error create mensaje:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createMensaje = createMensaje;
const updateMensajePut = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const chatId = Number(req.params.chatId);
        const mensajeId = Number(req.params.mensajeId);
        if (Number.isNaN(chatId) || Number.isNaN(mensajeId)) {
            res.status(400).json({ message: 'IDs inválidos' });
            return;
        }
        const [chat] = await db_1.db.select().from(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).limit(1);
        if (!chat) {
            res.status(404).json({ message: 'Chat no encontrado' });
            return;
        }
        if (!assertCanAccessChat(req.user.id, chat)) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const parsed = mensajeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [existing] = await db_1.db.select().from(schema.mensajes_chat).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.mensajes_chat.id, mensajeId), (0, drizzle_orm_1.eq)(schema.mensajes_chat.chat_id, chatId))).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Mensaje no encontrado' });
            return;
        }
        const [updated] = await db_1.db.update(schema.mensajes_chat).set({
            mensaje: data.mensaje,
            usuario_id: data.usuario_id ?? existing.usuario_id,
            updated_at: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema.mensajes_chat.id, mensajeId)).returning();
        res.json(updated);
    }
    catch (error) {
        console.error('Error put mensaje:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateMensajePut = updateMensajePut;
const updateMensajePatch = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const chatId = Number(req.params.chatId);
        const mensajeId = Number(req.params.mensajeId);
        if (Number.isNaN(chatId) || Number.isNaN(mensajeId)) {
            res.status(400).json({ message: 'IDs inválidos' });
            return;
        }
        const [chat] = await db_1.db.select().from(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).limit(1);
        if (!chat) {
            res.status(404).json({ message: 'Chat no encontrado' });
            return;
        }
        if (!assertCanAccessChat(req.user.id, chat)) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const parsed = mensajePatchSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [existing] = await db_1.db.select().from(schema.mensajes_chat).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.mensajes_chat.id, mensajeId), (0, drizzle_orm_1.eq)(schema.mensajes_chat.chat_id, chatId))).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Mensaje no encontrado' });
            return;
        }
        const payload = { updated_at: new Date() };
        if (data.mensaje !== undefined)
            payload.mensaje = data.mensaje;
        if (data.usuario_id !== undefined)
            payload.usuario_id = data.usuario_id;
        const [updated] = await db_1.db.update(schema.mensajes_chat).set(payload).where((0, drizzle_orm_1.eq)(schema.mensajes_chat.id, mensajeId)).returning();
        res.json(updated);
    }
    catch (error) {
        console.error('Error patch mensaje:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateMensajePatch = updateMensajePatch;
const deleteMensaje = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const chatId = Number(req.params.chatId);
        const mensajeId = Number(req.params.mensajeId);
        if (Number.isNaN(chatId) || Number.isNaN(mensajeId)) {
            res.status(400).json({ message: 'IDs inválidos' });
            return;
        }
        const [chat] = await db_1.db.select().from(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).limit(1);
        if (!chat) {
            res.status(404).json({ message: 'Chat no encontrado' });
            return;
        }
        if (!assertCanAccessChat(req.user.id, chat)) {
            res.status(403).json({ message: 'No autorizado' });
            return;
        }
        const [existing] = await db_1.db.select().from(schema.mensajes_chat).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.mensajes_chat.id, mensajeId), (0, drizzle_orm_1.eq)(schema.mensajes_chat.chat_id, chatId))).limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Mensaje no encontrado' });
            return;
        }
        await db_1.db.delete(schema.mensajes_chat).where((0, drizzle_orm_1.eq)(schema.mensajes_chat.id, mensajeId));
        res.json({ message: 'Mensaje eliminado' });
    }
    catch (error) {
        console.error('Error delete mensaje:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.deleteMensaje = deleteMensaje;
