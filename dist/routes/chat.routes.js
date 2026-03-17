"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const chat_controller_1 = require("../controllers/chat.controller");
const chat_mensajes_controller_1 = require("../controllers/chat-mensajes.controller");
const router = (0, express_1.Router)();
// CRUD de Chats
router.get('/', auth_middleware_1.authenticate, chat_controller_1.listChats);
router.get('/:chatId', auth_middleware_1.authenticate, chat_controller_1.getChatById);
router.post('/', auth_middleware_1.authenticate, chat_controller_1.createChat);
router.put('/:chatId', auth_middleware_1.authenticate, chat_controller_1.updateChatPut);
router.patch('/:chatId', auth_middleware_1.authenticate, chat_controller_1.updateChatPatch);
router.delete('/:chatId', auth_middleware_1.authenticate, chat_controller_1.deleteChat);
// Subrutas de Mensajes
router.get('/:chatId/mensajes', auth_middleware_1.authenticate, chat_mensajes_controller_1.listMensajes);
router.get('/:chatId/mensajes/:mensajeId', auth_middleware_1.authenticate, chat_mensajes_controller_1.getMensajeById);
router.post('/:chatId/mensajes', auth_middleware_1.authenticate, chat_mensajes_controller_1.createMensaje);
router.put('/:chatId/mensajes/:mensajeId', auth_middleware_1.authenticate, chat_mensajes_controller_1.updateMensajePut);
router.patch('/:chatId/mensajes/:mensajeId', auth_middleware_1.authenticate, chat_mensajes_controller_1.updateMensajePatch);
router.delete('/:chatId/mensajes/:mensajeId', auth_middleware_1.authenticate, chat_mensajes_controller_1.deleteMensaje);
// Rutas IA existentes
router.post('/ia', auth_middleware_1.authenticate, chat_controller_1.chatConIA);
router.get('/ia/historial', auth_middleware_1.authenticate, chat_controller_1.getHistorialChatIA);
// Rutas IA avanzadas
router.post('/ia/avanzado', auth_middleware_1.authenticate, chat_controller_1.chatConIAAvanzado);
router.get('/actividades/recomendadas', auth_middleware_1.authenticate, chat_controller_1.obtenerActividadesRecomendadas);
router.get('/estado-psicologico', auth_middleware_1.authenticate, chat_controller_1.obtenerEstadoPsicologicoUsuario);
exports.default = router;
