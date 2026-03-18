import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  listChats, 
  getChatById, 
  createChat, 
  updateChatPut, 
  updateChatPatch, 
  deleteChat, 
  chatConIA, 
  getHistorialChatIA,
  chatConIAAvanzado,
  obtenerActividadesRecomendadas,
  obtenerEstadoPsicologicoUsuario
} from '../controllers/chat.controller';
import { createMensaje, deleteMensaje, getMensajeById, listMensajes, updateMensajePatch, updateMensajePut } from '../controllers/chat-mensajes.controller';

const router = Router();

// ⚠️ RUTAS IA DEBEN IR PRIMERO (antes de /:chatId para evitar conflictos)
router.post('/ia', authenticate, chatConIA);
router.get('/ia/historial', authenticate, getHistorialChatIA);
router.post('/ia/avanzado', authenticate, chatConIAAvanzado);
router.get('/actividades/recomendadas', authenticate, obtenerActividadesRecomendadas);
router.get('/estado-psicologico', authenticate, obtenerEstadoPsicologicoUsuario);

// CRUD de Chats (después de rutas /ia)
router.get('/', authenticate, listChats)
router.post('/', authenticate, createChat)
router.get('/:chatId', authenticate, getChatById)
router.put('/:chatId', authenticate, updateChatPut)
router.patch('/:chatId', authenticate, updateChatPatch)
router.delete('/:chatId', authenticate, deleteChat)

// Subrutas de Mensajes
router.get('/:chatId/mensajes', authenticate, listMensajes)
router.get('/:chatId/mensajes/:mensajeId', authenticate, getMensajeById)
router.post('/:chatId/mensajes', authenticate, createMensaje)
router.put('/:chatId/mensajes/:mensajeId', authenticate, updateMensajePut)
router.patch('/:chatId/mensajes/:mensajeId', authenticate, updateMensajePatch)
router.delete('/:chatId/mensajes/:mensajeId', authenticate, deleteMensaje)

export default router;