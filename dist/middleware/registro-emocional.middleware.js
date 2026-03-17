"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSaveRespuestasRegistroEmocional = exports.validateGetRespuestasUsuarioPorFecha = void 0;
const zod_1 = require("zod");
const api_utils_1 = require("../shared/utils/api.utils");
const fechaRegex = /^\d{2}-\d{2}-\d{4}$/;
const getByDateParamsSchema = zod_1.z.object({
    usuarioId: zod_1.z.coerce.number().int().positive(),
    fecha: zod_1.z.string().regex(fechaRegex, 'Formato de fecha inválido. Usa DD-MM-YYYY'),
});
const saveRespuestasBodySchema = zod_1.z.object({
    usuario_id: zod_1.z.number().int().positive(),
    respuestas: zod_1.z
        .array(zod_1.z.object({
        pregunta_id: zod_1.z.number().int().positive(),
        opcion_id: zod_1.z.number().int().positive(),
    }))
        .min(1, 'Debes enviar al menos una respuesta')
        .superRefine((items, ctx) => {
        const seen = new Set();
        for (const [index, item] of items.entries()) {
            if (seen.has(item.pregunta_id)) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `La pregunta ${item.pregunta_id} está repetida en respuestas`,
                    path: [index, 'pregunta_id'],
                });
            }
            seen.add(item.pregunta_id);
        }
    }),
});
const validateGetRespuestasUsuarioPorFecha = (req, res, next) => {
    const parsed = getByDateParamsSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json((0, api_utils_1.APIErrorResponse)('Parámetros inválidos', parsed.error.errors.map((e) => e.message)));
        return;
    }
    if (req.user?.id && req.user.id !== parsed.data.usuarioId) {
        res.status(403).json((0, api_utils_1.APIErrorResponse)('No puedes consultar registros de otro usuario'));
        return;
    }
    next();
};
exports.validateGetRespuestasUsuarioPorFecha = validateGetRespuestasUsuarioPorFecha;
const validateSaveRespuestasRegistroEmocional = (req, res, next) => {
    const parsed = saveRespuestasBodySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json((0, api_utils_1.APIErrorResponse)('Body inválido', parsed.error.errors.map((e) => e.message)));
        return;
    }
    if (req.user?.id && req.user.id !== parsed.data.usuario_id) {
        res.status(403).json((0, api_utils_1.APIErrorResponse)('No puedes guardar registros para otro usuario'));
        return;
    }
    next();
};
exports.validateSaveRespuestasRegistroEmocional = validateSaveRespuestasRegistroEmocional;
