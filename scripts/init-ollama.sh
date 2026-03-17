#!/bin/bash

echo "🚀 Inicializando Ollama con modelo liviano..."

# Esperar a que Ollama esté disponible
echo "⏳ Esperando a que Ollama esté disponible..."
while ! curl -f http://ollama:11434/api/tags >/dev/null 2>&1; do
    echo "Esperando Ollama..."
    sleep 5
done

echo "✅ Ollama está disponible"

# Verificar si el modelo ya está descargado
MODEL_NAME="qwen2.5:0.5b"
echo "🔍 Verificando si el modelo $MODEL_NAME ya está descargado..."

if curl -s http://ollama:11434/api/tags | grep -q "$MODEL_NAME"; then
    echo "✅ El modelo $MODEL_NAME ya está disponible"
else
    echo "📥 Descargando modelo $MODEL_NAME (más liviano disponible)..."
    echo "⚠️  Este proceso puede tardar varios minutos la primera vez..."
    
    # Descargar el modelo
    curl -X POST http://ollama:11434/api/pull \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$MODEL_NAME\"}" \
        --no-buffer
    
    echo ""
    echo "✅ Modelo $MODEL_NAME descargado exitosamente"
fi

echo "🎉 Inicialización de Ollama completada"
echo "💡 El modelo estará disponible en: http://localhost:11434"
echo "📋 Puedes probar el chat IA en: http://localhost:3000/api/chats/ia"
