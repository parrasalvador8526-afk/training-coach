#!/bin/bash
# ============================================
# NEXUS REST-PAUSE PERMANENT INTEGRATION
# Script para añadir Rest-Pause a NEXUS-APP
# ============================================

NEXUS_PATH="/Users/salvador/Documents/DATOS PARA METODOLOGIA/NEXUS-APP"
PROTOCOLOS_FILE="$NEXUS_PATH/js/data/protocolos.js"
INDEX_FILE="$NEXUS_PATH/index.html"

echo "🔧 NEXUS Rest-Pause Integration Script"
echo "======================================="

# Check if files exist
if [ ! -f "$PROTOCOLOS_FILE" ]; then
    echo "❌ Error: protocolos.js no encontrado en $PROTOCOLOS_FILE"
    exit 1
fi

# Backup original files
echo "📦 Creando backups..."
cp "$PROTOCOLOS_FILE" "${PROTOCOLOS_FILE}.backup_$(date +%Y%m%d_%H%M%S)"
cp "$INDEX_FILE" "${INDEX_FILE}.backup_$(date +%Y%m%d_%H%M%S)"
echo "✓ Backups creados"

# Check if rest-pause already exists
if grep -q "'rest-pause'" "$PROTOCOLOS_FILE"; then
    echo "⚠️ Rest-Pause ya está en protocolos.js"
