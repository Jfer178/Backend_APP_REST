import { Router } from 'express';
import { authenticate, isUsuario } from '../middleware/auth.middleware';
import {
  validateGetRespuestasUsuarioPorFecha,
  validateSaveRespuestasRegistroEmocional,
} from '../middleware/registro-emocional.middleware';
import {
  getPreguntasRegistroEmocional,
  getRespuestasUsuarioPorFecha,
  saveRespuestasRegistroEmocional,
} from '../controllers/registro-emocional.controller';
import {
  getCalendarioEmocional,
  getRachas,
  getEstadisticas,
  getResumenDia,
  getPantallaPersonal,
  activarRachaDiaria,
} from '../controllers/estadisticas-registro-emocional.controller';

const router = Router();

// Rutas básicas
router.get('/preguntas', authenticate, getPreguntasRegistroEmocional);

router.get(
  '/usuarios/:usuarioId/fecha/:fecha',
  authenticate,
  isUsuario,
  validateGetRespuestasUsuarioPorFecha,
  getRespuestasUsuarioPorFecha,
);

router.post('/', authenticate, isUsuario, validateSaveRespuestasRegistroEmocional, saveRespuestasRegistroEmocional);

// Rutas de estadísticas y análisis (deben ir antes de las rutas con parámetros generales)
router.get('/calendario', authenticate, isUsuario, getCalendarioEmocional);
router.get('/rachas', authenticate, isUsuario, getRachas);
router.get('/estadisticas', authenticate, isUsuario, getEstadisticas);
router.get('/pantalla-personal', authenticate, isUsuario, getPantallaPersonal);
router.post('/pantalla-personal/activar-racha', authenticate, isUsuario, activarRachaDiaria);
router.get('/resumen-dia/:fecha', authenticate, isUsuario, getResumenDia);

export default router;
