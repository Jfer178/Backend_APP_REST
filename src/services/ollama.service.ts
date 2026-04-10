import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b'; // Modelo más liviano disponible

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface MentalHealthResponse {
  estado: 'verde' | 'amarillo' | 'rojo';
  puntaje: number;
  observaciones: string;
  recomendaciones: string[];
}

interface ChatResponse {
  respuesta: string;
  timestamp: string;
}

const MENSAJE_CRITICO_FALLBACK =
  'Gracias por contarmelo. Lo que estas viviendo es importante y no estas solo. Te recomiendo contactar ahora mismo al equipo de Salvavidas o a un profesional de confianza para acompanarte de inmediato.';

const RESPUESTAS_DESECHABLES = [
  'no puedo asistir',
  'no puedo ayudarte con eso',
  'como noa, no puedo',
  'no puedo apoyar en eso',
  'no puedo responder a eso',
  'fuera de mi alcance',
  'no tengo permitido',
  'hay algo mas en lo que pueda apoyarte hoy',
];

const detectarRiesgoEnTexto = (texto: string): boolean => {
  const normalizado = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const claves = [
    'suicid',
    'matarme',
    'me quiero morir',
    'no quiero vivir',
    'autoles',
    'hacerme dano',
    'lastimarme',
    'cortarme',
  ];

  return claves.some((clave) => normalizado.includes(clave));
};

const normalizar = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const esRespuestaDesechable = (respuesta: string): boolean => {
  const r = normalizar(respuesta);
  return RESPUESTAS_DESECHABLES.some((patron) => r.includes(patron));
};

const construirRespuestaFallback = (mensaje: string): string => {
  if (detectarRiesgoEnTexto(mensaje)) {
    return MENSAJE_CRITICO_FALLBACK;
  }

  const normalizado = normalizar(mensaje);

  if (
    normalizado.includes('que me recomiendas') ||
    normalizado.includes('que recomiendas') ||
    normalizado.includes('me siento triste') ||
    normalizado.includes('estoy triste')
  ) {
    return 'Gracias por contarmelo. Si te parece, hagamos algo simple ahora: 1) respira 4-4-6 por 2 minutos, 2) toma agua y cambia de lugar 5 minutos, 3) escribe en una nota que necesitas hoy. Si quieres, me quedo contigo y lo hacemos paso a paso.';
  }

  if (
    normalizado.includes('mierda') ||
    normalizado.includes('estupido') ||
    normalizado.includes('idiota') ||
    normalizado.includes('pendej')
  ) {
    return 'Siento si algo de lo que dije te hizo sentir peor. Quiero ayudarte de verdad. Si te parece, empezamos de nuevo: que fue lo que mas te dolio hoy?';
  }

  const plantillas = [
    'Te leo. Gracias por abrirte conmigo. Si quieres, podemos ir paso a paso con lo que te esta pasando hoy.',
    'Estoy aqui contigo. Cuentame un poco mas: que fue lo mas pesado de tu dia?',
    'Gracias por confiar en mi. Podemos hablar de eso y buscar algo pequeno que te ayude a sentirte un poco mejor ahora.',
  ];

  const indice = Math.abs(mensaje.length) % plantillas.length;
  return plantillas[indice];
};

/**
 * Verifica si Ollama está disponible y el modelo está cargado
 */
export const checkOllamaHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

    const response = await fetch(`${OLLAMA_API_URL}/api/tags`, {
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const models = data.models || [];
    return models.some((model: any) => model.name.includes(OLLAMA_MODEL.split(':')[0]));
  } catch (error) {
    console.error('Error checking Ollama health:', error);
    return false;
  }
};

/**
 * Descarga el modelo si no está disponible
 */
