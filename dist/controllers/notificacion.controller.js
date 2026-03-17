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
exports.ejecutarCronjob = exports.getEstadoCronjobs = exports.enviarPendientes = exports.procesarNotificaciones = exports.eliminarNotificacion = exports.crearNuevaNotificacion = exports.actualizarPreferencias = exports.getPreferencias = exports.marcarTodasLeidas = exports.marcarLeida = exports.getConteoNoLeidas = exports.getNotificaciones = void 0;
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const notificacion_service_1 = require("../services/notificacion.service");
const notificacion_cron_1 = require("../jobs/notificacion.cron");
// ================================
// VALIDATION SCHEMAS
// ================================
const crearNotificacionSchema = zod_1.z.object({
    usuario_id: zod_1.z.number().int().positive(),
    tipo: zod_1.z.enum(['recordatorio_uso', 'alerta_emocional', 'recomendacion_actividad', 'seguimiento_evaluacion']),
    titulo: zod_1.z.string().min(1).max(255),
    mensaje: zod_1.z.string().min(1),
    prioridad: zod_1.z.enum(['baja', 'normal', 'alta', 'urgente']).optional(),
    datos_adicionales: zod_1.z.record(zod_1.z.any()).optional(),
    programada_para: zod_1.z.string().datetime().optional(),
});
const actualizarPreferenciasSchema = zod_1.z.object({
    recordatorios_uso: zod_1.z.boolean().optional(),
    alertas_emocionales: zod_1.z.boolean().optional(),
    recomendaciones_actividades: zod_1.z.boolean().optional(),
    seguimientos_evaluacion: zod_1.z.boolean().optional(),
    frecuencia_recordatorios: zod_1.z.enum(['diario', 'semanal', 'desactivado']).optional(),
    hora_preferida_recordatorio: zod_1.z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    notificaciones_email: zod_1.z.boolean().optional(),
    notificaciones_push: zod_1.z.boolean().optional(),
});
// ================================
// CONTROLLERS
// ================================
/**
 * Obtiene las notificaciones del usuario autenticado
 */
const getNotificaciones = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const soloNoLeidas = req.query.solo_no_leidas === 'true';
        const limite = parseInt(req.query.limite) || 50;
        const notificaciones = await (0, notificacion_service_1.obtenerNotificacionesUsuario)(req.user.id, soloNoLeidas, limite);
        res.json({
            message: 'Notificaciones obtenidas exitosamente',
            data: notificaciones,
            total: notificaciones.length,
        });
    }
    catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getNotificaciones = getNotificaciones;
/**
 * Obtiene el conteo de notificaciones no leídas
 */
