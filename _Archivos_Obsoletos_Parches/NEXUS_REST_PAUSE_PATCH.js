// ============================================
// REST-PAUSE SYSTEM - PATCH FOR NEXUS-APP
// File: /NEXUS-APP/js/data/protocolos.js
// ============================================
// 
// INSTRUCCIONES:
// 1. Abrir /NEXUS-APP/js/data/protocolos.js
// 2. Buscar el final del objeto 'dc-training' (después de "advertencias: [...]")
// 3. Añadir una coma después del cierre de 'dc-training': }
// 4. Pegar el siguiente código ANTES de };  de METODOLOGIAS_BASE
//
// ============================================

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
}

// ============================================
// TAMBIÉN ACTUALIZAR index.html:
// Buscar: "10 METODOLOGÍAS" y cambiar a "11 METODOLOGÍAS"
// Buscar: "10 metodologías científicas" y cambiar a "11 metodologías científicas"
// Añadir "Rest-Pause" a la lista de metodologías en la descripción
// ============================================
