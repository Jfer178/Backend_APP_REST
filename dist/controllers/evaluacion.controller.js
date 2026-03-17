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
exports.getEvaluacion = exports.getEvaluaciones = exports.crearEvaluacion = exports.getPreguntas = void 0;
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const ollama_service_1 = require("../services/ollama.service");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
// Validation schema for evaluation responses
const evaluacionSchema = zod_1.z.object({
    respuestas: zod_1.z.array(zod_1.z.object({
        pregunta_id: zod_1.z.number(),
        respuesta: zod_1.z.number().min(1).max(5),
    })),
    observaciones: zod_1.z.string().optional(),
});
/**
 * Get all available questions for evaluations
 */
const getPreguntas = async (_req, res) => {
    try {
        const preguntas = await db_1.db.select().from(schema.preguntas);
        res.json(preguntas);
    }
    catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getPreguntas = getPreguntas;
/**
 * Create a new evaluation with AI analysis
 */
const crearEvaluacion = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        // Validate request body
        const validationResult = evaluacionSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: 'Datos inválidos',
                errors: validationResult.error.errors
            });
            return;
        }
        const { respuestas, observaciones } = validationResult.data;
        // Get questions for analysis
        const preguntas = await db_1.db.select().from(schema.preguntas);
        // Ensure respuestas have the correct type
        const respuestasTyped = respuestas;
        let analisisResult;
        try {
            console.log('Usando Ollama para análisis...');
            analisisResult = await (0, ollama_service_1.analizarRespuestasOllama)(preguntas, respuestasTyped);
        }
        catch (aiError) {
            console.error('Error en análisis IA:', aiError);
            // Algoritmo avanzado de semáforo para evitar filtraciones
            const rawScore = respuestasTyped.reduce((sum, resp) => {
                const pregunta = preguntas.find(p => p.id === resp.pregunta_id);
                return sum + (resp.respuesta * (pregunta?.peso || 1));
            }, 0);
            // Calcular estadísticas adicionales
            let respuestasAltas = 0; // Contador de respuestas 4-5
            let respuestasBajas = 0; // Contador de respuestas 1-2
            const totalPreguntas = respuestasTyped.length;
            respuestasTyped.forEach(resp => {
                if (resp.respuesta >= 4)
                    respuestasAltas++;
                if (resp.respuesta <= 2)
                    respuestasBajas++;
            });
            const porcentajeAltas = (respuestasAltas / totalPreguntas) * 100;
            const puntajePromedio = rawScore / totalPreguntas;
            // Criterios más estrictos para evitar filtraciones
            let estado = 'verde';
            if (rawScore > 50 && porcentajeAltas > 60) {
                // Solo ROJO si puntaje alto Y más del 60% de respuestas son altas (4-5)
                estado = 'rojo';
            }
            else if (rawScore > 35 || porcentajeAltas > 40) {
                // AMARILLO si puntaje moderado O más del 40% de respuestas altas
                estado = 'amarillo';
            }
            else if (rawScore > 20 || porcentajeAltas > 25) {
                // AMARILLO suave si hay indicadores moderados
                estado = 'amarillo';
            }
            else {
                // VERDE por defecto
                estado = 'verde';
            }
            analisisResult = {
                estado,
                puntaje: Math.min(rawScore * 2, 100),
                observaciones: `Evaluación realizada con sistema de respaldo avanzado. Puntaje: ${rawScore}, Respuestas altas: ${porcentajeAltas.toFixed(1)}%`,
                recomendaciones: [
                    'Mantén rutinas saludables de sueño y ejercicio',
                    'Busca apoyo en familiares y amigos cercanos',
                    'Considera hablar con un profesional si persisten las molestias'
                ]
            };
        }
        // Create evaluation in database (map to schema)
        const observacionesTexto = [
            analisisResult.observaciones,
            observaciones ? `Observaciones usuario: ${observaciones}` : null,
        ].filter(Boolean).join(' | ');
        const [nuevaEvaluacion] = await db_1.db.insert(schema.evaluaciones)
            .values({
            usuario_id: req.user.id,
            puntaje_total: analisisResult.puntaje,
            estado_semaforo: analisisResult.estado,
            observaciones: observacionesTexto,
        })
            .returning();
        // Insert respuestas asociadas
        const pesoPorPregunta = new Map(preguntas.map(p => [p.id, p.peso]));
        const respuestasAInsertar = respuestasTyped.map((r) => ({
            evaluacion_id: nuevaEvaluacion.id,
            pregunta_id: r.pregunta_id,
            respuesta: r.respuesta,
            puntaje_calculado: r.respuesta * (pesoPorPregunta.get(r.pregunta_id) || 1),
        }));
        if (respuestasAInsertar.length > 0) {
            await db_1.db.insert(schema.respuestas).values(respuestasAInsertar);
        }
        res.status(201).json({
            message: 'Evaluación creada exitosamente',
            evaluacion: nuevaEvaluacion,
            analisis: analisisResult
        });
    }
    catch (error) {
        console.error('Error creating evaluation:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.crearEvaluacion = crearEvaluacion;
/**
 * Get user evaluations
 */
const getEvaluaciones = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const evaluaciones = await db_1.db
            .select()
            .from(schema.evaluaciones)
            .where((0, drizzle_orm_1.eq)(schema.evaluaciones.usuario_id, req.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema.evaluaciones.fecha));
        res.json(evaluaciones);
    }
    catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getEvaluaciones = getEvaluaciones;
/**
 * Get specific evaluation by ID
 */
const getEvaluacion = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const evaluacionId = parseInt(req.params.id);
        if (isNaN(evaluacionId)) {
            res.status(400).json({ message: 'ID de evaluación inválido' });
            return;
        }
        const [evaluacion] = await db_1.db
            .select()
            .from(schema.evaluaciones)
            .where((0, drizzle_orm_1.eq)(schema.evaluaciones.id, evaluacionId))
            .limit(1);
        if (!evaluacion) {
            res.status(404).json({ message: 'Evaluación no encontrada' });
            return;
        }
        // Check if evaluation belongs to user
        if (evaluacion.usuario_id !== req.user.id) {
            res.status(403).json({ message: 'No tienes acceso a esta evaluación' });
            return;
        }
        res.json(evaluacion);
    }
    catch (error) {
        console.error('Error fetching evaluation:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getEvaluacion = getEvaluacion;
