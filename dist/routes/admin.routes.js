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
const adminController = __importStar(require("../controllers/admin.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route POST /api/admin/addPsychologist
 * @desc Get authenticated user profile
 * @access Private
 */
router.post("/addPsychologist", auth_middleware_1.authenticate, auth_middleware_1.isAdmin, adminController.registerPsychologist);
/**
 * @route GET /api/admin/count
 * @desc Get authenticated user profile
 * @access Private
 */
router.get("/count", auth_middleware_1.authenticate, auth_middleware_1.isAdmin, adminController.countUsuarios);
/**
 * @route GET /api/admin/students
 * @desc Get authenticated user profile
 * @access Private
 */
router.get("/students", auth_middleware_1.authenticate, auth_middleware_1.isAdmin, adminController.getStudents);
/**
 * @route GET /api/admin/students/:id
 * @desc Get authenticated user profile
 * @access Private
 */
router.get("/students/:id", auth_middleware_1.authenticate, auth_middleware_1.isAdmin, adminController.getStudentById);
/**
 * @route GET /api/admin/psychologists
 * @desc Get authenticated user profile
 * @access Private
 */
router.get("/psychologists", auth_middleware_1.authenticate, auth_middleware_1.isAdmin, adminController.getPsychologists);
/**
 * @route GET /api/admin/psychologists/:id
 * @desc Get authenticated user profile
 * @access Private
 */
router.get("/psychologists/:id", auth_middleware_1.authenticate, auth_middleware_1.isAdmin, adminController.getPsychologistById);
/**
 * @route PUT /api/admin/psychologists/:id
 * @desc Get authenticated user profile
 * @access Private
 */
router.put("/psychologists/:id", auth_middleware_1.authenticate, auth_middleware_1.isAdmin, adminController.updatePsychologist);
/**
 * @route DELETE /api/admin/psychologists/:id
 * @desc Get authenticated user profile
 * @access Private
 */
router.delete("/psychologists/:id", auth_middleware_1.authenticate, auth_middleware_1.isAdmin, adminController.deletePsychologist);
exports.default = router;
