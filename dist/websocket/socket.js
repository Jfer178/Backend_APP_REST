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
exports.setupWebSocket = void 0;
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const setupWebSocket = (io) => {
    // Keep track of online users
    const onlineUsers = new Map();
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);
        // Handle user authentication
        socket.on('authenticate', async (data) => {
            try {
                const { userId } = data;
                onlineUsers.set(userId, socket);
                console.log(`User ${userId} is now online`);
                // Notify the client of successful authentication
                socket.emit('authenticated', { success: true, userId });
                // Associate the socket with rooms for each chat the user is part of
                const chats = await getChatsForUser(userId);
                chats.forEach(chatId => {
                    socket.join(`chat:${chatId}`);
                });
            }
            catch (error) {
                console.error('Authentication error:', error);
                socket.emit('authenticated', { success: false, error: 'Authentication failed' });
            }
        });
        // Handle new messages
        socket.on('chat_message', async (messageData) => {
            try {
                const { chatId, userId, mensaje } = messageData;
                const [newMessage] = await db_1.db.insert(schema.mensajes_chat)
                    .values({ chat_id: chatId, usuario_id: userId, mensaje })
                    .returning();
                // Broadcast message to all users in the chat
                io.to(`chat:${chatId}`).emit('new_message', {
                    id: newMessage.id,
                    chatId,
                    userId,
                    mensaje,
                    enviado_en: newMessage.enviado_en
                });
            }
            catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Handle user joining a specific chat
        socket.on('join_chat', (chatId) => {
            socket.join(`chat:${chatId}`);
            socket.emit('joined_chat', { chatId });
        });
        // Handle user is typing notification
        socket.on('typing', (data) => {
            socket.to(`chat:${data.chatId}`).emit('user_typing', {
                chatId: data.chatId,
                userId: data.userId,
                isTyping: data.isTyping
            });
        });
        // Handle disconnection
        socket.on('disconnect', () => {
            // Remove user from online map
            for (const [userId, userSocket] of onlineUsers.entries()) {
                if (userSocket.id === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        });
    });
};
exports.setupWebSocket = setupWebSocket;
// Helper function to get all chats for a specific user or psychologist
async function getChatsForUser(userId) {
    try {
        const chats = await db_1.db
            .select({ id: schema.chats.id })
            .from(schema.chats)
            .where((0, drizzle_orm_1.eq)(schema.chats.estudiante_id, userId));
        return chats.map(c => c.id);
    }
    catch (error) {
        console.error('Error getting chats:', error);
        return [];
    }
}