else
    echo "📝 Añadiendo Rest-Pause a protocolos.js..."
    
    # Create temporary file with the rest-pause entry
    cat > /tmp/rest_pause_entry.txt << 'RESTPAUSEEOF'

    // ========== METODOLOGÍA #11: REST-PAUSE SYSTEM ==========
    'rest-pause': {
        id: 'rest-pause',
        nombre: 'Rest-Pause System',
        autor: 'Raúl Carrasco',
        tipo: 'TM+EM (Híbrido)',
        descripcion: 'Sistema de alta intensidad con series extendidas mediante micro-descansos de 10-20s, múltiples fallos musculares y máximo estrés metabólico.',
        filosofia: 'Exprimir cada serie más allá del fallo convencional mediante micro-pausas para resíntesis parcial de ATP.',
        
        principios: {
            intensidad: 'Llegar al fallo técnico en cada secuencia (2-3 por serie)',
            densidad: 'Mínimo descanso intra-serie (10-20 segundos)',
            reclutamiento: 'Máxima activación de fibras tipo II desde la primera repetición'
        },
        
        protocolo: {
            calentamiento: '2 series: 30% x 15 reps, 50% x 10 reps',
            series_trabajo: '1 serie extendida con 2-3 secuencias al fallo',
            rango_reps: [6, 12],
            reps_total: '16-22 por serie extendida',
            descansos_intra: '10-20 segundos entre secuencias',
            descansos_inter: { min: 120, max: 180 }
        },
        
        variantes: [
            { id: 'RP-RC', nombre: 'Clásico Carrasco', descripcion: '10-12 + 4-6 + 2-4 reps', carga: '70-80% 1RM' },
            { id: 'RP-EXT', nombre: 'Extendido', descripcion: '22-30 total (4 secuencias)', carga: '65-75% 1RM' },
            { id: 'RP-MYO', nombre: 'Myo-Reps Style', descripcion: '12-15 + 4-5 mini-sets', carga: '70-80% 1RM' },
            { id: 'RP-DS', nombre: '+ Drop Sets', descripcion: '10+4 + AMRAP', carga: '75%→55% 1RM' },
            { id: 'RP-NEG', nombre: 'Excéntrico', descripcion: '8+4-6 (tempo 4s)', carga: '70-75% 1RM' },
            { id: 'RP-ISO', nombre: 'Isométrico', descripcion: '8+4+2 (holds 3-5s)', carga: '65-70% 1RM' }
        ],
        
        ejemplo: [
            'Press inclinado: 1x10 (fallo) + 15s + 4 reps + 15s + 2 reps',
            'Jalón al pecho: 1x12 (fallo) + 20s + 5 reps + 20s + 3 reps',
            'Prensa piernas: 1x12 (fallo) + 15s + 6 reps + 15s + 4 reps'
        ],
        
        estructura: {
            semanas: 4,
            parametros: {
                semana1: { intensidad: 'Moderada', secuencias: 2, carga: '65-70% 1RM' },
                semana2: { intensidad: 'Alta', secuencias: 3, carga: '70-75% 1RM' },
                semana3: { intensidad: 'Máxima', secuencias: 3, carga: '75-80% 1RM' },
                semana4: { intensidad: 'Deload 50%', series: '3x10-12 normal' }
            }
        },
        
        nivelMinimo: 'intermedio',
        requireSpotter: false,
        
        compatibilidad: ['heavy-duty', 'blood-and-guts', 'dc-training'],
        incompatibilidad: ['sst', 'gvt'],
        
        timerConfig: {
            microRest: { rest: 15, alertGo: true, sound: 'beep' },
            postSet: { rest: 150, alertAt: 30 },
            sequences: { count: 3, alertOnComplete: true }
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
            ideales: ['Máquinas', 'Poleas', 'Press máquina', 'Prensa piernas'],
            evitar: ['Peso muerto', 'Sentadilla libre pesada', 'Olímpicos']
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
RESTPAUSEEOF

    # Find and replace the closing of METODOLOGIAS_BASE
    # We need to insert before the final };
    
    # Use Python for more reliable text manipulation
    python3 << 'PYTHONEOF'
import re

# Read the file
with open('/Users/salvador/Documents/DATOS PARA METODOLOGIA/NEXUS-APP/js/data/protocolos.js', 'r') as f:
    content = f.read()

# Read the rest-pause entry
with open('/tmp/rest_pause_entry.txt', 'r') as f:
    rest_pause = f.read()

# Find the last entry (dc-training) and its closing brace
# Pattern: look for the end of dc-training's advertencias and its closing brace
pattern = r"(\s*advertencias:\s*\[\s*'SOLO para avanzados con 3\+ años de experiencia'[\s\S]*?'Si no progresas 2 semanas seguidas, iniciar Cruise'\s*\]\s*\})"

if re.search(pattern, content):
    # Add comma after dc-training and insert rest-pause
    content = re.sub(pattern, r'\1,' + rest_pause, content)
    
    # Write the updated content
    with open('/Users/salvador/Documents/DATOS PARA METODOLOGIA/NEXUS-APP/js/data/protocolos.js', 'w') as f:
        f.write(content)
    print("✓ Rest-Pause añadido exitosamente")
else:
    # Alternative approach: find the closing }; of METODOLOGIAS_BASE
    # Look for the pattern where dc-training ends
    alt_pattern = r"('dc-training':\s*\{[\s\S]*?advertencias:\s*\[[\s\S]*?\]\s*\})\s*(\};)"
    
    if re.search(alt_pattern, content):
        content = re.sub(alt_pattern, r'\1,' + rest_pause + r'\n\2', content)
        with open('/Users/salvador/Documents/DATOS PARA METODOLOGIA/NEXUS-APP/js/data/protocolos.js', 'w') as f:
            f.write(content)
        print("✓ Rest-Pause añadido (método alternativo)")
    else:
        print("⚠️ No se pudo encontrar el punto de inserción")
        print("Por favor, añade el contenido de /tmp/rest_pause_entry.txt manualmente")
PYTHONEOF
fi

# Update index.html
echo "📝 Actualizando index.html..."

# Replace 10 with 11 in methodology references
sed -i '' 's/10 METODOLOGÍAS/11 METODOLOGÍAS/g' "$INDEX_FILE"
sed -i '' 's/10 Metodologías/11 Metodologías/g' "$INDEX_FILE"
sed -i '' 's/10 metodologías/11 metodologías/g' "$INDEX_FILE"

# Add Rest-Pause to the list
sed -i '' 's/y DC Training\./y DC Training y Rest-Pause System./g' "$INDEX_FILE"
sed -i '' 's/y DC Training</, DC Training y Rest-Pause System</g' "$INDEX_FILE"

echo "✓ index.html actualizado"

# Verify 
echo ""
echo "======================================="
echo "🔍 VERIFICACIÓN"
echo "======================================="

if grep -q "'rest-pause'" "$PROTOCOLOS_FILE"; then
    echo "✅ Rest-Pause está en protocolos.js"
else
    echo "❌ Rest-Pause NO está en protocolos.js"
fi

if grep -q "11 METODOLOGÍAS\|11 metodologías" "$INDEX_FILE"; then
    echo "✅ index.html actualizado a 11 metodologías"
else
    echo "⚠️ index.html puede necesitar actualización manual"
fi

echo ""
echo "======================================="
echo "✅ INTEGRACIÓN COMPLETADA"
echo "======================================="
echo ""
echo "Las 11 metodologías de NEXUS son:"
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
echo "Abre NEXUS-APP en el navegador para verificar."
