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
exports.saveRespuestasRegistroEmocionalService = exports.getRespuestasUsuarioPorFechaService = exports.getPreguntasRegistroEmocionalService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const parseDdMmYyyyToIso = (date) => {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);
    if (!match)
        return null;
    const [, day, month, year] = match;
    const iso = `${year}-${month}-${day}`;
    const parsed = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()))
        return null;
    if (parsed.toISOString().slice(0, 10) !== iso)
        return null;
    return iso;
};
const getTodayIso = () => {
    return new Date().toISOString().slice(0, 10);
};
const getPreguntasRegistroEmocionalService = async () => {
    const rows = await db_1.db
        .select({
        id: schema.preguntas_registro_emocional.id,
        texto: schema.preguntas_registro_emocional.texto,
        is_active: schema.preguntas_registro_emocional.is_active,
        created_at: schema.preguntas_registro_emocional.created_at,
        updated_at: schema.preguntas_registro_emocional.updated_at,
        opcion_id: schema.opciones_registro_emocional.id,
        opcion_nombre: schema.opciones_registro_emocional.nombre,
        opcion_descripcion: schema.opciones_registro_emocional.descripcion,
        opcion_url_imagen: schema.opciones_registro_emocional.url_imagen,
        opcion_puntaje: schema.opciones_registro_emocional.puntaje,
        opcion_is_active: schema.opciones_registro_emocional.is_active,
    })
        .from(schema.preguntas_registro_emocional)
        .leftJoin(schema.opciones_registro_emocional, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.opciones_registro_emocional.pregunta_id, schema.preguntas_registro_emocional.id), (0, drizzle_orm_1.isNull)(schema.opciones_registro_emocional.deleted_at)))
        .where((0, drizzle_orm_1.isNull)(schema.preguntas_registro_emocional.deleted_at))
        .orderBy((0, drizzle_orm_1.asc)(schema.preguntas_registro_emocional.id), (0, drizzle_orm_1.asc)(schema.opciones_registro_emocional.id));
    const preguntasMap = new Map();
    for (const row of rows) {
        if (!preguntasMap.has(row.id)) {
            preguntasMap.set(row.id, {
                id: row.id,
                texto: row.texto,
                is_active: row.is_active,
                created_at: row.created_at,
                updated_at: row.updated_at,
                opciones: [],
            });
        }
        if (row.opcion_id !== null) {
            if (preguntasMap.get(row.id)) {
                preguntasMap.get(row.id)?.opciones.push({
                    id: row.opcion_id,
                    nombre: row.opcion_nombre ?? '',
                    descripcion: row.opcion_descripcion ?? '',
                    url_imagen: row.opcion_url_imagen ?? '',
                    puntaje: row.opcion_puntaje ?? 0,
                    is_active: row.opcion_is_active ?? false,
                });
            }
        }
    }
    return Array.from(preguntasMap.values());
};
exports.getPreguntasRegistroEmocionalService = getPreguntasRegistroEmocionalService;
const getRespuestasUsuarioPorFechaService = async (usuarioId, fechaDdMmYyyy) => {
    const fechaIso = parseDdMmYyyyToIso(fechaDdMmYyyy);
    if (!fechaIso) {
        throw new Error('Formato de fecha inválido. Usa DD-MM-YYYY');
    }
    const rows = await db_1.db
        .select({
        id: schema.registro_emocional.id,
        usuario_id: schema.registro_emocional.usuario_id,
        pregunta_id: schema.registro_emocional.pregunta_id,
        opcion_id: schema.registro_emocional.opcion_id,
        puntaje: schema.registro_emocional.puntaje,
        fecha_dia: schema.registro_emocional.fecha_dia,
        fecha: schema.registro_emocional.fecha,
        observaciones: schema.registro_emocional.observaciones,
        pregunta_texto: schema.preguntas_registro_emocional.texto,
        opcion_nombre: schema.opciones_registro_emocional.nombre,
        opcion_descripcion: schema.opciones_registro_emocional.descripcion,
        opcion_url_imagen: schema.opciones_registro_emocional.url_imagen,
        opcion_puntaje: schema.opciones_registro_emocional.puntaje,
    })
        .from(schema.registro_emocional)
        .leftJoin(schema.preguntas_registro_emocional, (0, drizzle_orm_1.eq)(schema.registro_emocional.pregunta_id, schema.preguntas_registro_emocional.id))
        .leftJoin(schema.opciones_registro_emocional, (0, drizzle_orm_1.eq)(schema.registro_emocional.opcion_id, schema.opciones_registro_emocional.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.registro_emocional.usuario_id, usuarioId), (0, drizzle_orm_1.eq)(schema.registro_emocional.fecha_dia, fechaIso), (0, drizzle_orm_1.isNull)(schema.registro_emocional.deleted_at)));
    const respuestas = rows.map((row) => ({
        id: row.id,
        usuario_id: row.usuario_id,
        puntaje: row.puntaje,
        fecha_dia: row.fecha_dia,
        fecha: row.fecha,
        observaciones: row.observaciones,
        pregunta: {
            id: row.pregunta_id,
            texto: row.pregunta_texto,
        },
        opcion: {
            id: row.opcion_id,
            nombre: row.opcion_nombre,
            descripcion: row.opcion_descripcion,
            url_imagen: row.opcion_url_imagen,
            puntaje: row.opcion_puntaje,
        },
    }));
    return {
        usuario_id: usuarioId,
        fecha: fechaDdMmYyyy,
        fecha_iso: fechaIso,
        registro_del_dia: respuestas.length > 0,
        respuestas,
    };
};
exports.getRespuestasUsuarioPorFechaService = getRespuestasUsuarioPorFechaService;
const saveRespuestasRegistroEmocionalService = async (input) => {
    const todayIso = getTodayIso();
    const opcionIds = input.respuestas.map((item) => item.opcion_id);
    const opciones = await db_1.db
        .select({
        id: schema.opciones_registro_emocional.id,
        pregunta_id: schema.opciones_registro_emocional.pregunta_id,
        puntaje: schema.opciones_registro_emocional.puntaje,
    })
        .from(schema.opciones_registro_emocional)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema.opciones_registro_emocional.id, opcionIds), (0, drizzle_orm_1.isNull)(schema.opciones_registro_emocional.deleted_at)));
    const opcionesById = new Map(opciones.map((item) => [item.id, item]));
    for (const respuesta of input.respuestas) {
        const opcion = opcionesById.get(respuesta.opcion_id);
        if (!opcion) {
            throw new Error(`La opción ${respuesta.opcion_id} no existe`);
        }
        if (opcion.pregunta_id !== respuesta.pregunta_id) {
            throw new Error(`La opción ${respuesta.opcion_id} no pertenece a la pregunta ${respuesta.pregunta_id}`);
        }
    }
    const inserted = await db_1.db.transaction(async (tx) => {
        await tx
            .delete(schema.registro_emocional)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.registro_emocional.usuario_id, input.usuario_id), (0, drizzle_orm_1.eq)(schema.registro_emocional.fecha_dia, todayIso)));
        const values = input.respuestas.map((item) => {
            const opcion = opcionesById.get(item.opcion_id);
            return {
                usuario_id: input.usuario_id,
                pregunta_id: item.pregunta_id,
                opcion_id: item.opcion_id,
                puntaje: opcion.puntaje,
                fecha_dia: todayIso,
                fecha: new Date(),
            };
        });
        return tx.insert(schema.registro_emocional).values(values).returning();
    });
    const totalPuntaje = inserted.reduce((acc, item) => acc + (item.puntaje ?? 0), 0);
    return {
        usuario_id: input.usuario_id,
        fecha_dia: todayIso,
        registro_del_dia: inserted.length > 0,
        total_puntaje: totalPuntaje,
        respuestas_guardadas: inserted.length,
        respuestas: inserted,
    };
};
exports.saveRespuestasRegistroEmocionalService = saveRespuestasRegistroEmocionalService;
