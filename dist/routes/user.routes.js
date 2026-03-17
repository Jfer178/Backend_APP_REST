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
const auth_middleware_1 = require("../middleware/auth.middleware");
const userController = __importStar(require("../controllers/user.controller"));
const router = (0, express_1.Router)();
// Listar usuarios (solo psicólogo)
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.isPsicologo, userController.listUsers);
// Crear usuario (solo psicólogo)
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.isPsicologo, userController.createUser);
/**
 * @route GET /api/users/profile
 * @desc Get authenticated user profile
 * @access Private
 */
router.get('/profile', auth_middleware_1.authenticate, auth_middleware_1.isUsuario, userController.getProfile);
// Obtener usuario por id (autenticado y dueño o psicólogo)
router.get('/:id', auth_middleware_1.authenticate, userController.getUserById);
// Actualizar usuario completo (solo psicólogo o dueño con restricciones)
router.put('/:id', auth_middleware_1.authenticate, userController.updateUserPut);
// Actualización parcial
router.patch('/:id', auth_middleware_1.authenticate, userController.updateUserPatch);
// Eliminar usuario (solo psicólogo)
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.isPsicologo, userController.deleteUser);
exports.default = router;
