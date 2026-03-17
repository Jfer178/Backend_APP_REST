import { Response } from 'express';
import { z } from 'zod';
import { and, eq, desc, like, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { AuthRequest } from '../middleware/auth.middleware';
import { chatWithOllama } from '../services/ollama.service';

// Validation schema for messages
const mensajeSchema = z.object({
  mensaje: z.string().min(1, 'El mensaje no puede estar vacío')
});

// Validation schema for AI chat
const chatIASchema = z.object({
  mensaje: z.string().min(1, 'El mensaje no puede estar vacío'),
  contexto: z.string().optional()
});

/**
 * Get all chats for the authenticated user
 */
export const getChats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const chats = await db
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.estudiante_id, req.user.id as number))
      .orderBy(desc(schema.chats.ultima_actividad));

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Chat with AI using Ollama
 */
export const chatConIA = async (req: AuthRequest, res: Response): Promise<void> => {
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
      const respuestaIA = await chatWithOllama(mensaje, contexto);
      
      res.json({
        mensaje_usuario: mensaje,
        respuesta_ia: respuestaIA.respuesta,
        timestamp: respuestaIA.timestamp,
        usuario_id: req.user.id
      });

    } catch (aiError) {
      console.error('Error en chat con IA:', aiError);
      
      res.status(503).json({ 
        message: 'Error comunicándose con el servicio de IA. Por favor, intenta nuevamente.' 
      });
    }

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Get AI chat history for user (if stored in future)
 */
