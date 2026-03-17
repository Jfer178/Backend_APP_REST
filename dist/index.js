"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Express
const express_1 = __importDefault(require("express"));
// DB
const migrate_1 = require("./db/migrate");
const seed_1 = require("./db/seed");
// LIBS
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Logger
const morgan_1 = __importDefault(require("morgan"));
// HTTP
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const socket_1 = require("./websocket/socket");
// UTILS
const api_utils_1 = require("./shared/utils/api.utils");
// IA
const ollama_service_1 = require("./services/ollama.service");
// ROUTES
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const diario_routes_1 = __importDefault(require("./routes/diario.routes"));
const encuestas_routes_1 = __importDefault(require("./routes/encuestas.routes"));
const evaluacion_routes_1 = __importDefault(require("./routes/evaluacion.routes"));
const opciones_actividades_routes_1 = __importDefault(require("./routes/opciones-actividades.routes"));
const registro_actividades_routes_1 = __importDefault(require("./routes/registro-actividades.routes"));
const encuestas_respuestas_routes_1 = __importDefault(require("./routes/encuestas-respuestas.routes"));
const registro_emocional_routes_1 = __importDefault(require("./routes/registro-emocional.routes"));
const notificacion_routes_1 = __importDefault(require("./routes/notificacion.routes"));
// CRONJOBS
const notificacion_cron_1 = require("./jobs/notificacion.cron");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
// Middleware
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/evaluaciones', evaluacion_routes_1.default);
app.use('/api/chats', chat_routes_1.default);
app.use('/api/encuestas', encuestas_routes_1.default);
app.use('/api/encuestas-respuestas', encuestas_respuestas_routes_1.default);
app.use('/api/diario', diario_routes_1.default);
app.use('/api/opciones-actividades', opciones_actividades_routes_1.default);
app.use('/api/registro-actividades', registro_actividades_routes_1.default);
app.use('/api/registro-emocional', registro_emocional_routes_1.default);
app.use('/api/notificaciones', notificacion_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// Health check endpoint
app.get('/health', (_, res) => {
    res.status(200).json((0, api_utils_1.APISuccessResponse)({ health: 'ok' }, 'Health check successful'));
});
// Setup WebSocket
(0, socket_1.setupWebSocket)(io);
// Initialize database and start server
const PORT = process.env.PORT || 3000;
// Run migrations and seed data before starting the server
async function initializeAndStartServer() {
    try {
        console.log('Initializing database...');
        // Run migrations to create tables if they don't exist
        await (0, migrate_1.runMigrations)();
        // Seed basic data if needed
        await (0, seed_1.seed)();
        // Initialize Ollama if enabled
        try {
            await (0, ollama_service_1.initializeOllama)();
        }
        catch (ollamaError) {
            console.warn('Warning: Could not initialize Ollama:', ollamaError);
            console.log('Server will continue without Ollama support');
        }
        // Start cronjobs for notifications
        if (process.env.ENABLE_NOTIFICATION_CRON !== 'false') {
            (0, notificacion_cron_1.iniciarCronJobs)();
        }
        // Start the server
        server.listen(PORT, () => {
            console.log("\n*********************************************");
            console.log(`* SERVIDOR (API) CORRIENDO EN EL PUERTO ${PORT} *`);
            console.log("*********************************************\n");
            // console.log(`Health check available at http://localhost:${PORT}/health`);
            // console.log(`AI Chat available at http://localhost:${PORT}/api/chats/ia`);
            // console.log(`Advanced AI Chat available at http://localhost:${PORT}/api/chats/ia/avanzado`);
        });
    }
    catch (error) {
        console.error('Failed to initialize the server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    (0, notificacion_cron_1.detenerCronJobs)();
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    (0, notificacion_cron_1.detenerCronJobs)();
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
initializeAndStartServer();
exports.default = server;
