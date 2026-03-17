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
exports.obtenerEstadoPsicologicoUsuario = exports.obtenerActividadesRecomendadas = exports.chatConIAAvanzado = exports.deleteChat = exports.updateChatPatch = exports.updateChatPut = exports.createChat = exports.getChatById = exports.listChats = exports.getHistorialChatIA = exports.chatConIA = exports.getChats = void 0;
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const ollama_service_1 = require("../services/ollama.service");
// Validation schema for messages
const mensajeSchema = zod_1.z.object({
    mensaje: zod_1.z.string().min(1, 'El mensaje no puede estar vacío')
});
// Validation schema for AI chat
const chatIASchema = zod_1.z.object({
    mensaje: zod_1.z.string().min(1, 'El mensaje no puede estar vacío'),
    contexto: zod_1.z.string().optional()
});
/**
 * Get all chats for the authenticated user
 */
const getChats = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const chats = await db_1.db
            .select()
            .from(schema.chats)
            .where((0, drizzle_orm_1.eq)(schema.chats.estudiante_id, req.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema.chats.ultima_actividad));
        res.json(chats);
    }
    catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getChats = getChats;
/**
 * Chat with AI using Ollama
 */
const chatConIA = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        // Validate request body
        const validationResult = chatIASchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: 'Datos inválidos',
                errors: validationResult.error.errors
            });
            return;
        }
        const { mensaje, contexto } = validationResult.data;
        try {
            const respuestaIA = await (0, ollama_service_1.chatWithOllama)(mensaje, contexto);
            res.json({
                mensaje_usuario: mensaje,
                respuesta_ia: respuestaIA.respuesta,
                timestamp: respuestaIA.timestamp,
                usuario_id: req.user.id
            });
        }
        catch (aiError) {
            console.error('Error en chat con IA:', aiError);
            res.status(503).json({
                message: 'Error comunicándose con el servicio de IA. Por favor, intenta nuevamente.'
            });
        }
    }
    catch (error) {
        console.error('Error in AI chat:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.chatConIA = chatConIA;
/**
 * Get AI chat history for user (if stored in future)
 */
const getHistorialChatIA = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        // For now, return empty history as we're not storing AI chats
        // This can be implemented later if needed
        res.json({
            message: 'Historial de chat con IA',
            historial: [],
            usuario_id: req.user.id
        });
    }
    catch (error) {
        console.error('Error fetching AI chat history:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getHistorialChatIA = getHistorialChatIA;
const chatCreateSchema = zod_1.z.object({
    estudiante_id: zod_1.z.number().int().positive(),
    psicologo_id: zod_1.z.number().int().positive(),
    iniciado_en: zod_1.z.coerce.date().optional(),
    is_active: zod_1.z.boolean().optional(),
});
const chatPutSchema = chatCreateSchema.extend({
    finalizado_en: zod_1.z.coerce.date().nullable().optional(),
    ultima_actividad: zod_1.z.coerce.date().optional(),
});
const chatPatchSchema = chatPutSchema.partial();
const listChats = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const onlyActive = req.query.active === 'true';
        let condition = (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema.chats.estudiante_id, req.user.id), (0, drizzle_orm_1.eq)(schema.chats.psicologo_id, req.user.id));
        if (onlyActive) {
            condition = (0, drizzle_orm_1.and)(condition, (0, drizzle_orm_1.eq)(schema.chats.is_active, true));
        }
        const chats = await db_1.db
            .select()
            .from(schema.chats)
            .where(condition)
            .orderBy((0, drizzle_orm_1.desc)(schema.chats.ultima_actividad));
        return res.json(chats);
    }
    catch (error) {
        console.error('Error list chats:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.listChats = listChats;
const getChatById = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const chatId = Number(req.params.chatId);
        if (Number.isNaN(chatId))
            return res.status(400).json({ message: 'ID inválido' });
        const [chat] = await db_1.db.select().from(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).limit(1);
        if (!chat)
            return res.status(404).json({ message: 'Chat no encontrado' });
        if (!(chat.estudiante_id === req.user.id || chat.psicologo_id === req.user.id))
            return res.status(403).json({ message: 'No autorizado' });
        return res.json(chat);
    }
    catch (error) {
        console.error('Error get chat:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getChatById = getChatById;
const createChat = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const parsed = chatCreateSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
        const data = parsed.data;
        // Only allow if user is participant
        if (req.user.id !== data.estudiante_id && req.user.id !== data.psicologo_id)
            return res.status(403).json({ message: 'No autorizado' });
        const now = new Date();
        const [created] = await db_1.db.insert(schema.chats).values({
            estudiante_id: data.estudiante_id,
            psicologo_id: data.psicologo_id,
            iniciado_en: data.iniciado_en ?? now,
            ultima_actividad: now,
            is_active: data.is_active ?? true,
        }).returning();
        return res.status(201).json(created);
    }
    catch (error) {
        console.error('Error create chat:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createChat = createChat;
const updateChatPut = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const chatId = Number(req.params.chatId);
        if (Number.isNaN(chatId))
            return res.status(400).json({ message: 'ID inválido' });
        const parsed = chatPutSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
        const [existing] = await db_1.db.select().from(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).limit(1);
        if (!existing)
            return res.status(404).json({ message: 'Chat no encontrado' });
        if (!(existing.estudiante_id === req.user.id || existing.psicologo_id === req.user.id))
            return res.status(403).json({ message: 'No autorizado' });
        const data = parsed.data;
        const [updated] = await db_1.db.update(schema.chats).set({
            estudiante_id: data.estudiante_id,
            psicologo_id: data.psicologo_id,
            iniciado_en: data.iniciado_en ?? existing.iniciado_en,
            ultima_actividad: data.ultima_actividad ?? new Date(),
            finalizado_en: data.finalizado_en ?? existing.finalizado_en ?? null,
            is_active: data.is_active ?? existing.is_active,
        }).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).returning();
        return res.json(updated);
    }
    catch (error) {
        console.error('Error put chat:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateChatPut = updateChatPut;
const updateChatPatch = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const chatId = Number(req.params.chatId);
        if (Number.isNaN(chatId))
            return res.status(400).json({ message: 'ID inválido' });
        const parsed = chatPatchSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
        const [existing] = await db_1.db.select().from(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).limit(1);
        if (!existing)
            return res.status(404).json({ message: 'Chat no encontrado' });
        if (!(existing.estudiante_id === req.user.id || existing.psicologo_id === req.user.id))
            return res.status(403).json({ message: 'No autorizado' });
        const data = parsed.data;
        const payload = {};
        if (data.estudiante_id !== undefined)
            payload.estudiante_id = data.estudiante_id;
        if (data.psicologo_id !== undefined)
            payload.psicologo_id = data.psicologo_id;
        if (data.iniciado_en !== undefined)
            payload.iniciado_en = data.iniciado_en;
        if (data.ultima_actividad !== undefined)
            payload.ultima_actividad = data.ultima_actividad;
        else
            payload.ultima_actividad = new Date();
        if (data.finalizado_en !== undefined)
            payload.finalizado_en = data.finalizado_en;
        if (data.is_active !== undefined)
            payload.is_active = data.is_active;
        const [updated] = await db_1.db.update(schema.chats).set(payload).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).returning();
        return res.json(updated);
    }
    catch (error) {
        console.error('Error patch chat:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateChatPatch = updateChatPatch;
const deleteChat = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Usuario no autenticado' });
        const chatId = Number(req.params.chatId);
        if (Number.isNaN(chatId))
            return res.status(400).json({ message: 'ID inválido' });
        const [existing] = await db_1.db.select().from(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId)).limit(1);
        if (!existing)
            return res.status(404).json({ message: 'Chat no encontrado' });
        if (!(existing.estudiante_id === req.user.id || existing.psicologo_id === req.user.id))
            return res.status(403).json({ message: 'No autorizado' });
        await db_1.db.delete(schema.mensajes_chat).where((0, drizzle_orm_1.eq)(schema.mensajes_chat.chat_id, chatId));
        await db_1.db.delete(schema.chats).where((0, drizzle_orm_1.eq)(schema.chats.id, chatId));
        return res.json({ message: 'Chat eliminado' });
    }
    catch (error) {
        console.error('Error delete chat:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.deleteChat = deleteChat;
// ================================
// FUNCIONES AVANZADAS DE IA
// ================================
// Helper functions para IA avanzada
const obtenerUltimaEvaluacion = async (usuarioId) => {
    const evaluacion = await db_1.db
        .select()
        .from(schema.evaluaciones)
        .where((0, drizzle_orm_1.eq)(schema.evaluaciones.usuario_id, usuarioId))
        .orderBy((0, drizzle_orm_1.desc)(schema.evaluaciones.fecha))
        .limit(1);
    return evaluacion[0] || null;
};
const obtenerRegistrosActividades = async (usuarioId, limit = 5) => {
    const actividades = await db_1.db
        .select({
        id: schema.registro_actividades_usuarios.id,
        opcion_id: schema.registro_actividades_usuarios.opcion_id,
        fecha: schema.registro_actividades_usuarios.fecha,
        observaciones: schema.registro_actividades_usuarios.observaciones,
        opcion: {
            nombre: schema.opciones_registro_actividades.nombre,
            descripcion: schema.opciones_registro_actividades.descripcion,
            url_imagen: schema.opciones_registro_actividades.url_imagen
        }
    })
        .from(schema.registro_actividades_usuarios)
        .leftJoin(schema.opciones_registro_actividades, (0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.opcion_id, schema.opciones_registro_actividades.id))
        .where((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.usuario_id, usuarioId))
        .orderBy((0, drizzle_orm_1.desc)(schema.registro_actividades_usuarios.fecha))
        .limit(limit);
    return actividades;
};
const obtenerRegistrosEmocionales = async (usuarioId, limit = 5) => {
    const emociones = await db_1.db
        .select({
        id: schema.registro_emocional.id,
        opcion_id: schema.registro_emocional.opcion_id,
        fecha: schema.registro_emocional.fecha,
        observaciones: schema.registro_emocional.observaciones,
        opcion: {
            nombre: schema.opciones_registro_emocional.nombre,
            descripcion: schema.opciones_registro_emocional.descripcion,
            puntaje: schema.opciones_registro_emocional.puntaje
        }
    })
        .from(schema.registro_emocional)
        .leftJoin(schema.opciones_registro_emocional, (0, drizzle_orm_1.eq)(schema.registro_emocional.opcion_id, schema.opciones_registro_emocional.id))
        .where((0, drizzle_orm_1.eq)(schema.registro_emocional.usuario_id, usuarioId))
        .orderBy((0, drizzle_orm_1.desc)(schema.registro_emocional.fecha))
        .limit(limit);
    return emociones;
};
const yaRecomendoFormulario = async (usuarioId) => {
    const mensajes = await db_1.db
        .select()
        .from(schema.mensajes_chat)
        .where((0, drizzle_orm_1.eq)(schema.mensajes_chat.usuario_id, usuarioId))
        .orderBy((0, drizzle_orm_1.desc)(schema.mensajes_chat.enviado_en))
        .limit(10);
    const frasesRecomendacion = [
        "completar la evaluación emocional",
        "evaluación emocional",
        "cuestionario emocional",
        "formulario de evaluación",
        "evaluación inicial",
        "cuestionario inicial",
        "evaluación psicológica",
        "formulario psicológico",
        "evaluar tu estado emocional",
        "completar el formulario",
        "realizar la evaluación"
    ];
    for (const mensaje of mensajes) {
        const respuestaLower = mensaje.mensaje.toLowerCase();
        for (const frase of frasesRecomendacion) {
            if (respuestaLower.includes(frase)) {
                return true;
            }
        }
    }
    return false;
};
const extraerTareasDelContenido = (contenido) => {
    const regex = /Bloque de tareas sugeridas:\s*(\[[\s\S]+?\])/;
    const match = contenido.match(regex);
    if (match) {
        try {
            return JSON.parse(match[1]);
        }
        catch (error) {
            console.error('Error al parsear tareas:', error);
            return [];
        }
    }
    return [];
};
/**
 * Chat avanzado con IA - versión mejorada
 */
const chatConIAAvanzado = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const validationResult = chatIASchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: 'Datos inválidos',
                errors: validationResult.error.errors
            });
            return;
        }
        const { mensaje, contexto } = validationResult.data;
        const usuarioId = req.user.id;
        // Obtener información del usuario
        const evaluacion = await obtenerUltimaEvaluacion(usuarioId);
        const actividades = await obtenerRegistrosActividades(usuarioId);
        const emociones = await obtenerRegistrosEmocionales(usuarioId);
        const recomendoFormulario = await yaRecomendoFormulario(usuarioId);
        // Construir contexto del usuario
        let contextoUsuario = '';
        if (evaluacion) {
            contextoUsuario += `\n📊 Estado emocional actual: ${evaluacion.estado_semaforo} (Puntaje: ${evaluacion.puntaje_total})\n`;
            if (evaluacion.observaciones) {
                contextoUsuario += `Observaciones: ${evaluacion.observaciones}\n`;
            }
        }
        if (actividades.length > 0) {
            contextoUsuario += `\n🏃 Actividades recientes:\n`;
            actividades.forEach(act => {
                contextoUsuario += `- ${act.opcion?.nombre || 'Actividad'}: ${act.fecha.toISOString().split('T')[0]}\n`;
            });
        }
        if (emociones.length > 0) {
            contextoUsuario += `\n😊 Registros emocionales recientes:\n`;
            emociones.forEach(em => {
                contextoUsuario += `- ${em.opcion?.nombre || 'Emoción'} (${em.opcion?.puntaje || 0}/10): ${em.fecha.toISOString().split('T')[0]}\n`;
            });
        }
        // Construir prompt base
        const promptBase = `
Actúa como un asistente terapéutico especializado en salud mental y bienestar emocional. Estás interactuando con un usuario que atraviesa un proceso de recuperación emocional. Tu propósito exclusivo es brindar apoyo conversacional empático, sin realizar diagnósticos clínicos ni emitir juicios.

⚠️ IMPORTANTE: Tu función está estrictamente limitada al contexto de salud mental. No puedes brindar información, consejos ni ayuda en temas que no sean emocionales o relacionados al bienestar personal.

📌 Temas estrictamente prohibidos (no debes responder sobre esto):
- Programación, código, desarrollo de software o IA
- Matemáticas, física o ciencia académica
- Ayuda en tareas, trabajos, exámenes o solución de ejercicios
- Historia, cultura general, geografía, idiomas o biología
- Tecnología, juegos, política o economía
- Opiniones sobre productos, gustos, películas o arte
- Religión, creencias personales o filosofía

⚠️ Si el usuario realiza una pregunta fuera del contexto emocional o busca ayuda en tareas, responde exclusivamente con una frase como alguna de las siguientes (elige la más adecuada):
1. "Mi función es acompañarte emocionalmente. ¿Quieres contarme cómo te has sentido últimamente?"
2. "Estoy aquí para escucharte y ayudarte en tu proceso emocional, ¿quieres que hablemos de cómo estás hoy?"
3. "Puedo ayudarte a entender lo que sientes o apoyarte si estás pasando por algo difícil. ¿Te gustaría que hablemos sobre eso?"
4. "No puedo ayudarte con ese tema, pero estoy aquí para hablar contigo sobre lo que sientes y cómo te afecta."
5. "Mi propósito no es resolver ejercicios ni responder preguntas técnicas, pero puedo escucharte si necesitas desahogarte."

✏️ Asegúrate de que tus respuestas varíen en longitud, estructura y tono. Algunas pueden ser breves y directas, otras un poco más reflexivas. No uses lenguaje robótico ni repitas frases.

🎯 Evita listas, repeticiones o respuestas artificiales. Sé humano, cercano, realista.

${contextoUsuario}

Usuario: ${mensaje}
`;
        let prompt = promptBase;
        // Agregar recomendación de formulario si es necesario
        if (!evaluacion && !recomendoFormulario) {
            prompt += `

⚠️ El usuario aún no ha completado su evaluación emocional inicial. 
Responde de forma empática, y al final incluye esta sugerencia (marcada para el sistema): 
[RECOMENDAR_FORMULARIO]`;
        }
        else if (evaluacion) {
            prompt += `

💡 Si consideras que es útil, incluye al final de tu respuesta un bloque con tareas sugeridas para el usuario en el siguiente formato JSON:
Bloque de tareas sugeridas:
[
  {
    "titulo": "...",
    "descripcion": "...",
    "prioridad": "alta|media|baja"
  },
  ...
]`;
        }
        // Llamar a la IA
        const respuestaIA = await (0, ollama_service_1.chatWithOllama)(prompt, contexto);
        // Procesar respuesta
        const mostrarSugerenciaFormulario = respuestaIA.respuesta.includes('[RECOMENDAR_FORMULARIO]');
        const contenidoLimpio = respuestaIA.respuesta.replace('[RECOMENDAR_FORMULARIO]', '').trim();
        // Extraer tareas si existen
        const tareas = extraerTareasDelContenido(contenidoLimpio);
        res.json({
            mensaje: {
                text: contenidoLimpio,
                isUser: false,
                esRecomendacion: mostrarSugerenciaFormulario
            },
            tareas_generadas: tareas,
            timestamp: respuestaIA.timestamp,
            usuario_id: usuarioId
        });
    }
    catch (error) {
        console.error('Error en chat con IA:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.chatConIAAvanzado = chatConIAAvanzado;
/**
 * Obtener actividades recomendadas para el usuario
 */
const obtenerActividadesRecomendadas = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const usuarioId = req.user.id;
        const evaluacion = await obtenerUltimaEvaluacion(usuarioId);
        // Obtener todas las opciones de actividades
        const opcionesActividades = await db_1.db
            .select()
            .from(schema.opciones_registro_actividades);
        // Obtener actividades ya realizadas por el usuario
        const actividadesRealizadas = await db_1.db
            .select({ opcion_id: schema.registro_actividades_usuarios.opcion_id })
            .from(schema.registro_actividades_usuarios)
            .where((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.usuario_id, usuarioId));
        const idsRealizadas = new Set(actividadesRealizadas.map(a => a.opcion_id));
        // Filtrar actividades no realizadas
        const actividadesDisponibles = opcionesActividades.filter(actividad => !idsRealizadas.has(actividad.id));
        // Recomendar basado en el estado emocional
        let recomendaciones = actividadesDisponibles;
        if (evaluacion) {
            switch (evaluacion.estado_semaforo) {
                case 'rojo':
                    // Actividades más relajantes y de autocuidado
                    recomendaciones = actividadesDisponibles.filter(a => a.nombre.toLowerCase().includes('relajación') ||
                        a.nombre.toLowerCase().includes('meditación') ||
                        a.nombre.toLowerCase().includes('respiración') ||
                        a.nombre.toLowerCase().includes('yoga'));
                    break;
                case 'amarillo':
                    // Actividades moderadas
                    recomendaciones = actividadesDisponibles.filter(a => !a.nombre.toLowerCase().includes('intenso') &&
                        !a.nombre.toLowerCase().includes('extremo'));
                    break;
                case 'verde':
                    // Cualquier actividad
                    recomendaciones = actividadesDisponibles;
                    break;
            }
        }
        res.json({
            actividades_recomendadas: recomendaciones.slice(0, 5), // Top 5
            estado_emocional: evaluacion?.estado_semaforo || 'sin_evaluar',
            total_disponibles: actividadesDisponibles.length
        });
    }
    catch (error) {
        console.error('Error obteniendo actividades:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.obtenerActividadesRecomendadas = obtenerActividadesRecomendadas;
/**
 * Obtener estado psicológico del usuario
 */
const obtenerEstadoPsicologicoUsuario = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const usuarioId = req.user.id;
        const evaluacion = await obtenerUltimaEvaluacion(usuarioId);
        if (!evaluacion) {
            res.json({
                tiene_evaluacion: false,
                mensaje: 'Aún no has completado tu evaluación emocional inicial'
            });
            return;
        }
        // Obtener estadísticas adicionales
        const totalActividades = await db_1.db
            .select({ count: schema.registro_actividades_usuarios.id })
            .from(schema.registro_actividades_usuarios)
            .where((0, drizzle_orm_1.eq)(schema.registro_actividades_usuarios.usuario_id, usuarioId));
        const totalEmociones = await db_1.db
            .select({ count: schema.registro_emocional.id })
            .from(schema.registro_emocional)
            .where((0, drizzle_orm_1.eq)(schema.registro_emocional.usuario_id, usuarioId));
        res.json({
            tiene_evaluacion: true,
            estado_actual: {
                nivel: evaluacion.estado_semaforo,
                puntaje: evaluacion.puntaje_total,
                observaciones: evaluacion.observaciones,
                fecha_evaluacion: evaluacion.fecha
            },
            estadisticas: {
                actividades_completadas: totalActividades.length,
                registros_emocionales: totalEmociones.length
            }
        });
    }
    catch (error) {
        console.error('Error obteniendo estado psicológico:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.obtenerEstadoPsicologicoUsuario = obtenerEstadoPsicologicoUsuario;