export const downloadModel = async (): Promise<boolean> => {
  try {
    console.log(`Descargando modelo ${OLLAMA_MODEL}...`);
    const response = await fetch(`${OLLAMA_API_URL}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: OLLAMA_MODEL }),
    });

    if (!response.ok) {
      throw new Error(`Error descargando modelo: ${response.statusText}`);
    }

    // Leer la respuesta de streaming
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No se pudo leer la respuesta');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.status) {
            console.log(`Estado: ${data.status}`);
          }
        } catch (e) {
          // Ignorar líneas que no son JSON válido
        }
      }
    }

    console.log(`Modelo ${OLLAMA_MODEL} descargado exitosamente`);
    return true;
  } catch (error) {
    console.error('Error descargando modelo:', error);
    return false;
  }
};

/**
 * Consulta a Ollama con timeout de 30 segundos
 */
export const queryOllama = async (prompt: string, systemPrompt?: string): Promise<string> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          top_k: 40,
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Error en Ollama API: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || 'No se pudo generar respuesta';
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Timeout: Ollama tardó más de 30 segundos en responder');
      throw new Error('Ollama no responde. Por favor, intenta nuevamente.');
    }
    console.error('Error consultando Ollama:', error);
    throw error;
  }
};

/**
 * Analiza respuestas de salud mental usando Ollama
 */
export const analizarRespuestasOllama = async (
  preguntas: { id: number; texto: string; peso: number }[],
  respuestas: { pregunta_id: number; respuesta: number }[]
): Promise<MentalHealthResponse> => {
  try {
    // Formatear datos para el modelo
    const preguntasRespuestas = respuestas.map(resp => {
      const pregunta = preguntas.find(p => p.id === resp.pregunta_id);
      return {
        pregunta: pregunta?.texto || 'Pregunta no encontrada',
        peso: pregunta?.peso || 1,
        respuesta: resp.respuesta
      };
    });
    
    // Algoritmo avanzado de semáforo para evitar filtraciones
    let rawScore = 0;
    let respuestasAltas = 0; // Contador de respuestas 4-5
    let respuestasBajas = 0; // Contador de respuestas 1-2
    const totalPreguntas = preguntasRespuestas.length;
    
    preguntasRespuestas.forEach(item => {
      const puntajePonderado = item.respuesta * item.peso;
      rawScore += puntajePonderado;
      
      if (item.respuesta >= 4) respuestasAltas++;
      if (item.respuesta <= 2) respuestasBajas++;
    });
    
    const porcentajeAltas = (respuestasAltas / totalPreguntas) * 100;
    const puntajePromedio = rawScore / totalPreguntas;
    
    // Criterios más estrictos para evitar filtraciones
    let fallbackState: 'verde' | 'amarillo' | 'rojo' = 'verde';
    
    if (rawScore > 50 && porcentajeAltas > 60) {
      // Solo ROJO si puntaje alto Y más del 60% de respuestas son altas (4-5)
      fallbackState = 'rojo';
    } else if (rawScore > 35 || porcentajeAltas > 40) {
      // AMARILLO si puntaje moderado O más del 40% de respuestas altas
      fallbackState = 'amarillo';
    } else if (rawScore > 20 || porcentajeAltas > 25) {
      // AMARILLO suave si hay indicadores moderados
      fallbackState = 'amarillo';
    } else {
      // VERDE por defecto
      fallbackState = 'verde';
    }

    const systemPrompt = `Eres un psicólogo clínico experto especializado en evaluaciones de salud mental y bienestar emocional. Tu función es analizar respuestas de cuestionarios psicológicos y proporcionar evaluaciones precisas y profesionales. Debes responder ÚNICAMENTE en formato JSON válido, sin comentarios adicionales.`;

    const prompt = `
    Analiza las siguientes respuestas de una evaluación de salud mental (escala 1-5, donde 5 indica mayor gravedad):
    
    ${preguntasRespuestas.map(pr => 
      `- Pregunta: "${pr.pregunta}" (Peso: ${pr.peso})
       - Respuesta: ${pr.respuesta}/5`
    ).join('\n\n')}
    
    CRITERIOS DE EVALUACIÓN:
    - VERDE: Puntaje 0-30 - Estado emocional estable, bienestar general, sin signos de alerta significativos
    - AMARILLO: Puntaje 31-60 - Alerta moderada, algunos síntomas de malestar emocional, requiere atención y seguimiento
    - ROJO: Puntaje 61-100 - Alerta grave, múltiples síntomas de malestar emocional, requiere intervención profesional inmediata
    
    IMPORTANTE: Sé conservador en la evaluación. Solo asigna ROJO si hay evidencia clara de múltiples síntomas graves. 
    Prefiere AMARILLO cuando haya dudas razonables.
    
    Determina:
    1. Un estado de semáforo basado en los criterios anteriores
    2. Un puntaje numérico (0-100) que represente la gravedad general
    3. Una observación clínica profesional y empática sobre el estado mental
    4. Tres recomendaciones prácticas y específicas para el bienestar emocional
    
    Responde SOLO en este formato JSON:
    {
      "estado": "verde/amarillo/rojo",
      "puntaje": 0-100,
      "observaciones": "análisis clínico profesional y empático",
      "recomendaciones": ["recomendación específica 1", "recomendación específica 2", "recomendación específica 3"]
    }`;

    const response = await queryOllama(prompt, systemPrompt);
    
    try {
      // Intentar parsear la respuesta JSON
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      const parsedResponse: MentalHealthResponse = JSON.parse(cleanResponse);
      
      // Validar que tenga los campos requeridos
      if (!parsedResponse.estado || !parsedResponse.puntaje || !parsedResponse.observaciones || !parsedResponse.recomendaciones) {
        throw new Error('Respuesta incompleta del modelo');
      }
      
      return parsedResponse;
    } catch (parseError) {
      console.error('Error parseando respuesta de Ollama:', parseError);
      
      // Fallback con datos calculados
      return {
        estado: fallbackState,
        puntaje: Math.min(rawScore * 2, 100),
        observaciones: `Evaluación basada en ${respuestas.length} respuestas. Puntaje calculado: ${rawScore}`,
        recomendaciones: [
          'Mantén rutinas saludables de sueño y ejercicio',
          'Busca apoyo en familiares y amigos cercanos',
          'Considera hablar con un profesional si persisten las molestias'
        ]
      };
    }
  } catch (error) {
    console.error('Error en análisis con Ollama:', error);
    
    // Fallback completo con algoritmo avanzado
    const rawScore = respuestas.reduce((sum, resp) => {
      const pregunta = preguntas.find(p => p.id === resp.pregunta_id);
      return sum + (resp.respuesta * (pregunta?.peso || 1));
    }, 0);

    // Calcular estadísticas para fallback
    let respuestasAltas = 0;
    const totalPreguntas = respuestas.length;
    
    respuestas.forEach(resp => {
      if (resp.respuesta >= 4) respuestasAltas++;
    });
    
    const porcentajeAltas = (respuestasAltas / totalPreguntas) * 100;
    
    // Aplicar criterios estrictos
    let estado: 'verde' | 'amarillo' | 'rojo' = 'verde';
    
    if (rawScore > 50 && porcentajeAltas > 60) {
      estado = 'rojo';
    } else if (rawScore > 35 || porcentajeAltas > 40) {
      estado = 'amarillo';
    } else if (rawScore > 20 || porcentajeAltas > 25) {
      estado = 'amarillo';
    } else {
      estado = 'verde';
    }
    
    return {
      estado,
      puntaje: Math.min(rawScore * 2, 100),
      observaciones: `Evaluación realizada con sistema de respaldo avanzado. Puntaje: ${rawScore}, Respuestas altas: ${porcentajeAltas.toFixed(1)}%`,
      recomendaciones: [
        'Mantén rutinas saludables de sueño y ejercicio',
        'Busca apoyo en familiares y amigos cercanos',
        'Considera hablar con un profesional si persisten las molestias'
      ]
    };
  }
};

/**
 * Chat general con IA usando Ollama
 */
export const chatWithOllama = async (mensaje: string, contexto?: string): Promise<ChatResponse> => {
  try {
    const systemPrompt = `Eres NOA, un amigo virtual de confianza que brinda acompanamiento emocional a estudiantes.

Reglas de estilo obligatorias:
- Responde en espanol con tono humano, calido y cercano.
- Comienza validando la emocion del usuario en una frase breve.
- Responde de forma conectada a lo que la persona dijo (no cambies de tema).
- Si el usuario pide ayuda concreta, entrega 2 o 3 sugerencias practicas y realistas.
- Si el usuario esta molesto o usa insultos, mantente sereno, repara el vinculo y continua apoyando.
- Evita respuestas roboticas o repetitivas.
- Limita la respuesta a un maximo de 90 palabras.

IMPORTANTE:
- Mantente empatico, claro y respetuoso.
- Evita diagnosticos clinicos o indicaciones medicas.
- Si detectas riesgo de autolesion o crisis grave, prioriza contencion y sugiere apoyo profesional inmediato.
- Da respuestas utiles, concretas y humanas.`;
    
    let prompt = mensaje;
    if (contexto) {
      prompt = `Contexto: ${contexto}\n\nPregunta: ${mensaje}`;
    }

    const respuestaCruda = await queryOllama(prompt, systemPrompt);
    const respuesta = respuestaCruda.trim();

    const usarFallback =
      !respuesta ||
      respuesta.length < 18 ||
      esRespuestaDesechable(respuesta);
    
    return {
      respuesta: usarFallback ? construirRespuestaFallback(mensaje) : respuesta,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error en chat con Ollama:', error);
    
    return {
      respuesta: construirRespuestaFallback(mensaje),
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Inicializa Ollama - descarga el modelo si no está disponible
 */
export const initializeOllama = async (): Promise<boolean> => {
  try {
    console.log('Inicializando Ollama...');
    
    // Verificar si Ollama está disponible
    const isHealthy = await checkOllamaHealth();
    
    if (!isHealthy) {
      console.log('Modelo no encontrado, descargando...');
      const downloaded = await downloadModel();
      
      if (!downloaded) {
        console.error('No se pudo descargar el modelo');
        return false;
      }
    }
    
    console.log('Ollama inicializado correctamente');
    return true;
  } catch (error) {
    console.error('Error inicializando Ollama:', error);
    return false;
  }
};