export const getHistorialChatIA = async (req: AuthRequest, res: Response): Promise<void> => {
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

  } catch (error) {
    console.error('Error fetching AI chat history:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
}; 

const chatCreateSchema = z.object({
  estudiante_id: z.number().int().positive(),
  psicologo_id: z.number().int().positive(),
  iniciado_en: z.coerce.date().optional(),
  is_active: z.boolean().optional(),
});

const chatPutSchema = chatCreateSchema.extend({
  finalizado_en: z.coerce.date().nullable().optional(),
  ultima_actividad: z.coerce.date().optional(),
});

const chatPatchSchema = chatPutSchema.partial();

export const listChats = async (req: AuthRequest, res: any) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const onlyActive = req.query.active === 'true';
    let condition = or(
      eq(schema.chats.estudiante_id, req.user.id as number),
      eq(schema.chats.psicologo_id, req.user.id as number)
    );
    if (onlyActive) {
      condition = and(condition, eq(schema.chats.is_active, true));
    }
    const chats = await db
      .select()
      .from(schema.chats)
      .where(condition)
      .orderBy(desc(schema.chats.ultima_actividad));
    return res.json(chats);
  } catch (error) {
    console.error('Error list chats:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}

export const getChatById = async (req: AuthRequest, res: any) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const chatId = Number(req.params.chatId);
    if (Number.isNaN(chatId)) return res.status(400).json({ message: 'ID inválido' });
    const [chat] = await db.select().from(schema.chats).where(eq(schema.chats.id, chatId)).limit(1);
    if (!chat) return res.status(404).json({ message: 'Chat no encontrado' });
    if (!(chat.estudiante_id === req.user.id || chat.psicologo_id === req.user.id)) return res.status(403).json({ message: 'No autorizado' });
    return res.json(chat);
  } catch (error) {
    console.error('Error get chat:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}

export const createChat = async (req: AuthRequest, res: any) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const parsed = chatCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
    const data = parsed.data;
    // Only allow if user is participant
    if (req.user.id !== data.estudiante_id && req.user.id !== data.psicologo_id) return res.status(403).json({ message: 'No autorizado' });
    const now = new Date();
    const [created] = await db.insert(schema.chats).values({
      estudiante_id: data.estudiante_id,
      psicologo_id: data.psicologo_id,
      iniciado_en: data.iniciado_en ?? now,
      ultima_actividad: now,
      is_active: data.is_active ?? true,
    }).returning();
    return res.status(201).json(created);
  } catch (error) {
    console.error('Error create chat:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}

export const updateChatPut = async (req: AuthRequest, res: any) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const chatId = Number(req.params.chatId);
    if (Number.isNaN(chatId)) return res.status(400).json({ message: 'ID inválido' });
    const parsed = chatPutSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
    const [existing] = await db.select().from(schema.chats).where(eq(schema.chats.id, chatId)).limit(1);
    if (!existing) return res.status(404).json({ message: 'Chat no encontrado' });
    if (!(existing.estudiante_id === req.user.id || existing.psicologo_id === req.user.id)) return res.status(403).json({ message: 'No autorizado' });
    const data = parsed.data;
    const [updated] = await db.update(schema.chats).set({
      estudiante_id: data.estudiante_id,
      psicologo_id: data.psicologo_id,
      iniciado_en: data.iniciado_en ?? existing.iniciado_en,
      ultima_actividad: data.ultima_actividad ?? new Date(),
      finalizado_en: data.finalizado_en ?? existing.finalizado_en ?? null,
      is_active: data.is_active ?? existing.is_active,
    }).where(eq(schema.chats.id, chatId)).returning();
    return res.json(updated);
  } catch (error) {
    console.error('Error put chat:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}

export const updateChatPatch = async (req: AuthRequest, res: any) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const chatId = Number(req.params.chatId);
    if (Number.isNaN(chatId)) return res.status(400).json({ message: 'ID inválido' });
    const parsed = chatPatchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
    const [existing] = await db.select().from(schema.chats).where(eq(schema.chats.id, chatId)).limit(1);
    if (!existing) return res.status(404).json({ message: 'Chat no encontrado' });
    if (!(existing.estudiante_id === req.user.id || existing.psicologo_id === req.user.id)) return res.status(403).json({ message: 'No autorizado' });
    const data = parsed.data;
    const payload: any = {};
    if (data.estudiante_id !== undefined) payload.estudiante_id = data.estudiante_id;
    if (data.psicologo_id !== undefined) payload.psicologo_id = data.psicologo_id;
    if (data.iniciado_en !== undefined) payload.iniciado_en = data.iniciado_en;
    if (data.ultima_actividad !== undefined) payload.ultima_actividad = data.ultima_actividad; else payload.ultima_actividad = new Date();
    if (data.finalizado_en !== undefined) payload.finalizado_en = data.finalizado_en;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    const [updated] = await db.update(schema.chats).set(payload).where(eq(schema.chats.id, chatId)).returning();
    return res.json(updated);
  } catch (error) {
    console.error('Error patch chat:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}

export const deleteChat = async (req: AuthRequest, res: any) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Usuario no autenticado' });
    const chatId = Number(req.params.chatId);
    if (Number.isNaN(chatId)) return res.status(400).json({ message: 'ID inválido' });
    const [existing] = await db.select().from(schema.chats).where(eq(schema.chats.id, chatId)).limit(1);
    if (!existing) return res.status(404).json({ message: 'Chat no encontrado' });
    if (!(existing.estudiante_id === req.user.id || existing.psicologo_id === req.user.id)) return res.status(403).json({ message: 'No autorizado' });
    await db.delete(schema.mensajes_chat).where(eq(schema.mensajes_chat.chat_id, chatId));
    await db.delete(schema.chats).where(eq(schema.chats.id, chatId));
    return res.json({ message: 'Chat eliminado' });
  } catch (error) {
    console.error('Error delete chat:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
}

// ================================
// FUNCIONES AVANZADAS DE IA
// ================================

// Helper functions para IA avanzada
const obtenerUltimaEvaluacion = async (usuarioId: number) => {
  const evaluacion = await db
    .select()
    .from(schema.evaluaciones)
    .where(eq(schema.evaluaciones.usuario_id, usuarioId))
    .orderBy(desc(schema.evaluaciones.fecha))
    .limit(1);
  
  return evaluacion[0] || null;
};

const obtenerRegistrosActividades = async (usuarioId: number, limit: number = 5) => {
  const actividades = await db
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
    .leftJoin(
      schema.opciones_registro_actividades,
      eq(schema.registro_actividades_usuarios.opcion_id, schema.opciones_registro_actividades.id)
    )
    .where(eq(schema.registro_actividades_usuarios.usuario_id, usuarioId))
    .orderBy(desc(schema.registro_actividades_usuarios.fecha))
    .limit(limit);
  
  return actividades;
};

const obtenerRegistrosEmocionales = async (usuarioId: number, limit: number = 5) => {
  const emociones = await db
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
    .leftJoin(
      schema.opciones_registro_emocional,
      eq(schema.registro_emocional.opcion_id, schema.opciones_registro_emocional.id)
    )
    .where(eq(schema.registro_emocional.usuario_id, usuarioId))
    .orderBy(desc(schema.registro_emocional.fecha))
    .limit(limit);
  
  return emociones;
};

const yaRecomendoFormulario = async (usuarioId: number): Promise<boolean> => {
  const mensajes = await db
    .select()
    .from(schema.mensajes_chat)
    .where(eq(schema.mensajes_chat.usuario_id, usuarioId))
    .orderBy(desc(schema.mensajes_chat.enviado_en))
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

const extraerTareasDelContenido = (contenido: string): any[] => {
  const regex = /Bloque de tareas sugeridas:\s*(\[[\s\S]+?\])/;
  const match = contenido.match(regex);
  
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      console.error('Error al parsear tareas:', error);
      return [];
    }
  }
  
  return [];
};

/**
 * Chat avanzado con IA - versión mejorada
 */
export const chatConIAAvanzado = async (req: AuthRequest, res: Response): Promise<void> => {
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
    } else if (evaluacion) {
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
    const respuestaIA = await chatWithOllama(prompt, contexto);

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

  } catch (error) {
    console.error('Error en chat con IA:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Obtener actividades recomendadas para el usuario
 */
export const obtenerActividadesRecomendadas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const usuarioId = req.user.id;
    const evaluacion = await obtenerUltimaEvaluacion(usuarioId);

    // Obtener todas las opciones de actividades
    const opcionesActividades = await db
      .select()
      .from(schema.opciones_registro_actividades);

    // Obtener actividades ya realizadas por el usuario
    const actividadesRealizadas = await db
      .select({ opcion_id: schema.registro_actividades_usuarios.opcion_id })
      .from(schema.registro_actividades_usuarios)
      .where(eq(schema.registro_actividades_usuarios.usuario_id, usuarioId));

    const idsRealizadas = new Set(actividadesRealizadas.map(a => a.opcion_id));

    // Filtrar actividades no realizadas
    const actividadesDisponibles = opcionesActividades.filter(
      actividad => !idsRealizadas.has(actividad.id)
    );

    // Recomendar basado en el estado emocional
    let recomendaciones = actividadesDisponibles;

    if (evaluacion) {
      switch (evaluacion.estado_semaforo) {
        case 'rojo':
          // Actividades más relajantes y de autocuidado
          recomendaciones = actividadesDisponibles.filter(a => 
            a.nombre.toLowerCase().includes('relajación') ||
            a.nombre.toLowerCase().includes('meditación') ||
            a.nombre.toLowerCase().includes('respiración') ||
            a.nombre.toLowerCase().includes('yoga')
          );
          break;
        case 'amarillo':
          // Actividades moderadas
          recomendaciones = actividadesDisponibles.filter(a => 
            !a.nombre.toLowerCase().includes('intenso') &&
            !a.nombre.toLowerCase().includes('extremo')
          );
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

  } catch (error) {
    console.error('Error obteniendo actividades:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Obtener estado psicológico del usuario
 */
export const obtenerEstadoPsicologicoUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const totalActividades = await db
      .select({ count: schema.registro_actividades_usuarios.id })
      .from(schema.registro_actividades_usuarios)
      .where(eq(schema.registro_actividades_usuarios.usuario_id, usuarioId));

    const totalEmociones = await db
      .select({ count: schema.registro_emocional.id })
      .from(schema.registro_emocional)
      .where(eq(schema.registro_emocional.usuario_id, usuarioId));

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

  } catch (error) {
    console.error('Error obteniendo estado psicológico:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};