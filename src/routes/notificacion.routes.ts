import { Router, Response, NextFunction } from 'express';
import { authenticate, isAdmin, isPsicologo, AuthRequest } from '../middleware/auth.middleware';
import {
  getNotificaciones,
  getConteoNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  getPreferencias,
  actualizarPreferencias,
  crearNuevaNotificacion,
  eliminarNotificacion,
  procesarNotificaciones,
  enviarPendientes,
  getEstadoCronjobs,
  ejecutarCronjob,
} from '../controllers/notificacion.controller';

const router = Router();

// Middleware para requerir roles específicos
const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
};

// ================================
// RUTAS PÚBLICAS (requieren autenticación)
// ================================

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener notificaciones del usuario
router.get('/', getNotificaciones);

// Obtener conteo de notificaciones no leídas
router.get('/no-leidas', getConteoNoLeidas);

// Marcar todas las notificaciones como leídas
router.put('/leer-todas', marcarTodasLeidas);

// Marcar una notificación específica como leída
router.put('/:id/leer', marcarLeida);

// Eliminar una notificación
router.delete('/:id', eliminarNotificacion);

// ================================
// PREFERENCIAS DE NOTIFICACIÓN
// ================================

// Obtener preferencias del usuario
router.get('/preferencias', getPreferencias);

// Actualizar preferencias del usuario
router.put('/preferencias', actualizarPreferencias);

// ================================
// RUTAS DE ADMINISTRADOR
// ================================

// Crear nueva notificación (admin)
router.post('/crear', requireRole(['admin', 'psicologo']), crearNuevaNotificacion);

// Procesar notificaciones manualmente (admin)
router.post('/admin/procesar', requireRole(['admin']), procesarNotificaciones);

// Enviar notificaciones pendientes (admin)
router.post('/admin/enviar', requireRole(['admin']), enviarPendientes);

// Obtener estado de cronjobs (admin)
router.get('/admin/cronjobs', requireRole(['admin']), getEstadoCronjobs);

// Ejecutar un cronjob manualmente (admin)
router.post('/admin/cronjobs/ejecutar', requireRole(['admin']), ejecutarCronjob);

export default router;
