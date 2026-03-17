"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const notificacion_controller_1 = require("../controllers/notificacion.controller");
const router = (0, express_1.Router)();
// Middleware para requerir roles específicos
const requireRole = (roles) => {
    return (req, res, next) => {
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
router.use(auth_middleware_1.authenticate);
// Obtener notificaciones del usuario
router.get('/', notificacion_controller_1.getNotificaciones);
// Obtener conteo de notificaciones no leídas
router.get('/no-leidas', notificacion_controller_1.getConteoNoLeidas);
// Marcar todas las notificaciones como leídas
router.put('/leer-todas', notificacion_controller_1.marcarTodasLeidas);
// Marcar una notificación específica como leída
router.put('/:id/leer', notificacion_controller_1.marcarLeida);
// Eliminar una notificación
router.delete('/:id', notificacion_controller_1.eliminarNotificacion);
// ================================
// PREFERENCIAS DE NOTIFICACIÓN
// ================================
// Obtener preferencias del usuario
router.get('/preferencias', notificacion_controller_1.getPreferencias);
// Actualizar preferencias del usuario
router.put('/preferencias', notificacion_controller_1.actualizarPreferencias);
// ================================
// RUTAS DE ADMINISTRADOR
// ================================
// Crear nueva notificación (admin)
router.post('/crear', requireRole(['admin', 'psicologo']), notificacion_controller_1.crearNuevaNotificacion);
// Procesar notificaciones manualmente (admin)
router.post('/admin/procesar', requireRole(['admin']), notificacion_controller_1.procesarNotificaciones);
// Enviar notificaciones pendientes (admin)
router.post('/admin/enviar', requireRole(['admin']), notificacion_controller_1.enviarPendientes);
// Obtener estado de cronjobs (admin)
router.get('/admin/cronjobs', requireRole(['admin']), notificacion_controller_1.getEstadoCronjobs);
// Ejecutar un cronjob manualmente (admin)
router.post('/admin/cronjobs/ejecutar', requireRole(['admin']), notificacion_controller_1.ejecutarCronjob);
exports.default = router;
