#!/bin/bash
# =================================================================
# NEXUS REST-PAUSE INTEGRATION SCRIPT
# Script para añadir Rest-Pause como metodología #11 a NEXUS-APP
# =================================================================

NEXUS_PATH="/Users/salvador/Documents/DATOS PARA METODOLOGIA/NEXUS-APP"
PROTOCOLOS_FILE="$NEXUS_PATH/js/data/protocolos.js"
INDEX_FILE="$NEXUS_PATH/index.html"

echo "🔧 NEXUS Rest-Pause Integration Script"
echo "======================================="

# Backup original files
echo "📦 Creando backups..."
cp "$PROTOCOLOS_FILE" "${PROTOCOLOS_FILE}.backup"
cp "$INDEX_FILE" "${INDEX_FILE}.backup"
echo "✓ Backups creados"

# Add Rest-Pause methodology to protocolos.js
echo "📝 Añadiendo Rest-Pause a protocolos.js..."

# Create the Rest-Pause code block
REST_PAUSE_CODE=$(cat << 'ENDOFCODE'

    // ========== METODOLOGÍA #11: REST-PAUSE SYSTEM ==========
    'rest-pause': {
        id: 'rest-pause',
        nombre: 'Rest-Pause System',
        autor: 'Raúl Carrasco',
        tipo: 'TM+EM (Híbrido)',
        descripcion: 'Sistema de alta intensidad con series extendidas mediante micro-descansos de 10-20s, múltiples fallos musculares y máximo estrés metabólico.',
        filosofia: 'Exprimir cada serie más allá del fallo convencional mediante micro-pausas para resíntesis parcial de ATP y reclutamiento máximo de unidades motoras.',
        
        principios: {
            intensidad: 'Llegar al fallo técnico en cada secuencia (2-3 por serie)',
            densidad: 'Mínimo descanso intra-serie (10-20 segundos)',
            reclutamiento: 'Máxima activación de fibras tipo II desde la primera repetición',
            volumen: 'Acumular 16-22+ reps efectivas en una sola serie extendida'
        },
        
        protocolo: {
            calentamiento: '2 series: 30% x 15 reps, 50% x 10 reps',
            series_trabajo: '1 serie extendida con 2-3 secuencias al fallo',
            rango_reps: [6, 12],
            reps_primeras: '10-12 reps iniciales',
            reps_secundarias: '4-6 reps (segunda secuencia)',
            reps_terciarias: '2-4 reps (tercera secuencia)',
            reps_total: '16-22 por serie extendida',
            descansos_intra: '10-20 segundos entre secuencias',
            descansos_inter: { min: 120, max: 180 }
        },
        
        variantes: [
            { id: 'RP-RC', nombre: 'Clásico Carrasco', descripcion: '10-12 + 4-6 + 2-4 reps al fallo', carga: '70-80% 1RM' },
            { id: 'RP-EXT', nombre: 'Extendido', descripcion: '4 secuencias, 22-30 reps total', carga: '65-75% 1RM' },
            { id: 'RP-MYO', nombre: 'Myo-Reps Style', descripcion: 'Set activación + 4-5 mini-sets de 3-5 reps', carga: '70-80% 1RM' },
            { id: 'RP-DS', nombre: '+ Drop Sets', descripcion: 'Rest-Pause + Drop set final', carga: '75%→55% 1RM' },
            { id: 'RP-NEG', nombre: 'Excéntrico', descripcion: 'Tempo 4s fase excéntrica', carga: '70-75% 1RM' },
            { id: 'RP-ISO', nombre: 'Isométrico', descripcion: 'Holds 3-5s en contracción máxima', carga: '65-70% 1RM' }
        ],
        
        ejemplo: [
            'Press inclinado máquina: 1x10 (fallo) + 15s + 4 reps + 15s + 2 reps = 16 reps total',
            'Jalón al pecho: 1x12 (fallo) + 20s + 5 reps + 20s + 3 reps = 20 reps total',
            'Prensa de piernas: 1x12 (fallo) + 15s + 6 reps + 15s + 4 reps = 22 reps total'
        ],
        
        estructura: {
            semanas: 4,
            parametros: {
                semana1: { intensidad: 'Moderada', secuencias: 2, carga: '65-70% 1RM' },
                semana2: { intensidad: 'Alta', secuencias: 3, carga: '70-75% 1RM' },
                semana3: { intensidad: 'Máxima', secuencias: 3, carga: '75-80% 1RM' },
                semana4: { intensidad: 'Deload', series: '3x10-12 normal sin RP', carga: '50-60% 1RM' }
            }
        },
        
        nivelMinimo: 'intermedio',
        requireSpotter: false,
        
        compatibilidad: ['heavy-duty', 'blood-and-guts', 'dc-training'],
        incompatibilidad: ['sst', 'gvt'],
        
        timerConfig: {
            microRest: { rest: 15, alertGo: true, sound: 'beep' },
            postSet: { rest: 150, alertAt: 30 },
            sequences: { count: 3, alertOnComplete: true, message: '¡SECUENCIA COMPLETADA!' }
        },
        
        warmup: {
            set1: '30% x 15 reps',
            set2: '50% x 10 reps',
            movilidad: '5 min articular específico'
        },
        
        deload: {
            frequency: 'Cada 3-4 semanas',
            duration: '1 semana',
            intensity: '50%, sin RP',
            training: '3x10-12 normal'
        },
        
        ejerciciosRecomendados: {
            ideales: ['Máquinas de aislamiento', 'Poleas y cables', 'Press máquina', 'Prensa piernas', 'Curl femoral'],
            evitar: ['Peso muerto convencional', 'Sentadilla libre pesada', 'Olímpicos', 'Ejercicios donde fatiga = riesgo']
        },
        
        advertencias: [
            'Máximo 2-3 protocolos Rest-Pause por sesión',
            'Preferir máquinas sobre peso libre para seguridad',
            'Cronometrar TODOS los descansos (10-20s exactos)',
            'No usar en ejercicios técnicos complejos',
            'Requiere 48-72h recuperación por grupo muscular',
            'Hidratación constante durante la sesión'
        ]
    },
ENDOFCODE
)

# Find the line with the last entry (dc-training closing brace before METODOLOGIAS_BASE closing)
# Insert Rest-Pause before the closing };
sed -i '' "/^};$/i\\
$REST_PAUSE_CODE
" "$PROTOCOLOS_FILE"

echo "✓ Rest-Pause añadido a protocolos.js"

# Update index.html - change 10 to 11
echo "📝 Actualizando index.html..."
sed -i '' 's/10 METODOLOGÍAS/11 METODOLOGÍAS/g' "$INDEX_FILE"
sed -i '' 's/10 metodologías/11 metodologías/g' "$INDEX_FILE"
sed -i '' 's/DC Training\./DC Training y Rest-Pause./g' "$INDEX_FILE"

echo "✓ index.html actualizado"

echo ""
echo "======================================="
echo "✅ INTEGRACIÓN COMPLETADA"
echo "======================================="
echo ""
echo "Las 11 metodologías de NEXUS son ahora:"
echo "  1. 5/3/1 (Wendler)"
echo "  2. Y3T (Neil Hill)"  
echo "  3. Heavy Duty (Mentzer)"
echo "  4. Blood & Guts (Yates)"
echo "  5. MTUT"
echo "  6. SST"
echo "  7. FST-7 (Rambod)"
echo "  8. GVT"
echo "  9. DUP"
echo " 10. DC Training (Trudel)"
echo " 11. Rest-Pause System (Carrasco) ⭐ NUEVO"
echo ""
echo "Abre NEXUS-APP para verificar los cambios."
