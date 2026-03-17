import { Response } from 'express';
import { z } from 'zod';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  crearNotificacion,
  marcarComoLeida,
  obtenerNotificacionesUsuario,
  contarNotificacionesNoLeidas,
  obtenerPreferenciasUsuario,
  procesarTodasLasNotificaciones,
  enviarNotificacionesPendientes,
  TipoNotificacion,
  PrioridadNotificacion,
} from '../services/notificacion.service';
import { ejecutarJobManual, obtenerEstadoCronJobs } from '../jobs/notificacion.cron';

// ================================
// VALIDATION SCHEMAS
// ================================

const crearNotificacionSchema = z.object({
  usuario_id: z.number().int().positive(),
  tipo: z.enum(['recordatorio_uso', 'alerta_emocional', 'recomendacion_actividad', 'seguimiento_evaluacion']),
  titulo: z.string().min(1).max(255),
  mensaje: z.string().min(1),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']).optional(),
  datos_adicionales: z.record(z.any()).optional(),
  programada_para: z.string().datetime().optional(),
});

const actualizarPreferenciasSchema = z.object({
  recordatorios_uso: z.boolean().optional(),
  alertas_emocionales: z.boolean().optional(),
  recomendaciones_actividades: z.boolean().optional(),
  seguimientos_evaluacion: z.boolean().optional(),
  frecuencia_recordatorios: z.enum(['diario', 'semanal', 'desactivado']).optional(),
  hora_preferida_recordatorio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  notificaciones_email: z.boolean().optional(),
  notificaciones_push: z.boolean().optional(),
});

// ================================
// CONTROLLERS
// ================================

/**
 * Obtiene las notificaciones del usuario autenticado
 */
