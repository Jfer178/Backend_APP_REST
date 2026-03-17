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
exports.getTerms = exports.getPrivacyPolicy = exports.getCodeOfConduct = exports.sendFeedback = exports.reportIssue = exports.updatePreferences = exports.updateProfile = exports.getProfile = void 0;
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
// Esquema de validación para actualizar perfil
const updateProfileSchema = zod_1.z.object({
    nombres: zod_1.z.string().min(1),
    apellidos: zod_1.z.string().min(1),
    telefono: zod_1.z.string().optional(),
    semestre_actual: zod_1.z.string().optional(),
    fecha_nacimiento: zod_1.z.string().optional()
});
// Esquema para enviar el feedback
const sendFeedbackSchema = zod_1.z.object({
    puntaje: zod_1.z.number().min(1).max(5),
    que_mas_te_gusto: zod_1.z.string().min(1),
    comentarios: zod_1.z.string().optional()
});
// Esquema para enviar un reporte de problema
const sendReportSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1),
    descripcion: zod_1.z.string().min(1)
});
//esquema para actualiza las preferencias (idioma)
const updatePreferencesSchema = zod_1.z.object({
    idioma: zod_1.z.enum(["es", "en", "pt", "fr", "de"])
});
// Obtener perfil del usuario
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const [user] = await db_1.db
            .select()
            .from(schema.usuarios)
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, userId))
            .limit(1);
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getProfile = getProfile;
// Actualizar perfil del usuario
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Usuario no autenticado' });
            return;
        }
        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.errors });
            return;
        }
        const data = parsed.data;
        const [existing] = await db_1.db
            .select()
            .from(schema.usuarios)
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, userId))
            .limit(1);
        if (!existing) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        const [updated] = await db_1.db
            .update(schema.usuarios)
            .set({
            nombres: data.nombres,
            apellidos: data.apellidos,
            telefono: data.telefono,
            semestre_actual: data.semestre_actual,
            fecha_nacimiento: data.fecha_nacimiento,
            updated_at: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, userId))
            .returning({
            id: schema.usuarios.id,
            nombres: schema.usuarios.nombres,
            apellidos: schema.usuarios.apellidos,
            correo: schema.usuarios.correo
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateProfile = updateProfile;
// Actualizar preferencias del usuario (idioma)
const updatePreferences = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                message: "Usuario no autenticado"
            });
            return;
        }
        const parsed = updatePreferencesSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: "Datos inválidos",
                errors: parsed.error.errors
            });
            return;
        }
        const { idioma } = parsed.data;
        const [updatedUser] = await db_1.db
            .update(schema.usuarios)
            .set({
            idioma
        })
            .where((0, drizzle_orm_1.eq)(schema.usuarios.id, userId))
            .returning({
            idioma: schema.usuarios.idioma
        });
        res.status(200).json({
            message: "Preferencias actualizadas correctamente",
            preferences: updatedUser
        });
    }
    catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({
            message: "Error en el servidor"
        });
    }
};
exports.updatePreferences = updatePreferences;
// Reportar un problema
const reportIssue = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                message: "Usuario no autenticado"
            });
            return;
        }
        const parsed = sendReportSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: "Datos inválidos",
                errors: parsed.error.errors
            });
            return;
        }
        const data = parsed.data;
        const [newReport] = await db_1.db
            .insert(schema.fallas_tecnicas)
            .values({
            usuario_id: userId,
            titulo: data.titulo,
            descripcion: data.descripcion
        })
            .returning();
        res.status(201).json({
            message: "Problema reportado correctamente",
            report: newReport
        });
    }
    catch (error) {
        console.error("Error reporting issue:", error);
        res.status(500).json({
            message: "Error en el servidor"
        });
    }
};
exports.reportIssue = reportIssue;
// Enviar feedback
const sendFeedback = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                message: "Usuario no autenticado"
            });
            return;
        }
        const parsed = sendFeedbackSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: "Datos inválidos",
                errors: parsed.error.errors
            });
            return;
        }
        const data = parsed.data;
        const [newFeedback] = await db_1.db
            .insert(schema.feedback)
            .values({
            usuario_id: userId,
            puntaje: data.puntaje,
            que_mas_te_gusto: data.que_mas_te_gusto,
            comentarios: data.comentarios
        })
            .returning();
        res.status(201).json({
            message: "Feedback enviado correctamente",
            feedback: newFeedback
        });
    }
    catch (error) {
        console.error("Error sending feedback:", error);
        res.status(500).json({
            message: "Error en el servidor"
        });
    }
};
exports.sendFeedback = sendFeedback;
// Obtener código de conducta, política de privacidad y términos
const getCodeOfConduct = async (req, res) => {
    try {
        const result = await db_1.db
            .select()
            .from(schema.texto_aplicacion)
            .where((0, drizzle_orm_1.eq)(schema.texto_aplicacion.codigo, "code_of_conduct"))
            .limit(1);
        if (result.length === 0) {
            res.status(404).json({
                message: "Código de conducta no encontrado"
            });
            return;
        }
        res.status(200).json(result[0]);
    }
    catch (error) {
        res.status(500).json({
            message: "Error obteniendo código de conducta",
            error
        });
    }
};
exports.getCodeOfConduct = getCodeOfConduct;
const getPrivacyPolicy = async (req, res) => {
    try {
        const result = await db_1.db
            .select()
            .from(schema.texto_aplicacion)
            .where((0, drizzle_orm_1.eq)(schema.texto_aplicacion.codigo, "privacy_policy"))
            .limit(1);
        if (result.length === 0) {
            res.status(404).json({
                message: "Política de privacidad no encontrada"
            });
            return;
        }
        res.status(200).json(result[0]);
    }
    catch (error) {
        res.status(500).json({
            message: "Error obteniendo política de privacidad",
            error
        });
    }
};
exports.getPrivacyPolicy = getPrivacyPolicy;
const getTerms = async (req, res) => {
    try {
        const result = await db_1.db
            .select()
            .from(schema.texto_aplicacion)
            .where((0, drizzle_orm_1.eq)(schema.texto_aplicacion.codigo, "terms"))
            .limit(1);
        if (result.length === 0) {
            res.status(404).json({
                message: "Términos y condiciones no encontrados"
            });
            return;
        }
        res.status(200).json(result[0]);
    }
    catch (error) {
        res.status(500).json({
            message: "Error obteniendo términos y condiciones",
            error
        });
    }
};
exports.getTerms = getTerms;
