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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ejecutarJobManual = exports.obtenerEstadoCronJobs = exports.reiniciarCronJob = exports.detenerCronJob = exports.detenerCronJobs = exports.iniciarCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const notificacion_service_1 = require("../services/notificacion.service");
// Configuración de jobs
const cronJobs = [
    {
        name: 'notificaciones-procesamiento',
        schedule: '0 */6 * * *', // Cada 6 horas
        description: 'Procesa y genera notificaciones basadas en estado emocional y actividad de usuarios',
        enabled: process.env.ENABLE_NOTIFICATION_CRON !== 'false', // Habilitado por defecto
        task: async () => {
            console.log(`\n⏰ [${new Date().toISOString()}] Ejecutando job: Procesamiento de notificaciones`);
            await (0, notificacion_service_1.procesarTodasLasNotificaciones)();
        },
    },
    {
        name: 'notificaciones-envio',
        schedule: '*/5 * * * *', // Cada 5 minutos
        description: 'Envía notificaciones pendientes a usuarios',
        enabled: process.env.ENABLE_NOTIFICATION_CRON !== 'false',
        task: async () => {
            console.log(`\n⏰ [${new Date().toISOString()}] Ejecutando job: Envío de notificaciones`);
            await (0, notificacion_service_1.enviarNotificacionesPendientes)();
        },
    },
    {
        name: 'notificaciones-recordatorio-diario',
        schedule: '0 9 * * *', // Todos los días a las 9:00 AM
        description: 'Genera recordatorios diarios para usuarios inactivos',
        enabled: process.env.ENABLE_DAILY_REMINDERS !== 'false',
        task: async () => {
            console.log(`\n⏰ [${new Date().toISOString()}] Ejecutando job: Recordatorios diarios`);
            const { generarNotificacionesRecordatorioUso } = await Promise.resolve().then(() => __importStar(require('../services/notificacion.service')));
            await generarNotificacionesRecordatorioUso();
        },
    },
    {
        name: 'notificaciones-alerta-emocional',
        schedule: '0 */4 * * *', // Cada 4 horas
        description: 'Verifica estados emocionales críticos y genera alertas',
        enabled: process.env.ENABLE_EMOTIONAL_ALERTS !== 'false',
        task: async () => {
            console.log(`\n⏰ [${new Date().toISOString()}] Ejecutando job: Alertas emocionales`);
            const { generarNotificacionesAlertaEmocional } = await Promise.resolve().then(() => __importStar(require('../services/notificacion.service')));
            await generarNotificacionesAlertaEmocional();
        },
    },
    {
        name: 'notificaciones-seguimiento-evaluacion',
        schedule: '0 10 * * 1', // Cada lunes a las 10:00 AM
        description: 'Genera recordatorios de evaluación semanal',
        enabled: process.env.ENABLE_EVALUATION_REMINDERS !== 'false',
        task: async () => {
            console.log(`\n⏰ [${new Date().toISOString()}] Ejecutando job: Seguimiento de evaluaciones`);
            const { generarNotificacionesSeguimientoEvaluacion } = await Promise.resolve().then(() => __importStar(require('../services/notificacion.service')));
            await generarNotificacionesSeguimientoEvaluacion();
        },
    },
];
// ================================
// ALMACENAMIENTO DE JOBS ACTIVOS
// ================================
const activeJobs = new Map();
// ================================
// FUNCIONES DE GESTIÓN
// ================================
/**
 * Inicia todos los cronjobs configurados
 */
