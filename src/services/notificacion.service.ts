import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, lt, gt, isNull, desc, sql, or } from 'drizzle-orm';

// ================================
// TIPOS
// ================================

export type TipoNotificacion = 'recordatorio_uso' | 'alerta_emocional' | 'recomendacion_actividad' | 'seguimiento_evaluacion';
export type PrioridadNotificacion = 'baja' | 'normal' | 'alta' | 'urgente';
export type EstadoNotificacion = 'enviado' | 'fallido' | 'pendiente';
export type CanalNotificacion = 'app' | 'email' | 'push';

export interface NotificacionData {
  usuario_id: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad?: PrioridadNotificacion;
  datos_adicionales?: Record<string, any>;
  programada_para?: Date;
}

export interface UsuarioConEstadoEmocional {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  ultima_evaluacion?: {
    estado_semaforo: string;
    puntaje_total: number;
    fecha: Date;
  } | null;
  ultima_actividad?: Date | null;
  dias_sin_uso: number;
}

// ================================
// FUNCIONES DE CREACIÓN Y GESTIÓN
// ================================

/**
 * Crea una nueva notificación
 */
export const crearNotificacion = async (data: NotificacionData) => {
  const [notificacion] = await db.insert(schema.notificaciones).values({
    usuario_id: data.usuario_id,
    tipo: data.tipo,
    titulo: data.titulo,
    mensaje: data.mensaje,
    prioridad: data.prioridad || 'normal',
    datos_adicionales: data.datos_adicionales ? JSON.stringify(data.datos_adicionales) : null,
    programada_para: data.programada_para,
    enviada: false,
    leida: false,
  }).returning();

  return notificacion;
};

/**
 * Marca una notificación como enviada
 */
export const marcarComoEnviada = async (notificacionId: number) => {
  const [notificacion] = await db.update(schema.notificaciones)
    .set({
      enviada: true,
      fecha_envio: new Date(),
      updated_at: new Date()
    })
    .where(eq(schema.notificaciones.id, notificacionId))
    .returning();

  return notificacion;
};

/**
 * Marca una notificación como leída
 */
export const marcarComoLeida = async (notificacionId: number, usuarioId: number) => {
  const [notificacion] = await db.update(schema.notificaciones)
    .set({
      leida: true,
      fecha_leida: new Date(),
      updated_at: new Date()
    })
    .where(and(
      eq(schema.notificaciones.id, notificacionId),
      eq(schema.notificaciones.usuario_id, usuarioId)
    ))
    .returning();

  return notificacion;
};

/**
 * Registra un log de notificación
 */
export const registrarLog = async (
  notificacionId: number | null,
  usuarioId: number,
  tipo: TipoNotificacion,
  estado: EstadoNotificacion,
  canal: CanalNotificacion,
  mensajeError?: string
) => {
  const [log] = await db.insert(schema.logs_notificaciones).values({
    notificacion_id: notificacionId,
    usuario_id: usuarioId,
    tipo,
    estado,
    canal,
    mensaje_error: mensajeError,
  }).returning();

  return log;
};

/**
 * Obtiene o crea preferencias de notificación para un usuario
 */
export const obtenerPreferenciasUsuario = async (usuarioId: number) => {
  let [preferencias] = await db.select()
    .from(schema.preferencias_notificacion)
    .where(eq(schema.preferencias_notificacion.usuario_id, usuarioId));

  if (!preferencias) {
    [preferencias] = await db.insert(schema.preferencias_notificacion)
      .values({ usuario_id: usuarioId })
      .returning();
  }

  return preferencias;
};

// ================================
// FUNCIONES DE PROCESAMIENTO DE DATOS
// ================================

/**
 * Obtiene usuarios con su estado emocional y última actividad
 */
