// ROUTES
import { Router } from 'express';

// CONTROLLERS
import * as authController from '../controllers/auth.controller';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user/psychologist and get token
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route POST /api/auth/recover-password
 * @desc Recover and update user password
 * @access Public
 */
router.post('/recover-password', authController.recoverPassword);

export default router; 