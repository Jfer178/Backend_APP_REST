"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveRespuestasRegistroEmocional = exports.getRespuestasUsuarioPorFecha = exports.getPreguntasRegistroEmocional = void 0;
const api_utils_1 = require("../shared/utils/api.utils");
const registro_emocional_service_1 = require("../services/registro-emocional.service");
const getPreguntasRegistroEmocional = async (_req, res) => {
    try {
        const preguntas = await (0, registro_emocional_service_1.getPreguntasRegistroEmocionalService)();
        res.status(200).json((0, api_utils_1.APISuccessResponse)(preguntas, 'Preguntas de registro emocional obtenidas'));
    }
    catch (error) {
        console.error('Error obteniendo preguntas de registro emocional:', error);
        res.status(500).json((0, api_utils_1.APIErrorResponse)('Error interno del servidor'));
    }
};
exports.getPreguntasRegistroEmocional = getPreguntasRegistroEmocional;
const getRespuestasUsuarioPorFecha = async (req, res) => {
    try {
        const usuarioId = Number(req.params.usuarioId);
        const fecha = req.params.fecha;
        const result = await (0, registro_emocional_service_1.getRespuestasUsuarioPorFechaService)(usuarioId, fecha);
        res.status(200).json((0, api_utils_1.APISuccessResponse)(result, 'Respuestas del usuario obtenidas'));
    }
    catch (error) {
        console.error('Error obteniendo respuestas por fecha:', error);
        if (error instanceof Error && error.message.includes('Formato de fecha inválido')) {
            res.status(400).json((0, api_utils_1.APIErrorResponse)(error.message));
            return;
        }
        res.status(500).json((0, api_utils_1.APIErrorResponse)('Error interno del servidor'));
    }
};
exports.getRespuestasUsuarioPorFecha = getRespuestasUsuarioPorFecha;
const saveRespuestasRegistroEmocional = async (req, res) => {
    try {
        const { usuario_id, respuestas } = req.body;
        const result = await (0, registro_emocional_service_1.saveRespuestasRegistroEmocionalService)({ usuario_id, respuestas });
        res.status(201).json((0, api_utils_1.APISuccessResponse)(result, 'Respuestas de registro emocional guardadas'));
    }
    catch (error) {
        console.error('Error guardando respuestas de registro emocional:', error);
        if (error instanceof Error) {
            res.status(400).json((0, api_utils_1.APIErrorResponse)(error.message));
            return;
        }
        res.status(500).json((0, api_utils_1.APIErrorResponse)('Error interno del servidor'));
    }
};
exports.saveRespuestasRegistroEmocional = saveRespuestasRegistroEmocional;
