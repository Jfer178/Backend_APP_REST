"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsNotificacionesRelations = exports.logs_notificaciones = exports.preferenciasNotificacionRelations = exports.preferencias_notificacion = exports.notificacionesRelations = exports.notificaciones = exports.texto_aplicacion = exports.fallas_tecnicasrelations = exports.fallas_tecnicas = exports.feedbackrelations = exports.feedback = exports.diario = exports.mensajes_chat_usuariosrelations = exports.mensajes_chat = exports.chats = exports.registro_actividades_usuariosrelations = exports.registro_actividades_usuarios = exports.opciones_registro_actividades = exports.opciones_registro_emocionalrelations = exports.preguntas_registro_emocionalrelations = exports.registro_emocional_usuariosrelations = exports.registro_emocional = exports.opciones_registro_emocional = exports.preguntas_registro_emocional = exports.encuestasRespuestasrelations = exports.encuestasRespuestas = exports.encuestas = exports.evaluacionesRespuestasUsuariosrelations = exports.evaluacionesRespuestasUsuarios = exports.respuestasrelations = exports.respuestas = exports.preguntasrelations = exports.preguntas = exports.evaluacionesrelations = exports.evaluaciones = exports.rolesrelations = exports.roles = exports.usuariosrelations = exports.usuarios = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
// ================================
// USUARIOS
// ================================
exports.usuarios = (0, pg_core_1.pgTable)('usuarios', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    id_rol: (0, pg_core_1.integer)('id_rol')
        .references(() => exports.roles.id, { onDelete: 'set null' }),
    nombres: (0, pg_core_1.varchar)('nombres', { length: 255 }).notNull(),
    apellidos: (0, pg_core_1.varchar)('apellidos', { length: 255 }).notNull(),
    correo: (0, pg_core_1.varchar)('correo', { length: 255 }).unique().notNull(),
    contrasena: (0, pg_core_1.varchar)('contrasena', { length: 255 }).notNull(),
    ciudad: (0, pg_core_1.varchar)('ciudad', { length: 255 }),
    semestre_actual: (0, pg_core_1.varchar)('semestre_actual', { length: 255 }),
    telefono: (0, pg_core_1.varchar)('telefono', { length: 50 }),
    edad: (0, pg_core_1.integer)('edad'),
    sexo: (0, pg_core_1.varchar)('sexo', { length: 10 }),
    fecha_nacimiento: (0, pg_core_1.date)('fecha_nacimiento'),
    idioma: (0, pg_core_1.varchar)('idioma', { length: 255 }),
    especialidad_psicologo: (0, pg_core_1.varchar)('especialidad_psicologo', { length: 255 }),
    fecha_registro: (0, pg_core_1.timestamp)('fecha_registro').defaultNow().notNull(),
    is_active: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxUsuariosIdRol: (0, pg_core_1.index)('idx_usuarios_id_rol').on(t.id_rol),
}));
exports.usuariosrelations = (0, drizzle_orm_1.relations)(exports.usuarios, ({ one }) => ({
    rol: one(exports.roles, {
        fields: [exports.usuarios.id_rol],
        references: [exports.roles.id],
    }),
}));
// ================================
// ROLES
// ================================
exports.roles = (0, pg_core_1.pgTable)('roles', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    nombre: (0, pg_core_1.varchar)('nombre', { length: 255 }).unique().notNull(),
    descripcion: (0, pg_core_1.text)('descripcion'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
});
exports.rolesrelations = (0, drizzle_orm_1.relations)(exports.roles, ({ many }) => ({
    usuarios: many(exports.usuarios),
}));
// ================================
// PREGUNTAS Y RESPUESTAS (ej: test personal diario)
// ================================
exports.evaluaciones = (0, pg_core_1.pgTable)('evaluaciones', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    usuario_id: (0, pg_core_1.integer)('usuario_id').references(() => exports.usuarios.id, { onDelete: 'set null' }),
    fecha: (0, pg_core_1.timestamp)('fecha').defaultNow().notNull(),
    puntaje_total: (0, pg_core_1.integer)('puntaje_total'),
    estado_semaforo: (0, pg_core_1.varchar)('estado_semaforo', { length: 50 }),
    observaciones: (0, pg_core_1.text)('observaciones'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxEvaluacionesUsuarioId: (0, pg_core_1.index)('idx_evaluaciones_usuario_id').on(t.usuario_id),
}));
exports.evaluacionesrelations = (0, drizzle_orm_1.relations)(exports.evaluaciones, ({ one }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.evaluaciones.usuario_id],
        references: [exports.usuarios.id],
    }),
}));
exports.preguntas = (0, pg_core_1.pgTable)('preguntas', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    texto: (0, pg_core_1.text)('texto').notNull(),
    peso: (0, pg_core_1.integer)('peso').default(1).notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
});
exports.preguntasrelations = (0, drizzle_orm_1.relations)(exports.preguntas, ({ many }) => ({
    respuestas: many(exports.respuestas),
}));
exports.respuestas = (0, pg_core_1.pgTable)('respuestas', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    evaluacion_id: (0, pg_core_1.integer)('evaluacion_id')
        .references(() => exports.evaluaciones.id, { onDelete: 'set null' }),
    pregunta_id: (0, pg_core_1.integer)('pregunta_id')
        .references(() => exports.preguntas.id, { onDelete: 'set null' }),
    respuesta: (0, pg_core_1.integer)('respuesta'),
    puntaje_calculado: (0, pg_core_1.integer)('puntaje_calculado'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxRespuestasEvaluacionId: (0, pg_core_1.index)('idx_respuestas_evaluacion_id').on(t.evaluacion_id),
    idxRespuestasPreguntaId: (0, pg_core_1.index)('idx_respuestas_pregunta_id').on(t.pregunta_id),
}));
exports.respuestasrelations = (0, drizzle_orm_1.relations)(exports.respuestas, ({ one }) => ({
    pregunta: one(exports.preguntas, {
        fields: [exports.respuestas.pregunta_id],
        references: [exports.preguntas.id],
    }),
    evaluacion: one(exports.evaluaciones, {
        fields: [exports.respuestas.evaluacion_id],
        references: [exports.evaluaciones.id],
    }),
}));
exports.evaluacionesRespuestasUsuarios = (0, pg_core_1.pgTable)('evaluaciones_respuestas_usuarios', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    evaluacion_id: (0, pg_core_1.integer)('evaluacion_id')
        .references(() => exports.evaluaciones.id, { onDelete: 'set null' }),
    respuestas: (0, pg_core_1.text)('respuestas'), // JSON con las respuestas de la evaluacion
    fecha: (0, pg_core_1.timestamp)('fecha').defaultNow().notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxEvalRespUsuariosUsuarioId: (0, pg_core_1.index)('idx_eval_resp_usuarios_usuario_id').on(t.usuario_id),
    idxEvalRespUsuariosEvaluacionId: (0, pg_core_1.index)('idx_eval_resp_usuarios_evaluacion_id').on(t.evaluacion_id),
}));
exports.evaluacionesRespuestasUsuariosrelations = (0, drizzle_orm_1.relations)(exports.evaluacionesRespuestasUsuarios, ({ one }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.evaluacionesRespuestasUsuarios.usuario_id],
        references: [exports.usuarios.id],
    }),
    evaluacion: one(exports.evaluaciones, {
        fields: [exports.evaluacionesRespuestasUsuarios.evaluacion_id],
        references: [exports.evaluaciones.id],
    }),
}));
// ================================
// ESTADISTICAS (cómo supiste de mí, ...)
// ================================
exports.encuestas = (0, pg_core_1.pgTable)('encuestas', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    codigo: (0, pg_core_1.varchar)('codigo', { length: 255 }).unique().notNull(),
    titulo: (0, pg_core_1.varchar)('titulo', { length: 255 }).notNull(),
    opciones: (0, pg_core_1.text)('opciones'), // JSON con las opciones de la encuesta
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
});
exports.encuestasRespuestas = (0, pg_core_1.pgTable)('encuestas_respuestas', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    encuesta_id: (0, pg_core_1.integer)('encuesta_id')
        .references(() => exports.encuestas.id, { onDelete: 'set null' }),
    respuesta: (0, pg_core_1.text)('respuesta'), // JSON con la respuesta de la encuesta
    fecha: (0, pg_core_1.timestamp)('fecha').defaultNow().notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxEncuestasRespuestasUsuarioId: (0, pg_core_1.index)('idx_encuestas_respuestas_usuario_id').on(t.usuario_id),
    idxEncuestasRespuestasEncuestaId: (0, pg_core_1.index)('idx_encuestas_respuestas_encuesta_id').on(t.encuesta_id),
}));
exports.encuestasRespuestasrelations = (0, drizzle_orm_1.relations)(exports.encuestasRespuestas, ({ one }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.encuestasRespuestas.usuario_id],
        references: [exports.usuarios.id],
    }),
    encuesta: one(exports.encuestas, {
        fields: [exports.encuestasRespuestas.encuesta_id],
        references: [exports.encuestas.id],
    }),
}));
// ================================
// REGISTRO EMOCIONAL
// ================================
exports.preguntas_registro_emocional = (0, pg_core_1.pgTable)('preguntas_registro_emocional', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    texto: (0, pg_core_1.text)('texto').notNull(),
    is_active: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    uqPreguntasRegistroEmocionalTexto: (0, pg_core_1.uniqueIndex)('uq_preguntas_registro_emocional_texto').on(t.texto),
}));
exports.opciones_registro_emocional = (0, pg_core_1.pgTable)('opciones_registro_emocional', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pregunta_id: (0, pg_core_1.integer)('pregunta_id')
        .references(() => exports.preguntas_registro_emocional.id, { onDelete: 'set null' }),
    nombre: (0, pg_core_1.varchar)('nombre', { length: 255 }).notNull(),
    descripcion: (0, pg_core_1.text)('descripcion'),
    url_imagen: (0, pg_core_1.varchar)('url_imagen', { length: 255 }).notNull(),
    puntaje: (0, pg_core_1.integer)('puntaje').notNull(),
    is_active: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
});
exports.registro_emocional = (0, pg_core_1.pgTable)('registro_emocional', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    pregunta_id: (0, pg_core_1.integer)('pregunta_id')
        .references(() => exports.preguntas_registro_emocional.id, { onDelete: 'set null' }),
    opcion_id: (0, pg_core_1.integer)('opcion_id')
        .references(() => exports.opciones_registro_emocional.id, { onDelete: 'set null' }),
    puntaje: (0, pg_core_1.integer)('puntaje').default(0).notNull(),
    fecha_dia: (0, pg_core_1.date)('fecha_dia').default((0, drizzle_orm_1.sql) `CURRENT_DATE`).notNull(),
    fecha: (0, pg_core_1.timestamp)('fecha').defaultNow().notNull(),
    observaciones: (0, pg_core_1.text)('observaciones'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxRegistroEmocionalUsuarioId: (0, pg_core_1.index)('idx_registro_emocional_usuario_id').on(t.usuario_id),
    idxRegistroEmocionalPreguntaId: (0, pg_core_1.index)('idx_registro_emocional_pregunta_id').on(t.pregunta_id),
    idxRegistroEmocionalOpcionId: (0, pg_core_1.index)('idx_registro_emocional_opcion_id').on(t.opcion_id),
    uqRegistroEmocionalUsuarioPreguntaFechaDia: (0, pg_core_1.uniqueIndex)('uq_registro_emocional_usuario_pregunta_fecha_dia')
        .on(t.usuario_id, t.pregunta_id, t.fecha_dia),
}));
exports.registro_emocional_usuariosrelations = (0, drizzle_orm_1.relations)(exports.registro_emocional, ({ one }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.registro_emocional.usuario_id],
        references: [exports.usuarios.id],
    }),
    pregunta: one(exports.preguntas_registro_emocional, {
        fields: [exports.registro_emocional.pregunta_id],
        references: [exports.preguntas_registro_emocional.id],
    }),
    opcion: one(exports.opciones_registro_emocional, {
        fields: [exports.registro_emocional.opcion_id],
        references: [exports.opciones_registro_emocional.id],
    }),
}));
exports.preguntas_registro_emocionalrelations = (0, drizzle_orm_1.relations)(exports.preguntas_registro_emocional, ({ many }) => ({
    opciones: many(exports.opciones_registro_emocional),
    registros: many(exports.registro_emocional),
}));
exports.opciones_registro_emocionalrelations = (0, drizzle_orm_1.relations)(exports.opciones_registro_emocional, ({ one }) => ({
    pregunta: one(exports.preguntas_registro_emocional, {
        fields: [exports.opciones_registro_emocional.pregunta_id],
        references: [exports.preguntas_registro_emocional.id],
    }),
}));
// ================================
// REGISTRO ACTIVIDADES
// ================================
exports.opciones_registro_actividades = (0, pg_core_1.pgTable)('opciones_registro_actividades', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    nombre: (0, pg_core_1.varchar)('nombre', { length: 255 }).notNull(),
    descripcion: (0, pg_core_1.text)('descripcion'),
    url_imagen: (0, pg_core_1.varchar)('url_imagen', { length: 255 }).notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
});
exports.registro_actividades_usuarios = (0, pg_core_1.pgTable)('registro_actividades_usuarios', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    opcion_id: (0, pg_core_1.integer)('opcion_id')
        .references(() => exports.opciones_registro_actividades.id, { onDelete: 'set null' }),
    vencimiento: (0, pg_core_1.timestamp)('vencimiento').defaultNow().notNull(),
    fecha: (0, pg_core_1.timestamp)('fecha').defaultNow().notNull(),
    observaciones: (0, pg_core_1.text)('observaciones'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxRegistroActividadesUsuariosUsuarioId: (0, pg_core_1.index)('idx_registro_actividades_usuarios_usuario_id').on(t.usuario_id),
    idxRegistroActividadesUsuariosOpcionId: (0, pg_core_1.index)('idx_registro_actividades_usuarios_opcion_id').on(t.opcion_id),
}));
exports.registro_actividades_usuariosrelations = (0, drizzle_orm_1.relations)(exports.registro_actividades_usuarios, ({ one }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.registro_actividades_usuarios.usuario_id],
        references: [exports.usuarios.id],
    }),
    opcion: one(exports.opciones_registro_actividades, {
        fields: [exports.registro_actividades_usuarios.opcion_id],
        references: [exports.opciones_registro_actividades.id],
    }),
}));
// ================================
// CHATS
// ================================
exports.chats = (0, pg_core_1.pgTable)('chats', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    estudiante_id: (0, pg_core_1.integer)('estudiante_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    psicologo_id: (0, pg_core_1.integer)('psicologo_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    iniciado_en: (0, pg_core_1.timestamp)('iniciado_en').defaultNow().notNull(),
    ultima_actividad: (0, pg_core_1.timestamp)('ultima_actividad').defaultNow().notNull(),
    finalizado_en: (0, pg_core_1.timestamp)('finalizado_en'),
    isSendByAi: (0, pg_core_1.boolean)('isSendByAi').default(false).notNull(),
    is_active: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxChatsEstudianteId: (0, pg_core_1.index)('idx_chats_estudiante_id').on(t.estudiante_id),
    idxChatsPsicologoId: (0, pg_core_1.index)('idx_chats_psicologo_id').on(t.psicologo_id),
}));
exports.mensajes_chat = (0, pg_core_1.pgTable)('mensajes_chat', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    chat_id: (0, pg_core_1.integer)('chat_id')
        .references(() => exports.chats.id, { onDelete: 'set null' }),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    mensaje: (0, pg_core_1.text)('mensaje').notNull(),
    enviado_en: (0, pg_core_1.timestamp)('enviado_en').defaultNow().notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxMensajesChatChatId: (0, pg_core_1.index)('idx_mensajes_chat_chat_id').on(t.chat_id),
    idxMensajesChatUsuarioId: (0, pg_core_1.index)('idx_mensajes_chat_usuario_id').on(t.usuario_id),
}));
exports.mensajes_chat_usuariosrelations = (0, drizzle_orm_1.relations)(exports.mensajes_chat, ({ one }) => ({
    chat: one(exports.chats, {
        fields: [exports.mensajes_chat.chat_id],
        references: [exports.chats.id],
    }),
    usuario: one(exports.usuarios, {
        fields: [exports.mensajes_chat.usuario_id],
        references: [exports.usuarios.id],
    }),
}));
// ================================
// DIARIO
// ================================
exports.diario = (0, pg_core_1.pgTable)('diario', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    titulo: (0, pg_core_1.varchar)('titulo', { length: 255 }).notNull(),
    contenido: (0, pg_core_1.text)('contenido').notNull(),
    fecha: (0, pg_core_1.timestamp)('fecha').defaultNow().notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxDiarioUsuarioId: (0, pg_core_1.index)('idx_diario_usuario_id').on(t.usuario_id),
}));
// ================================
// FEEDBACK
// ================================
exports.feedback = (0, pg_core_1.pgTable)('feedback', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    puntaje: (0, pg_core_1.integer)('puntaje').notNull(),
    que_mas_te_gusto: (0, pg_core_1.text)('que_mas_te_gusto').notNull(),
    comentarios: (0, pg_core_1.text)('comentarios'),
    fecha: (0, pg_core_1.timestamp)('fecha').defaultNow().notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxFeedbackUsuarioId: (0, pg_core_1.index)('idx_feedback_usuario_id').on(t.usuario_id),
}));
exports.feedbackrelations = (0, drizzle_orm_1.relations)(exports.feedback, ({ one }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.feedback.usuario_id],
        references: [exports.usuarios.id],
    }),
}));
// ================================
// FALLAS TECNICAS
// ================================
exports.fallas_tecnicas = (0, pg_core_1.pgTable)('fallas_tecnicas', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    titulo: (0, pg_core_1.varchar)('titulo', { length: 255 }).notNull(),
    descripcion: (0, pg_core_1.text)('descripcion').notNull(),
    fecha: (0, pg_core_1.timestamp)('fecha').defaultNow().notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxFallasTecnicasUsuarioId: (0, pg_core_1.index)('idx_fallas_tecnicas_usuario_id').on(t.usuario_id),
}));
exports.fallas_tecnicasrelations = (0, drizzle_orm_1.relations)(exports.fallas_tecnicas, ({ one }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.fallas_tecnicas.usuario_id],
        references: [exports.usuarios.id],
    }),
}));
// ================================
// TEXTO APLICACIÓN
// ================================
// TERMINOS Y CONDICIONES, PRIVACIDAD, CODIGO DE CONDUCTA, etc.
exports.texto_aplicacion = (0, pg_core_1.pgTable)('texto_aplicacion', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    codigo: (0, pg_core_1.varchar)('codigo', { length: 255 }).unique().notNull(),
    titulo: (0, pg_core_1.varchar)('titulo', { length: 255 }).notNull(),
    texto: (0, pg_core_1.text)('texto').notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
});
// ================================
// NOTIFICACIONES
// ================================
exports.notificaciones = (0, pg_core_1.pgTable)('notificaciones', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'cascade' }),
    tipo: (0, pg_core_1.varchar)('tipo', { length: 50 }).notNull(), // 'recordatorio_uso', 'alerta_emocional', 'recomendacion_actividad', 'seguimiento_evaluacion'
    titulo: (0, pg_core_1.varchar)('titulo', { length: 255 }).notNull(),
    mensaje: (0, pg_core_1.text)('mensaje').notNull(),
    prioridad: (0, pg_core_1.varchar)('prioridad', { length: 20 }).default('normal').notNull(), // 'baja', 'normal', 'alta', 'urgente'
    datos_adicionales: (0, pg_core_1.text)('datos_adicionales'), // JSON con datos extra según el tipo
    leida: (0, pg_core_1.boolean)('leida').default(false).notNull(),
    fecha_leida: (0, pg_core_1.timestamp)('fecha_leida'),
    enviada: (0, pg_core_1.boolean)('enviada').default(false).notNull(),
    fecha_envio: (0, pg_core_1.timestamp)('fecha_envio'),
    programada_para: (0, pg_core_1.timestamp)('programada_para'), // Para notificaciones programadas
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxNotificacionesUsuarioId: (0, pg_core_1.index)('idx_notificaciones_usuario_id').on(t.usuario_id),
    idxNotificacionesTipo: (0, pg_core_1.index)('idx_notificaciones_tipo').on(t.tipo),
    idxNotificacionesEnviada: (0, pg_core_1.index)('idx_notificaciones_enviada').on(t.enviada),
    idxNotificacionesProgramadaPara: (0, pg_core_1.index)('idx_notificaciones_programada_para').on(t.programada_para),
}));
exports.notificacionesRelations = (0, drizzle_orm_1.relations)(exports.notificaciones, ({ one }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.notificaciones.usuario_id],
        references: [exports.usuarios.id],
    }),
}));
exports.preferencias_notificacion = (0, pg_core_1.pgTable)('preferencias_notificacion', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'cascade' })
        .unique(),
    recordatorios_uso: (0, pg_core_1.boolean)('recordatorios_uso').default(true).notNull(),
    alertas_emocionales: (0, pg_core_1.boolean)('alertas_emocionales').default(true).notNull(),
    recomendaciones_actividades: (0, pg_core_1.boolean)('recomendaciones_actividades').default(true).notNull(),
    seguimientos_evaluacion: (0, pg_core_1.boolean)('seguimientos_evaluacion').default(true).notNull(),
    frecuencia_recordatorios: (0, pg_core_1.varchar)('frecuencia_recordatorios', { length: 20 }).default('diario').notNull(), // 'diario', 'semanal', 'desactivado'
    hora_preferida_recordatorio: (0, pg_core_1.varchar)('hora_preferida_recordatorio', { length: 5 }).default('09:00'), // HH:mm formato 24h
    notificaciones_email: (0, pg_core_1.boolean)('notificaciones_email').default(false).notNull(),
    notificaciones_push: (0, pg_core_1.boolean)('notificaciones_push').default(true).notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deleted_at: (0, pg_core_1.timestamp)('deleted_at'),
}, (t) => ({
    idxPreferenciasNotificacionUsuarioId: (0, pg_core_1.index)('idx_preferencias_notificacion_usuario_id').on(t.usuario_id),
}));
exports.preferenciasNotificacionRelations = (0, drizzle_orm_1.relations)(exports.preferencias_notificacion, ({ one }) => ({
    usuario: one(exports.usuarios, {
        fields: [exports.preferencias_notificacion.usuario_id],
        references: [exports.usuarios.id],
    }),
}));
exports.logs_notificaciones = (0, pg_core_1.pgTable)('logs_notificaciones', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    notificacion_id: (0, pg_core_1.integer)('notificacion_id')
        .references(() => exports.notificaciones.id, { onDelete: 'set null' }),
    usuario_id: (0, pg_core_1.integer)('usuario_id')
        .references(() => exports.usuarios.id, { onDelete: 'set null' }),
    tipo: (0, pg_core_1.varchar)('tipo', { length: 50 }).notNull(),
    estado: (0, pg_core_1.varchar)('estado', { length: 20 }).notNull(), // 'enviado', 'fallido', 'pendiente'
    mensaje_error: (0, pg_core_1.text)('mensaje_error'),
    canal: (0, pg_core_1.varchar)('canal', { length: 20 }).notNull(), // 'app', 'email', 'push'
    fecha_intento: (0, pg_core_1.timestamp)('fecha_intento').defaultNow().notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (t) => ({
    idxLogsNotificacionesNotificacionId: (0, pg_core_1.index)('idx_logs_notificaciones_notificacion_id').on(t.notificacion_id),
    idxLogsNotificacionesUsuarioId: (0, pg_core_1.index)('idx_logs_notificaciones_usuario_id').on(t.usuario_id),
    idxLogsNotificacionesFechaIntento: (0, pg_core_1.index)('idx_logs_notificaciones_fecha_intento').on(t.fecha_intento),
}));
exports.logsNotificacionesRelations = (0, drizzle_orm_1.relations)(exports.logs_notificaciones, ({ one }) => ({
    notificacion: one(exports.notificaciones, {
        fields: [exports.logs_notificaciones.notificacion_id],
        references: [exports.notificaciones.id],
    }),
    usuario: one(exports.usuarios, {
        fields: [exports.logs_notificaciones.usuario_id],
        references: [exports.usuarios.id],
    }),
}));