export const getNotificaciones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const soloNoLeidas = req.query.solo_no_leidas === 'true';
    const limite = parseInt(req.query.limite as string) || 50;

    const notificaciones = await obtenerNotificacionesUsuario(req.user.id, soloNoLeidas, limite);

    res.json({
      message: 'Notificaciones obtenidas exitosamente',
      data: notificaciones,
      total: notificaciones.length,
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Obtiene el conteo de notificaciones no leídas
 */
export const getConteoNoLeidas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const conteo = await contarNotificacionesNoLeidas(req.user.id);

    res.json({
      message: 'Conteo obtenido exitosamente',
      no_leidas: conteo,
    });
  } catch (error) {
    console.error('Error obteniendo conteo de notificaciones:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Marca una notificación como leída
 */
export const marcarLeida = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const notificacionId = parseInt(req.params.id);
    
    if (isNaN(notificacionId)) {
      res.status(400).json({ message: 'ID de notificación inválido' });
      return;
    }

    const notificacion = await marcarComoLeida(notificacionId, req.user.id);

    if (!notificacion) {
      res.status(404).json({ message: 'Notificación no encontrada' });
      return;
    }

    res.json({
      message: 'Notificación marcada como leída',
      data: notificacion,
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Marca todas las notificaciones como leídas
 */
export const marcarTodasLeidas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    // Actualizar todas las notificaciones no leídas del usuario
    const resultado = await db.update(schema.notificaciones)
      .set({
        leida: true,
        fecha_leida: new Date(),
        updated_at: new Date(),
      })
      .where(and(
        eq(schema.notificaciones.usuario_id, req.user.id),
        eq(schema.notificaciones.leida, false),
        isNull(schema.notificaciones.deleted_at)
      ));

    res.json({
      message: 'Todas las notificaciones marcadas como leídas',
      actualizadas: resultado.rowCount || 0,
    });
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Obtiene las preferencias de notificación del usuario
 */
export const getPreferencias = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const preferencias = await obtenerPreferenciasUsuario(req.user.id);

    res.json({
      message: 'Preferencias obtenidas exitosamente',
      data: preferencias,
    });
  } catch (error) {
    console.error('Error obteniendo preferencias:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Actualiza las preferencias de notificación del usuario
 */
export const actualizarPreferencias = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const validationResult = actualizarPreferenciasSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        message: 'Datos inválidos',
        errors: validationResult.error.errors,
      });
      return;
    }

    const [preferenciasActualizadas] = await db.update(schema.preferencias_notificacion)
      .set({
        ...validationResult.data,
        updated_at: new Date(),
      })
      .where(eq(schema.preferencias_notificacion.usuario_id, req.user.id))
      .returning();

    if (!preferenciasActualizadas) {
      // Si no existe, crear las preferencias
      const [nuevasPreferencias] = await db.insert(schema.preferencias_notificacion)
        .values({
          usuario_id: req.user.id,
          ...validationResult.data,
        })
        .returning();

      res.status(201).json({
        message: 'Preferencias creadas exitosamente',
        data: nuevasPreferencias,
      });
      return;
    }

    res.json({
      message: 'Preferencias actualizadas exitosamente',
      data: preferenciasActualizadas,
    });
  } catch (error) {
    console.error('Error actualizando preferencias:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Crea una nueva notificación (admin o sistema)
 */
export const crearNuevaNotificacion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const validationResult = crearNotificacionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        message: 'Datos inválidos',
        errors: validationResult.error.errors,
      });
      return;
    }

    const data = validationResult.data;

    const notificacion = await crearNotificacion({
      usuario_id: data.usuario_id,
      tipo: data.tipo as TipoNotificacion,
      titulo: data.titulo,
      mensaje: data.mensaje,
      prioridad: data.prioridad as PrioridadNotificacion | undefined,
      datos_adicionales: data.datos_adicionales,
      programada_para: data.programada_para ? new Date(data.programada_para) : undefined,
    });

    res.status(201).json({
      message: 'Notificación creada exitosamente',
      data: notificacion,
    });
  } catch (error) {
    console.error('Error creando notificación:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Elimina una notificación
 */
export const eliminarNotificacion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const notificacionId = parseInt(req.params.id);
    
    if (isNaN(notificacionId)) {
      res.status(400).json({ message: 'ID de notificación inválido' });
      return;
    }

    // Soft delete
    const [notificacionEliminada] = await db.update(schema.notificaciones)
      .set({ deleted_at: new Date() })
      .where(and(
        eq(schema.notificaciones.id, notificacionId),
        eq(schema.notificaciones.usuario_id, req.user.id),
        isNull(schema.notificaciones.deleted_at)
      ))
      .returning();

    if (!notificacionEliminada) {
      res.status(404).json({ message: 'Notificación no encontrada' });
      return;
    }

    res.json({
      message: 'Notificación eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// ================================
// ADMIN CONTROLLERS
// ================================

/**
 * Procesa notificaciones manualmente (admin)
 */
export const procesarNotificaciones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const resultado = await procesarTodasLasNotificaciones();

    res.json({
      message: 'Procesamiento completado',
      data: resultado,
    });
  } catch (error) {
    console.error('Error procesando notificaciones:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Envía notificaciones pendientes (admin)
 */
export const enviarPendientes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const resultado = await enviarNotificacionesPendientes();

    res.json({
      message: 'Envío completado',
      data: resultado,
    });
  } catch (error) {
    console.error('Error enviando notificaciones:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Obtiene estado de cronjobs (admin)
 */
export const getEstadoCronjobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const estado = obtenerEstadoCronJobs();

    res.json({
      message: 'Estado de cronjobs obtenido',
      data: estado,
    });
  } catch (error) {
    console.error('Error obteniendo estado de cronjobs:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Ejecuta un cronjob manualmente (admin)
 */
export const ejecutarCronjob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const { nombre } = req.body;

    if (!nombre) {
      res.status(400).json({ message: 'Nombre del job es requerido' });
      return;
    }

    const ejecutado = await ejecutarJobManual(nombre);

    if (!ejecutado) {
      res.status(404).json({ message: 'Job no encontrado' });
      return;
    }

    res.json({
      message: `Job ${nombre} ejecutado exitosamente`,
    });
  } catch (error) {
    console.error('Error ejecutando cronjob:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
