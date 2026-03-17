import cron from 'node-cron';
import {
  procesarTodasLasNotificaciones,
  enviarNotificacionesPendientes,
} from '../services/notificacion.service';

// ================================
// CONFIGURACIÓN DE CRONJOBS
// ================================

interface CronJobConfig {
  name: string;
  schedule: string;
  description: string;
  enabled: boolean;
  task: () => Promise<void>;
}

// Configuración de jobs
const cronJobs: CronJobConfig[] = [
  {
    name: 'notificaciones-procesamiento',
    schedule: '0 */6 * * *', // Cada 6 horas
    description: 'Procesa y genera notificaciones basadas en estado emocional y actividad de usuarios',
    enabled: process.env.ENABLE_NOTIFICATION_CRON !== 'false', // Habilitado por defecto
    task: async () => {
      console.log(`\n⏰ [${new Date().toISOString()}] Ejecutando job: Procesamiento de notificaciones`);
      await procesarTodasLasNotificaciones();
    },
  },
  {
    name: 'notificaciones-envio',
    schedule: '*/5 * * * *', // Cada 5 minutos
    description: 'Envía notificaciones pendientes a usuarios',
    enabled: process.env.ENABLE_NOTIFICATION_CRON !== 'false',
    task: async () => {
      console.log(`\n⏰ [${new Date().toISOString()}] Ejecutando job: Envío de notificaciones`);
      await enviarNotificacionesPendientes();
    },
  },
  {
    name: 'notificaciones-recordatorio-diario',
    schedule: '0 9 * * *', // Todos los días a las 9:00 AM
    description: 'Genera recordatorios diarios para usuarios inactivos',
    enabled: process.env.ENABLE_DAILY_REMINDERS !== 'false',
    task: async () => {
      console.log(`\n⏰ [${new Date().toISOString()}] Ejecutando job: Recordatorios diarios`);
      const { generarNotificacionesRecordatorioUso } = await import('../services/notificacion.service');
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
      const { generarNotificacionesAlertaEmocional } = await import('../services/notificacion.service');
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
      const { generarNotificacionesSeguimientoEvaluacion } = await import('../services/notificacion.service');
      await generarNotificacionesSeguimientoEvaluacion();
    },
  },
];

// ================================
// ALMACENAMIENTO DE JOBS ACTIVOS
// ================================

const activeJobs: Map<string, ReturnType<typeof cron.schedule>> = new Map();

// ================================
// FUNCIONES DE GESTIÓN
// ================================

/**
 * Inicia todos los cronjobs configurados
 */
export const iniciarCronJobs = () => {
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
      if (!cron.validate(jobConfig.schedule)) {
        console.error(`❌ Expresión cron inválida para ${jobConfig.name}: ${jobConfig.schedule}`);
        continue;
      }

      // Crear y iniciar el job
      const task = cron.schedule(jobConfig.schedule, async () => {
        try {
          await jobConfig.task();
        } catch (error) {
          console.error(`❌ Error en job ${jobConfig.name}:`, error);
        }
      });

      activeJobs.set(jobConfig.name, task);
      iniciados++;

      console.log(`✅ Job iniciado: ${jobConfig.name}`);
      console.log(`   Schedule: ${jobConfig.schedule}`);
      console.log(`   Descripción: ${jobConfig.description}\n`);
    } catch (error) {
      console.error(`❌ Error iniciando job ${jobConfig.name}:`, error);
    }
  }

  console.log('========================================');
  console.log(`📊 Resumen:`);
  console.log(`   Jobs iniciados: ${iniciados}`);
  console.log(`   Jobs deshabilitados: ${deshabilitados}`);
  console.log('========================================\n');
};

/**
 * Detiene todos los cronjobs activos
 */
export const detenerCronJobs = () => {
  console.log('\n🛑 Deteniendo todos los cronjobs...');

  for (const [name, task] of activeJobs) {
    try {
      task.stop();
      console.log(`✅ Job detenido: ${name}`);
    } catch (error) {
      console.error(`❌ Error deteniendo job ${name}:`, error);
    }
  }

  activeJobs.clear();
  console.log('✅ Todos los cronjobs han sido detenidos\n');
};

/**
 * Detiene un cronjob específico
 */
export const detenerCronJob = (name: string): boolean => {
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
  } catch (error) {
    console.error(`❌ Error deteniendo job ${name}:`, error);
    return false;
  }
};

/**
 * Reinicia un cronjob específico
 */
export const reiniciarCronJob = (name: string): boolean => {
  const jobConfig = cronJobs.find(j => j.name === name);
  
  if (!jobConfig) {
    console.log(`⚠️  Job no encontrado: ${name}`);
    return false;
  }

  // Detener si está activo
  detenerCronJob(name);

  // Iniciar nuevamente
  try {
    const task = cron.schedule(jobConfig.schedule, async () => {
      try {
        await jobConfig.task();
      } catch (error) {
        console.error(`❌ Error en job ${jobConfig.name}:`, error);
      }
    });

    activeJobs.set(name, task);
    console.log(`✅ Job reiniciado: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Error reiniciando job ${name}:`, error);
    return false;
  }
};

/**
 * Obtiene el estado de todos los cronjobs
 */
export const obtenerEstadoCronJobs = () => {
  return cronJobs.map(job => ({
    name: job.name,
    schedule: job.schedule,
    description: job.description,
    enabled: job.enabled,
    active: activeJobs.has(job.name),
  }));
};

/**
 * Ejecuta un job manualmente (sin esperar al schedule)
 */
export const ejecutarJobManual = async (name: string): Promise<boolean> => {
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
  } catch (error) {
    console.error(`❌ Error en ejecución manual de ${name}:`, error);
    return false;
  }
};

// ================================
// EXPORTACIONES
// ================================

export default {
  iniciarCronJobs,
  detenerCronJobs,
  detenerCronJob,
  reiniciarCronJob,
  obtenerEstadoCronJobs,
  ejecutarJobManual,
};
