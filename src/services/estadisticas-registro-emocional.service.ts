import { db } from '../db';
import { registro_emocional, opciones_registro_emocional, preguntas_registro_emocional } from '../db/schema';
import { eq, and, gte, lte, desc, isNull } from 'drizzle-orm';

interface CalendarioData {
  [fecha: string]: {
    fecha: string;
    promedio_emocional: number;
    registros_realizados: number;
    emociones: string[];
  };
}

interface RachasData {
  racha_actual: number;
  racha_maxima_historica: number;
  dias_sin_registrar: number;
  ultimo_registro: string | null;
}

interface EstadisticasData {
  promedio_general: number;
  valor_minimo: number;
  valor_maximo: number;
  total_registros: number;
  emociones_mas_frecuentes: Record<string, number>;
  registros_por_semana: Record<string, number>;
}

interface ResumenDiaData {
  fecha: string;
  promedio_dia: number;
  total_registros: number;
  respuestas: Array<{
    pregunta: string;
    respuesta_seleccionada: string;
    valor: number;
  }>;
}

/**
 * Obtener calendario emocional con rango de fechas
 */
export const getCalendarioEmocionalService = async (
  usuarioId: number,
  inicio: string,
  fin: string
): Promise<CalendarioData> => {
  try {
    const registros = await db
      .select({
        id: registro_emocional.id,
        usuario_id: registro_emocional.usuario_id,
        pregunta_id: registro_emocional.pregunta_id,
        opcion_id: registro_emocional.opcion_id,
        fecha_dia: registro_emocional.fecha_dia,
        valor_emocional: opciones_registro_emocional.puntaje,
        nombre: opciones_registro_emocional.nombre,
      })
      .from(registro_emocional)
      .leftJoin(
        opciones_registro_emocional,
        eq(registro_emocional.opcion_id, opciones_registro_emocional.id)
      )
      .where(
        and(
          eq(registro_emocional.usuario_id, usuarioId),
          gte(registro_emocional.fecha_dia, inicio),
          lte(registro_emocional.fecha_dia, fin),
          isNull(registro_emocional.deleted_at)
        )
      );

    const calendario: CalendarioData = {};

    registros.forEach((registro) => {
      const fecha = String(registro.fecha_dia);
      if (!calendario[fecha]) {
        calendario[fecha] = {
          fecha,
          promedio_emocional: 0,
          registros_realizados: 0,
          emociones: [],
        };
      }

      calendario[fecha].registros_realizados += 1;
      calendario[fecha].emociones.push(registro.nombre || 'Sin emoción');
    });

    // Calcular promedios
    Object.keys(calendario).forEach((fecha) => {
      const registrosDelDia = registros.filter((r) => String(r.fecha_dia) === fecha);
      const suma = registrosDelDia.reduce((acc, r) => acc + (r.valor_emocional || 0), 0);
      calendario[fecha].promedio_emocional = Math.round((suma / registrosDelDia.length) * 100) / 100;
    });

    return calendario;
  } catch (error) {
    console.error('Error en getCalendarioEmocionalService:', error);
    throw error;
  }
};

/**
 * Obtener información de rachas (consistencia)
 */
