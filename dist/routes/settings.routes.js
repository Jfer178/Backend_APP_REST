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
const express_1 = require("express");
const settingsController = __importStar(require("../controllers/settings.controller"));
// Rutas para configuración y ajustes del usuario
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.get("/profile", settingsController.getProfile);
router.put("/profile", settingsController.updateProfile);
// Rutas para preferencias (ej. idioma)
router.put("/preferences", settingsController.updatePreferences);
// Rutas para reportar problemas y enviar feedback
router.post("/report", settingsController.reportIssue);
router.post("/feedback", settingsController.sendFeedback);
// Rutas para obtener código de conducta, política de privacidad y términos
router.get("/code-of-conduct", settingsController.getCodeOfConduct);
router.get("/privacy-policy", settingsController.getPrivacyPolicy);
router.get("/terms", settingsController.getTerms);
exports.default = router;