const iniciarCronJobs = () => {
    console.log('\n========================================');
    console.log('🚀 INICIANDO SISTEMA DE CRONJOBS');
    console.log('========================================\n');
    let iniciados = 0;
    let deshabilitados = 0;
    for (const jobConfig of cronJobs) {
        if (!jobConfig.enabled) {
            console.log(`⏭️  Job deshabilitado: ${jobConfig.name}`);
            deshabilitados++;
            continue;
        }
        try {
            // Validar expresión cron
            if (!node_cron_1.default.validate(jobConfig.schedule)) {
                console.error(`❌ Expresión cron inválida para ${jobConfig.name}: ${jobConfig.schedule}`);
                continue;
            }
            // Crear y iniciar el job
            const task = node_cron_1.default.schedule(jobConfig.schedule, async () => {
                try {
                    await jobConfig.task();
                }
                catch (error) {
                    console.error(`❌ Error en job ${jobConfig.name}:`, error);
                }
            });
            activeJobs.set(jobConfig.name, task);
            iniciados++;
            console.log(`✅ Job iniciado: ${jobConfig.name}`);
            console.log(`   Schedule: ${jobConfig.schedule}`);
            console.log(`   Descripción: ${jobConfig.description}\n`);
        }
        catch (error) {
            console.error(`❌ Error iniciando job ${jobConfig.name}:`, error);
        }
    }
    console.log('========================================');
    console.log(`📊 Resumen:`);
    console.log(`   Jobs iniciados: ${iniciados}`);
    console.log(`   Jobs deshabilitados: ${deshabilitados}`);
    console.log('========================================\n');
};
exports.iniciarCronJobs = iniciarCronJobs;
/**
 * Detiene todos los cronjobs activos
 */
const detenerCronJobs = () => {
    console.log('\n🛑 Deteniendo todos los cronjobs...');
    for (const [name, task] of activeJobs) {
        try {
            task.stop();
            console.log(`✅ Job detenido: ${name}`);
        }
        catch (error) {
            console.error(`❌ Error deteniendo job ${name}:`, error);
        }
    }
    activeJobs.clear();
    console.log('✅ Todos los cronjobs han sido detenidos\n');
};
exports.detenerCronJobs = detenerCronJobs;
/**
 * Detiene un cronjob específico
 */
const detenerCronJob = (name) => {
    const task = activeJobs.get(name);
    if (!task) {
        console.log(`⚠️  Job no encontrado: ${name}`);
        return false;
    }
    try {
        task.stop();
        activeJobs.delete(name);
        console.log(`✅ Job detenido: ${name}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Error deteniendo job ${name}:`, error);
        return false;
    }
};
exports.detenerCronJob = detenerCronJob;
/**
 * Reinicia un cronjob específico
 */
const reiniciarCronJob = (name) => {
    const jobConfig = cronJobs.find(j => j.name === name);
    if (!jobConfig) {
        console.log(`⚠️  Job no encontrado: ${name}`);
        return false;
    }
    // Detener si está activo
    (0, exports.detenerCronJob)(name);
    // Iniciar nuevamente
    try {
        const task = node_cron_1.default.schedule(jobConfig.schedule, async () => {
            try {
                await jobConfig.task();
            }
            catch (error) {
                console.error(`❌ Error en job ${jobConfig.name}:`, error);
            }
        });
        activeJobs.set(name, task);
        console.log(`✅ Job reiniciado: ${name}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Error reiniciando job ${name}:`, error);
        return false;
    }
};
exports.reiniciarCronJob = reiniciarCronJob;
/**
 * Obtiene el estado de todos los cronjobs
 */
const obtenerEstadoCronJobs = () => {
    return cronJobs.map(job => ({
        name: job.name,
        schedule: job.schedule,
        description: job.description,
        enabled: job.enabled,
        active: activeJobs.has(job.name),
    }));
};
exports.obtenerEstadoCronJobs = obtenerEstadoCronJobs;
/**
 * Ejecuta un job manualmente (sin esperar al schedule)
 */
const ejecutarJobManual = async (name) => {
    const jobConfig = cronJobs.find(j => j.name === name);
    if (!jobConfig) {
        console.log(`⚠️  Job no encontrado: ${name}`);
        return false;
    }
    try {
        console.log(`\n🔧 Ejecutando manualmente: ${name}`);
        await jobConfig.task();
        console.log(`✅ Ejecución manual completada: ${name}\n`);
        return true;
    }
    catch (error) {
        console.error(`❌ Error en ejecución manual de ${name}:`, error);
        return false;
    }
};
exports.ejecutarJobManual = ejecutarJobManual;
// ================================
// EXPORTACIONES
// ================================
exports.default = {
    iniciarCronJobs: exports.iniciarCronJobs,
    detenerCronJobs: exports.detenerCronJobs,
    detenerCronJob: exports.detenerCronJob,
    reiniciarCronJob: exports.reiniciarCronJob,
    obtenerEstadoCronJobs: exports.obtenerEstadoCronJobs,
    ejecutarJobManual: exports.ejecutarJobManual,
};
