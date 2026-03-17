import { Router } from 'express';
import { authenticate, isUsuario } from '../middleware/auth.middleware';
import { listRegistros, getRegistroById, createRegistro, updateRegistroPut, updateRegistroPatch, deleteRegistro } from '../controllers/registro-actividades.controller';
import { asignarActividadDiaria, getActividadesDiarias } from '../controllers/actividades-diarias.controller';
import { listarTecnicasRelajacion, registrarPracticaTecnica } from '../controllers/tecnicas-relajacion.controller';

const router = Router();

router.get('/', authenticate, isUsuario, listRegistros);
router.get('/diarias', authenticate, isUsuario, getActividadesDiarias);
router.post('/diarias/asignar', authenticate, isUsuario, asignarActividadDiaria);
router.get('/tecnicas-relajacion', authenticate, isUsuario, listarTecnicasRelajacion);
router.post('/tecnicas-relajacion/practicar', authenticate, isUsuario, registrarPracticaTecnica);
router.get('/:id', authenticate, isUsuario, getRegistroById);
router.post('/', authenticate, isUsuario, createRegistro);
router.put('/:id', authenticate, isUsuario, updateRegistroPut);
router.patch('/:id', authenticate, isUsuario, updateRegistroPatch);
router.delete('/:id', authenticate, isUsuario, deleteRegistro);

export default router;