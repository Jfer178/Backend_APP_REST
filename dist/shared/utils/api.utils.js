"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIErrorResponse = exports.APISuccessResponse = void 0;
// Utils para respuestas exitosas
const APISuccessResponse = (data, message, metadata) => {
    return {
        success: true,
        message,
        data,
        metadata,
        errors: null
    };
};
exports.APISuccessResponse = APISuccessResponse;
// Utils para respuestas de error
const APIErrorResponse = (message, errors) => {
    return {
        success: false,
        message,
        errors: errors || []
    };
};
exports.APIErrorResponse = APIErrorResponse;