const getConteoNoLeidas = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const conteo = await (0, notificacion_service_1.contarNotificacionesNoLeidas)(req.user.id);
        res.json({
            message: 'Conteo obtenido exitosamente',
            no_leidas: conteo,
        });
    }
    catch (error) {
        console.error('Error obteniendo conteo de notificaciones:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getConteoNoLeidas = getConteoNoLeidas;
/**
 * Marca una notificación como leída
 */
const marcarLeida = async (req, res) => {
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
        const notificacion = await (0, notificacion_service_1.marcarComoLeida)(notificacionId, req.user.id);
        if (!notificacion) {
            res.status(404).json({ message: 'Notificación no encontrada' });
            return;
        }
        res.json({
            message: 'Notificación marcada como leída',
            data: notificacion,
        });
    }
    catch (error) {
        console.error('Error marcando notificación como leída:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.marcarLeida = marcarLeida;
/**
 * Marca todas las notificaciones como leídas
 */
const marcarTodasLeidas = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        // Actualizar todas las notificaciones no leídas del usuario
        const resultado = await db_1.db.update(schema.notificaciones)
            .set({
            leida: true,
            fecha_leida: new Date(),
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.notificaciones.usuario_id, req.user.id), (0, drizzle_orm_1.eq)(schema.notificaciones.leida, false), (0, drizzle_orm_1.isNull)(schema.notificaciones.deleted_at)));
        res.json({
            message: 'Todas las notificaciones marcadas como leídas',
            actualizadas: resultado.rowCount || 0,
        });
    }
    catch (error) {
        console.error('Error marcando todas las notificaciones como leídas:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.marcarTodasLeidas = marcarTodasLeidas;
/**
 * Obtiene las preferencias de notificación del usuario
 */
const getPreferencias = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const preferencias = await (0, notificacion_service_1.obtenerPreferenciasUsuario)(req.user.id);
        res.json({
            message: 'Preferencias obtenidas exitosamente',
            data: preferencias,
        });
    }
    catch (error) {
        console.error('Error obteniendo preferencias:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getPreferencias = getPreferencias;
/**
 * Actualiza las preferencias de notificación del usuario
 */
const actualizarPreferencias = async (req, res) => {
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
        const [preferenciasActualizadas] = await db_1.db.update(schema.preferencias_notificacion)
            .set({
            ...validationResult.data,
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.preferencias_notificacion.usuario_id, req.user.id))
            .returning();
        if (!preferenciasActualizadas) {
            // Si no existe, crear las preferencias
            const [nuevasPreferencias] = await db_1.db.insert(schema.preferencias_notificacion)
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
    }
    catch (error) {
        console.error('Error actualizando preferencias:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.actualizarPreferencias = actualizarPreferencias;
/**
 * Crea una nueva notificación (admin o sistema)
 */
const crearNuevaNotificacion = async (req, res) => {
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
        const notificacion = await (0, notificacion_service_1.crearNotificacion)({
            usuario_id: data.usuario_id,
            tipo: data.tipo,
            titulo: data.titulo,
            mensaje: data.mensaje,
            prioridad: data.prioridad,
            datos_adicionales: data.datos_adicionales,
            programada_para: data.programada_para ? new Date(data.programada_para) : undefined,
        });
        res.status(201).json({
            message: 'Notificación creada exitosamente',
            data: notificacion,
        });
    }
    catch (error) {
        console.error('Error creando notificación:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.crearNuevaNotificacion = crearNuevaNotificacion;
/**
 * Elimina una notificación
 */
const eliminarNotificacion = async (req, res) => {
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
        const [notificacionEliminada] = await db_1.db.update(schema.notificaciones)
            .set({ deleted_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.notificaciones.id, notificacionId), (0, drizzle_orm_1.eq)(schema.notificaciones.usuario_id, req.user.id), (0, drizzle_orm_1.isNull)(schema.notificaciones.deleted_at)))
            .returning();
        if (!notificacionEliminada) {
            res.status(404).json({ message: 'Notificación no encontrada' });
            return;
        }
        res.json({
            message: 'Notificación eliminada exitosamente',
        });
    }
    catch (error) {
        console.error('Error eliminando notificación:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.eliminarNotificacion = eliminarNotificacion;
// ================================
// ADMIN CONTROLLERS
// ================================
/**
 * Procesa notificaciones manualmente (admin)
 */
const procesarNotificaciones = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const resultado = await (0, notificacion_service_1.procesarTodasLasNotificaciones)();
        res.json({
            message: 'Procesamiento completado',
            data: resultado,
        });
    }
    catch (error) {
        console.error('Error procesando notificaciones:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.procesarNotificaciones = procesarNotificaciones;
/**
 * Envía notificaciones pendientes (admin)
 */
const enviarPendientes = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const resultado = await (0, notificacion_service_1.enviarNotificacionesPendientes)();
        res.json({
            message: 'Envío completado',
            data: resultado,
        });
    }
    catch (error) {
        console.error('Error enviando notificaciones:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.enviarPendientes = enviarPendientes;
/**
 * Obtiene estado de cronjobs (admin)
 */
const getEstadoCronjobs = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const estado = (0, notificacion_cron_1.obtenerEstadoCronJobs)();
        res.json({
            message: 'Estado de cronjobs obtenido',
            data: estado,
        });
    }
    catch (error) {
        console.error('Error obteniendo estado de cronjobs:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getEstadoCronjobs = getEstadoCronjobs;
/**
 * Ejecuta un cronjob manualmente (admin)
 */
const ejecutarCronjob = async (req, res) => {
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
        const ejecutado = await (0, notificacion_cron_1.ejecutarJobManual)(nombre);
        if (!ejecutado) {
            res.status(404).json({ message: 'Job no encontrado' });
            return;
        }
        res.json({
            message: `Job ${nombre} ejecutado exitosamente`,
        });
    }
    catch (error) {
        console.error('Error ejecutando cronjob:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.ejecutarCronjob = ejecutarCronjob;