export const obtenerUsuariosConEstado = async (): Promise<UsuarioConEstadoEmocional[]> => {
  // Obtener usuarios activos
  const usuarios = await db.select({
    id: schema.usuarios.id,
    nombres: schema.usuarios.nombres,
    apellidos: schema.usuarios.apellidos,
    correo: schema.usuarios.correo,
    is_active: schema.usuarios.is_active,
  })
    .from(schema.usuarios)
    .where(eq(schema.usuarios.is_active, true));

  const usuariosConEstado: UsuarioConEstadoEmocional[] = [];

  for (const usuario of usuarios) {
    // Obtener última evaluación
    const [ultimaEvaluacion] = await db.select()
      .from(schema.evaluaciones)
      .where(eq(schema.evaluaciones.usuario_id, usuario.id))
      .orderBy(desc(schema.evaluaciones.fecha))
      .limit(1);

    // Obtener última actividad (registro emocional, actividades, o chat)
    const [ultimoRegistroEmocional] = await db.select()
      .from(schema.registro_emocional)
      .where(eq(schema.registro_emocional.usuario_id, usuario.id))
      .orderBy(desc(schema.registro_emocional.fecha))
      .limit(1);

    const [ultimaActividadUsuario] = await db.select()
      .from(schema.registro_actividades_usuarios)
      .where(eq(schema.registro_actividades_usuarios.usuario_id, usuario.id))
      .orderBy(desc(schema.registro_actividades_usuarios.fecha))
      .limit(1);

    const [ultimoChat] = await db.select()
      .from(schema.chats)
      .where(or(
        eq(schema.chats.estudiante_id, usuario.id),
        eq(schema.chats.psicologo_id, usuario.id)
      ))
      .orderBy(desc(schema.chats.ultima_actividad))
      .limit(1);

    // Determinar la fecha más reciente de actividad
    const fechasActividad = [
      ultimoRegistroEmocional?.fecha,
      ultimaActividadUsuario?.fecha,
      ultimoChat?.ultima_actividad,
    ].filter(Boolean) as Date[];

    const ultimaActividad = fechasActividad.length > 0
      ? new Date(Math.max(...fechasActividad.map(f => new Date(f).getTime())))
      : null;

    // Calcular días sin uso
    const diasSinUso = ultimaActividad
      ? Math.floor((Date.now() - ultimaActividad.getTime()) / (1000 * 60 * 60 * 24))
      : 999; // Si nunca ha usado la app

    usuariosConEstado.push({
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      ultima_evaluacion: ultimaEvaluacion ? {
        estado_semaforo: ultimaEvaluacion.estado_semaforo || 'verde',
        puntaje_total: ultimaEvaluacion.puntaje_total || 0,
        fecha: ultimaEvaluacion.fecha,
      } : null,
      ultima_actividad: ultimaActividad,
      dias_sin_uso: diasSinUso,
    });
  }

  return usuariosConEstado;
};

/**
 * Detecta usuarios que necesitan recordatorio de uso
 */
export const detectarUsuariosInactivos = async (diasInactividad: number = 3) => {
  const usuarios = await obtenerUsuariosConEstado();
  
  return usuarios.filter(usuario => {
    // Verificar preferencias del usuario
    const preferencias = obtenerPreferenciasUsuario(usuario.id);
    // Solo incluir si tiene recordatorios activados
    return usuario.dias_sin_uso >= diasInactividad;
  });
};

/**
 * Detecta usuarios con estado emocional crítico
 */
export const detectarUsuariosEstadoCritico = async () => {
  const usuarios = await obtenerUsuariosConEstado();
  
  return usuarios.filter(usuario => {
    if (!usuario.ultima_evaluacion) return false;
    
    const { estado_semaforo, puntaje_total, fecha } = usuario.ultima_evaluacion;
    const diasDesdeEvaluacion = Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
    
    // Estado crítico: semáforo rojo o amarillo con puntaje alto
    // Y la evaluación es reciente (menos de 7 días)
    return (estado_semaforo === 'rojo' || 
           (estado_semaforo === 'amarillo' && puntaje_total > 60)) &&
           diasDesdeEvaluacion <= 7;
  });
};

/**
 * Detecta usuarios que necesitan seguimiento de evaluación
 */
