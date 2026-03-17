CREATE TABLE IF NOT EXISTS "logs_notificaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"notificacion_id" integer,
	"usuario_id" integer,
	"tipo" varchar(50) NOT NULL,
	"estado" varchar(20) NOT NULL,
	"mensaje_error" text,
	"canal" varchar(20) NOT NULL,
	"fecha_intento" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notificaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer,
	"tipo" varchar(50) NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"mensaje" text NOT NULL,
	"prioridad" varchar(20) DEFAULT 'normal' NOT NULL,
	"datos_adicionales" text,
	"leida" boolean DEFAULT false NOT NULL,
	"fecha_leida" timestamp,
	"enviada" boolean DEFAULT false NOT NULL,
	"fecha_envio" timestamp,
	"programada_para" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "preferencias_notificacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer,
	"recordatorios_uso" boolean DEFAULT true NOT NULL,
	"alertas_emocionales" boolean DEFAULT true NOT NULL,
	"recomendaciones_actividades" boolean DEFAULT true NOT NULL,
	"seguimientos_evaluacion" boolean DEFAULT true NOT NULL,
	"frecuencia_recordatorios" varchar(20) DEFAULT 'diario' NOT NULL,
	"hora_preferida_recordatorio" varchar(5) DEFAULT '09:00',
	"notificaciones_email" boolean DEFAULT false NOT NULL,
	"notificaciones_push" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "preferencias_notificacion_usuario_id_unique" UNIQUE("usuario_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_logs_notificaciones_notificacion_id" ON "logs_notificaciones" ("notificacion_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_logs_notificaciones_usuario_id" ON "logs_notificaciones" ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_logs_notificaciones_fecha_intento" ON "logs_notificaciones" ("fecha_intento");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_usuario_id" ON "notificaciones" ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_tipo" ON "notificaciones" ("tipo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_enviada" ON "notificaciones" ("enviada");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_programada_para" ON "notificaciones" ("programada_para");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_preferencias_notificacion_usuario_id" ON "preferencias_notificacion" ("usuario_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logs_notificaciones" ADD CONSTRAINT "logs_notificaciones_notificacion_id_notificaciones_id_fk" FOREIGN KEY ("notificacion_id") REFERENCES "notificaciones"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logs_notificaciones" ADD CONSTRAINT "logs_notificaciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "preferencias_notificacion" ADD CONSTRAINT "preferencias_notificacion_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