export const getRachasService = async (usuarioId: number): Promise<RachasData> => {
  try {
    const registros = await db
      .select({
        fecha_dia: registro_emocional.fecha_dia,
      })
      .from(registro_emocional)
      .where(and(
        eq(registro_emocional.usuario_id, usuarioId),
        isNull(registro_emocional.deleted_at)
      ))
      .orderBy((table) => table.fecha_dia);

    if (registros.length === 0) {
      return {
        racha_actual: 0,
        racha_maxima_historica: 0,
        dias_sin_registrar: 0,
        ultimo_registro: null,
      };
    }

    // Obtener fechas únicas ordenadas
    const fechasUnicas = [...new Set(registros.map((r) => String(r.fecha_dia)))].sort();

    // Calcular rachas
    let rachaActual = 0;
    let rachaMaxima = 0;
    const hoy = new Date().toISOString().split('T')[0];
    let ultimoRegistro = fechasUnicas[fechasUnicas.length - 1];

    let fechaAnterior = '';
    for (let i = 0; i < fechasUnicas.length; i++) {
      const fechaActual = fechasUnicas[i];

      if (fechaAnterior === '') {
        rachaActual = 1;
      } else {
        const diaAnterior = new Date(fechaAnterior);
        diaAnterior.setDate(diaAnterior.getDate() + 1);
        const diaAnteriorStr = diaAnterior.toISOString().split('T')[0];

        if (diaAnteriorStr === fechaActual) {
          rachaActual += 1;
        } else {
          rachaActual = 1;
        }
      }

      if (rachaActual > rachaMaxima) {
        rachaMaxima = rachaActual;
      }

      fechaAnterior = fechaActual;
    }

    // Calcular días sin registrar
    let diasSinRegistrar = 0;
    const ultimaFecha = new Date(ultimoRegistro);
    const hoyDate = new Date(hoy);
    const diferencia = Math.floor((hoyDate.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));
    diasSinRegistrar = diferencia;

    return {
      racha_actual: rachaActual,
      racha_maxima_historica: rachaMaxima,
      dias_sin_registrar: diasSinRegistrar,
      ultimo_registro: ultimoRegistro,
    };
  } catch (error) {
    console.error('Error en getRachasService:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas detalladas
 */
export const getEstadisticasService = async (usuarioId: number): Promise<EstadisticasData> => {
  try {
    const registros = await db
      .select({
        valor_emocional: opciones_registro_emocional.puntaje,
        fecha_dia: registro_emocional.fecha_dia,
        nombre: opciones_registro_emocional.nombre,
      })
      .from(registro_emocional)
      .leftJoin(
        opciones_registro_emocional,
        eq(registro_emocional.opcion_id, opciones_registro_emocional.id)
      )
      .where(and(
        eq(registro_emocional.usuario_id, usuarioId),
        isNull(registro_emocional.deleted_at)
      ));

    if (registros.length === 0) {
      return {
        promedio_general: 0,
        valor_minimo: 0,
        valor_maximo: 0,
        total_registros: 0,
        emociones_mas_frecuentes: {},
        registros_por_semana: {},
      };
    }

    // Calcular promedios
    const valores = registros.map((r) => r.valor_emocional || 0);
    const suma = valores.reduce((acc, val) => acc + val, 0);
    const promedio = Math.round((suma / valores.length) * 100) / 100;

    // Emociones más frecuentes
    const emocionesFrequencia: Record<string, number> = {};
    registros.forEach((r) => {
      const emocion = r.nombre || 'Sin emoción';
      emocionesFrequencia[emocion] = (emocionesFrequencia[emocion] || 0) + 1;
    });

    // Registros por semana
    const registrosPorSemana: Record<string, number> = {};
    registros.forEach((r) => {
      const fecha = String(r.fecha_dia);
      registrosPorSemana[fecha] = (registrosPorSemana[fecha] || 0) + 1;
    });

    return {
      promedio_general: promedio,
      valor_minimo: Math.min(...valores),
      valor_maximo: Math.max(...valores),
      total_registros: registros.length,
      emociones_mas_frecuentes: emocionesFrequencia,
      registros_por_semana: registrosPorSemana,
    };
  } catch (error) {
    console.error('Error en getEstadisticasService:', error);
    throw error;
  }
};

/**
 * Obtener resumen del día específico
 */
export const getResumenDiaService = async (usuarioId: number, fecha: string): Promise<ResumenDiaData> => {
  try {
    const registros = await db
      .select({
        pregunta_id: registro_emocional.pregunta_id,
        opcion_id: registro_emocional.opcion_id,
        texto: preguntas_registro_emocional.texto,
        nombre: opciones_registro_emocional.nombre,
        valor_emocional: opciones_registro_emocional.puntaje,
      })
      .from(registro_emocional)
      .leftJoin(
        preguntas_registro_emocional,
        eq(registro_emocional.pregunta_id, preguntas_registro_emocional.id)
      )
      .leftJoin(
        opciones_registro_emocional,
        eq(registro_emocional.opcion_id, opciones_registro_emocional.id)
      )
      .where(
        and(
          eq(registro_emocional.usuario_id, usuarioId),
          eq(registro_emocional.fecha_dia, fecha as any),
          isNull(registro_emocional.deleted_at)
        )
      );

    if (registros.length === 0) {
      return {
        fecha,
        promedio_dia: 0,
        total_registros: 0,
        respuestas: [],
      };
    }

    // Calcular promedio del día
    const valores = registros.map((r) => r.valor_emocional || 0);
    const suma = valores.reduce((acc, val) => acc + val, 0);
    const promedioDia = Math.round((suma / valores.length) * 100) / 100;

    // Armar respuestas
    const respuestas = registros.map((r) => ({
      pregunta: r.texto || 'Pregunta desconocida',
      respuesta_seleccionada: r.nombre || 'Opción desconocida',
      valor: r.valor_emocional || 0,
    }));

    return {
      fecha,
      promedio_dia: promedioDia,
      total_registros: registros.length,
      respuestas,
    };
  } catch (error) {
    console.error('Error en getResumenDiaService:', error);
    throw error;
  }
};