export const detectarUsuariosSinEvaluacionReciente = async (diasSinEvaluacion: number = 30) => {
  const usuarios = await obtenerUsuariosConEstado();
  
  return usuarios.filter(usuario => {
    if (!usuario.ultima_evaluacion) return true; // Nunca ha tenido evaluación
    
    const diasDesdeEvaluacion = Math.floor(
      (Date.now() - new Date(usuario.ultima_evaluacion.fecha).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return diasDesdeEvaluacion >= diasSinEvaluacion;
  });
};

// ================================
// FUNCIONES DE GENERACIÓN DE NOTIFICACIONES
// ================================

/**
 * Genera notificaciones de recordatorio de uso
 */
export const generarNotificacionesRecordatorioUso = async () => {
  console.log('🔔 Generando notificaciones de recordatorio de uso...');
  
  const usuariosInactivos = await detectarUsuariosInactivos(3);
  const notificacionesCreadas = [];

  for (const usuario of usuariosInactivos) {
    // Verificar preferencias
    const preferencias = await obtenerPreferenciasUsuario(usuario.id);
    
    if (!preferencias.recordatorios_uso) continue;
    
    // Verificar si ya existe una notificación de este tipo reciente (últimas 24h)
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [notificacionReciente] = await db.select()
      .from(schema.notificaciones)
      .where(and(
        eq(schema.notificaciones.usuario_id, usuario.id),
        eq(schema.notificaciones.tipo, 'recordatorio_uso'),
        gt(schema.notificaciones.created_at, hace24h)
      ))
      .limit(1);

    if (notificacionReciente) continue; // Ya tiene notificación reciente

    // Crear notificación personalizada según días de inactividad
    let titulo = '¡Te extrañamos!';
    let mensaje = `Hola ${usuario.nombres}, hace ${usuario.dias_sin_uso} días que no usas la aplicación. Tu bienestar emocional es importante para nosotros.`;
    let prioridad: PrioridadNotificacion = 'normal';

    if (usuario.dias_sin_uso >= 7) {
      titulo = '¡Es hora de regresar!';
      mensaje = `Hola ${usuario.nombres}, hace más de una semana que no te conectas. Te invitamos a realizar una nueva evaluación emocional y continuar con tu proceso de bienestar.`;
      prioridad = 'alta';
    } else if (usuario.dias_sin_uso >= 14) {
      titulo = 'Tu bienestar te espera';
      mensaje = `Hola ${usuario.nombres}, han pasado ${usuario.dias_sin_uso} días desde tu última visita. Es importante mantener un seguimiento constante de tu estado emocional.`;
      prioridad = 'alta';
    }

    const notificacion = await crearNotificacion({
      usuario_id: usuario.id,
      tipo: 'recordatorio_uso',
      titulo,
      mensaje,
      prioridad,
      datos_adicionales: {
        dias_sin_uso: usuario.dias_sin_uso,
        ultima_actividad: usuario.ultima_actividad,
      },
    });

    notificacionesCreadas.push(notificacion);
  }

  console.log(`✅ ${notificacionesCreadas.length} notificaciones de recordatorio creadas`);
  return notificacionesCreadas;
};

/**
 * Genera notificaciones de alerta emocional
 */
export const generarNotificacionesAlertaEmocional = async () => {
  console.log('🚨 Generando notificaciones de alerta emocional...');
  
  const usuariosCriticos = await detectarUsuariosEstadoCritico();
  const notificacionesCreadas = [];

  for (const usuario of usuariosCriticos) {
    if (!usuario.ultima_evaluacion) continue;

    const preferencias = await obtenerPreferenciasUsuario(usuario.id);
    
    if (!preferencias.alertas_emocionales) continue;

    // Verificar si ya existe notificación de alerta reciente (últimas 48h)
    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const [notificacionReciente] = await db.select()
      .from(schema.notificaciones)
      .where(and(
        eq(schema.notificaciones.usuario_id, usuario.id),
        eq(schema.notificaciones.tipo, 'alerta_emocional'),
        gt(schema.notificaciones.created_at, hace48h)
      ))
      .limit(1);

    if (notificacionReciente) continue;

    const { estado_semaforo, puntaje_total } = usuario.ultima_evaluacion;

    let titulo = 'Seguimiento emocional importante';
    let mensaje = `Hola ${usuario.nombres}, detectamos que tu última evaluación mostró un estado emocional que requiere atención. Te recomendamos hablar con un profesional o realizar actividades de bienestar.`;
    let prioridad: PrioridadNotificacion = estado_semaforo === 'rojo' ? 'urgente' : 'alta';

    const notificacion = await crearNotificacion({
      usuario_id: usuario.id,
      tipo: 'alerta_emocional',
      titulo,
      mensaje,
      prioridad,
      datos_adicionales: {
        estado_semaforo,
        puntaje_total,
        fecha_evaluacion: usuario.ultima_evaluacion.fecha,
      },
    });

    notificacionesCreadas.push(notificacion);
  }

  console.log(`✅ ${notificacionesCreadas.length} notificaciones de alerta emocional creadas`);
  return notificacionesCreadas;
};

/**
 * Genera notificaciones de seguimiento de evaluación
 */
export const generarNotificacionesSeguimientoEvaluacion = async () => {
  console.log('📋 Generando notificaciones de seguimiento de evaluación...');
  
  const usuariosSinEvaluacion = await detectarUsuariosSinEvaluacionReciente(30);
  const notificacionesCreadas = [];

  for (const usuario of usuariosSinEvaluacion) {
    const preferencias = await obtenerPreferenciasUsuario(usuario.id);
    
    if (!preferencias.seguimientos_evaluacion) continue;

    // Verificar si ya existe notificación de seguimiento reciente (últimos 7 días)
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [notificacionReciente] = await db.select()
      .from(schema.notificaciones)
      .where(and(
        eq(schema.notificaciones.usuario_id, usuario.id),
        eq(schema.notificaciones.tipo, 'seguimiento_evaluacion'),
        gt(schema.notificaciones.created_at, hace7dias)
      ))
      .limit(1);

    if (notificacionReciente) continue;

    let titulo = 'Es hora de una nueva evaluación';
    let mensaje = `Hola ${usuario.nombres}, `;
    
    if (!usuario.ultima_evaluacion) {
      mensaje += 'aún no has realizado tu evaluación emocional inicial. Te invitamos a completarla para conocer mejor tu estado actual.';
    } else {
      const dias = Math.floor(
        (Date.now() - new Date(usuario.ultima_evaluacion.fecha).getTime()) / (1000 * 60 * 60 * 24)
      );
      mensaje += `han pasado ${dias} días desde tu última evaluación emocional. Te recomendamos realizar una nueva para dar seguimiento a tu bienestar.`;
    }

    const notificacion = await crearNotificacion({
      usuario_id: usuario.id,
      tipo: 'seguimiento_evaluacion',
      titulo,
      mensaje,
      prioridad: 'normal',
      datos_adicionales: {
        tiene_evaluacion_previa: !!usuario.ultima_evaluacion,
        dias_desde_ultima_evaluacion: usuario.ultima_evaluacion 
          ? Math.floor((Date.now() - new Date(usuario.ultima_evaluacion.fecha).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      },
    });

    notificacionesCreadas.push(notificacion);
  }

  console.log(`✅ ${notificacionesCreadas.length} notificaciones de seguimiento creadas`);
  return notificacionesCreadas;
};

/**
 * Genera notificaciones de recomendación de actividades
 */
export const generarNotificacionesRecomendacionActividades = async () => {
  console.log('🎯 Generando notificaciones de recomendación de actividades...');
  
  const usuarios = await obtenerUsuariosConEstado();
  const notificacionesCreadas = [];

  for (const usuario of usuarios) {
    const preferencias = await obtenerPreferenciasUsuario(usuario.id);
    
    if (!preferencias.recomendaciones_actividades) continue;

    // Solo para usuarios con estado emocional registrado
    if (!usuario.ultima_evaluacion) continue;

    const { estado_semaforo } = usuario.ultima_evaluacion;

    // Verificar si ya tiene notificación de recomendación reciente (últimos 3 días)
    const hace3dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const [notificacionReciente] = await db.select()
      .from(schema.notificaciones)
      .where(and(
        eq(schema.notificaciones.usuario_id, usuario.id),
        eq(schema.notificaciones.tipo, 'recomendacion_actividad'),
        gt(schema.notificaciones.created_at, hace3dias)
      ))
      .limit(1);

    if (notificacionReciente) continue;

    // Obtener actividades recomendadas según estado
    let titulo = 'Actividad recomendada';
    let mensaje = `Hola ${usuario.nombres}, te recomendamos realizar una actividad de bienestar hoy.`;
    let prioridad: PrioridadNotificacion = 'baja';

    if (estado_semaforo === 'rojo') {
      titulo = 'Actividades de autocuidado';
      mensaje = `Hola ${usuario.nombres}, te sugerimos realizar actividades de relajación y autocuidado para mejorar tu bienestar emocional.`;
      prioridad = 'alta';
    } else if (estado_semaforo === 'amarillo') {
      titulo = 'Mantén tu bienestar';
      mensaje = `Hola ${usuario.nombres}, realizar actividades positivas puede ayudarte a mantener y mejorar tu estado emocional.`;
      prioridad = 'normal';
    }

    const notificacion = await crearNotificacion({
      usuario_id: usuario.id,
      tipo: 'recomendacion_actividad',
      titulo,
      mensaje,
      prioridad,
      datos_adicionales: {
        estado_semaforo,
        actividades_disponibles: true,
      },
    });

    notificacionesCreadas.push(notificacion);
  }

  console.log(`✅ ${notificacionesCreadas.length} notificaciones de recomendación creadas`);
  return notificacionesCreadas;
};

// ================================
// FUNCIÓN PRINCIPAL DE PROCESAMIENTO
// ================================

/**
 * Procesa y genera todas las notificaciones pendientes
 */
export const procesarTodasLasNotificaciones = async () => {
  console.log('\n========================================');
  console.log('🔔 INICIANDO PROCESAMIENTO DE NOTIFICACIONES');
  console.log('========================================\n');

  try {
    const resultados = {
      recordatorios_uso: [] as any[],
      alertas_emocionales: [] as any[],
      seguimientos_evaluacion: [] as any[],
      recomendaciones_actividades: [] as any[],
      total: 0,
    };

    // Ejecutar todos los procesos de generación
    resultados.recordatorios_uso = await generarNotificacionesRecordatorioUso();
    resultados.alertas_emocionales = await generarNotificacionesAlertaEmocional();
    resultados.seguimientos_evaluacion = await generarNotificacionesSeguimientoEvaluacion();
    resultados.recomendaciones_actividades = await generarNotificacionesRecomendacionActividades();

    resultados.total = 
      resultados.recordatorios_uso.length +
      resultados.alertas_emocionales.length +
      resultados.seguimientos_evaluacion.length +
      resultados.recomendaciones_actividades.length;

    console.log('\n========================================');
    console.log('✅ PROCESAMIENTO COMPLETADO');
    console.log(`   Total notificaciones creadas: ${resultados.total}`);
    console.log('========================================\n');

    return resultados;
  } catch (error) {
    console.error('❌ Error en procesamiento de notificaciones:', error);
    throw error;
  }
};

/**
 * Envía notificaciones pendientes (marcándolas como enviadas en la app)
 */
export const enviarNotificacionesPendientes = async () => {
  console.log('📤 Enviando notificaciones pendientes...');

  // Obtener notificaciones no enviadas
  const notificacionesPendientes = await db.select()
    .from(schema.notificaciones)
    .where(and(
      eq(schema.notificaciones.enviada, false),
      isNull(schema.notificaciones.deleted_at)
    ))
    .limit(100); // Procesar en lotes de 100

  let enviadas = 0;
  let fallidas = 0;

  for (const notificacion of notificacionesPendientes) {
    try {
      // Marcar como enviada (en una implementación real, aquí se enviaría por email/push)
      await marcarComoEnviada(notificacion.id);
      
      // Registrar log de envío exitoso
      await registrarLog(
        notificacion.id,
        notificacion.usuario_id!,
        notificacion.tipo as TipoNotificacion,
        'enviado',
        'app'
      );

      enviadas++;
    } catch (error) {
      console.error(`Error enviando notificación ${notificacion.id}:`, error);
      
      // Registrar log de fallo
      await registrarLog(
        notificacion.id,
        notificacion.usuario_id!,
        notificacion.tipo as TipoNotificacion,
        'fallido',
        'app',
        error instanceof Error ? error.message : 'Error desconocido'
      );

      fallidas++;
    }
  }

  console.log(`✅ ${enviadas} notificaciones enviadas, ${fallidas} fallidas`);
  
  return { enviadas, fallidas, total: notificacionesPendientes.length };
};

// ================================
// FUNCIONES DE CONSULTA
// ================================

/**
 * Obtiene notificaciones de un usuario
 */
export const obtenerNotificacionesUsuario = async (
  usuarioId: number,
  soloNoLeidas: boolean = false,
  limite: number = 50
) => {
  const condiciones = [eq(schema.notificaciones.usuario_id, usuarioId)];
  
  if (soloNoLeidas) {
    condiciones.push(eq(schema.notificaciones.leida, false));
  }

  const notificaciones = await db.select()
    .from(schema.notificaciones)
    .where(and(...condiciones))
    .orderBy(desc(schema.notificaciones.created_at))
    .limit(limite);

  return notificaciones;
};

/**
 * Obtiene conteo de notificaciones no leídas
 */
export const contarNotificacionesNoLeidas = async (usuarioId: number) => {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(schema.notificaciones)
    .where(and(
      eq(schema.notificaciones.usuario_id, usuarioId),
      eq(schema.notificaciones.leida, false),
      isNull(schema.notificaciones.deleted_at)
    ));

  return result[0]?.count || 0;
};
