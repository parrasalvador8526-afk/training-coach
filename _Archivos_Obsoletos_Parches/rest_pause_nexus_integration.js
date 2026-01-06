/**
 * REST-PAUSE SYSTEM - NEXUS APP INTEGRATION
 * Metodología de Raúl Carrasco
 * 
 * INSTRUCCIONES DE INTEGRACIÓN:
 * 1. Copiar el objeto REST_PAUSE_METODOLOGIA al archivo protocolos.js de NEXUS-APP
 * 2. Añadir la clave "RestPause" dentro del objeto METODOLOGIAS_COMPLETAS
 * 3. Actualizar METODOLOGIAS_DISPONIBLES si es necesario
 */

const REST_PAUSE_METODOLOGIA = {
    id: "RP",
    nombre: "Rest-Pause System",
    autor: "Raúl Carrasco",
    descripcion: "Sistema de entrenamiento de alta intensidad con series extendidas mediante micro-descansos de 10-20s, permitiendo múltiples fallos musculares y máximo estrés metabólico.",
    nivel: ["Intermedio", "Avanzado"],
    filosofia: "Micro-descansos para múltiples fallos en una serie extendida",
    duracionSesion: "45-60 min",
    frecuencia: "4-5 días/semana",
    volumen: "Moderado",
    intensidad: "Alta",
    requiereSpotter: false,
    
    protocolos: [
        {
            id: "RP-RC",
            nombre: "Rest-Pause Clásico Carrasco",
            descripcion: "10-12 reps al fallo + 10-20s + 4-6 reps + 10-20s + 2-4 reps. El corazón del sistema.",
            reps: "16-22 total",
            series: "1 serie extendida",
            descanso: "10-20s micro",
            rpe: "10",
            tut: "90-120s",
            carga: "70-80% 1RM",
            secuencias: "2-3",
            instrucciones: [
                "Warm-up: 15 reps @ 30%, luego 10 reps @ 50%",
                "Secuencia 1: 10-12 reps @ 70-80% → FALLO",
                "Descanso: 10-20 segundos (respirar profundo)",
                "Secuencia 2: 4-6 reps → FALLO",
                "Descanso: 10-20 segundos",
                "Secuencia 3 (opcional): 2-4 reps → FALLO"
            ]
        },
        {
            id: "RP-EXT",
            nombre: "Rest-Pause Extendido",
            descripcion: "4 secuencias para volumen extremo. Para atletas avanzados buscando máximo estímulo.",
            reps: "22-30 total",
            series: "1 serie extendida",
            descanso: "15-20s micro",
            rpe: "10+",
            tut: "120-150s",
            carga: "65-75% 1RM",
            secuencias: "4",
            instrucciones: [
                "Usar carga ligeramente menor que RP-RC",
                "Secuencia 1: 12-15 reps → FALLO",
                "Descanso: 15-20 segundos",
                "Secuencia 2: 5-7 reps → FALLO",
                "Descanso: 15-20 segundos",
                "Secuencia 3: 3-5 reps → FALLO",
                "Descanso: 15-20 segundos",
                "Secuencia 4: 2-3 reps → FALLO ABSOLUTO"
            ]
        },
        {
            id: "RP-MYO",
            nombre: "Myo-Reps Style",
            descripcion: "Set de activación + mini-sets de 3-5 reps. Máxima eficiencia temporal.",
            reps: "12-15 + 4-5 mini",
            series: "1 serie extendida",
            descanso: "3-5 respiraciones",
            rpe: "9-10",
            tut: "60-90s",
            carga: "70-80% 1RM",
            instrucciones: [
                "Set de activación: 12-15 reps @ RPE 8-9",
                "Mini-set 1: 3-5 reps (3-5 respiraciones descanso)",
                "Mini-set 2: 3-5 reps",
                "Mini-set 3: 3-4 reps",
                "Mini-set 4: 2-3 reps",
                "Continuar hasta que no puedas hacer 3 reps"
            ]
        },
        {
            id: "RP-DS",
            nombre: "Rest-Pause + Drop Sets",
            descripcion: "Rest-Pause seguido de drop set. Finisher devastador para bomba máxima.",
            reps: "10+4 + AMRAP",
            series: "1 serie extendida",
            descanso: "10s + 0s (drop)",
            rpe: "10+",
            tut: "120-180s",
            carga: "75%→55% 1RM",
            dropPercent: "30%",
            instrucciones: [
                "Secuencia 1: 10-12 reps @ 75% → FALLO",
                "Descanso: 10 segundos",
                "Secuencia 2: 4-6 reps → FALLO",
                "SIN DESCANSO - Reducir peso 30%",
                "Drop set: AMRAP (todas las que puedas)",
                "OPCIONAL: Segundo drop -30% adicional"
            ]
        },
        {
            id: "RP-NEG",
            nombre: "Rest-Pause Excéntrico",
            descripcion: "Énfasis en fase excéntrica de 4 segundos. Máximo daño muscular.",
            reps: "8+4-6",
            series: "1 serie extendida",
            descanso: "15s micro",
            rpe: "10",
            tut: "100-130s",
            carga: "70-75% 1RM",
            tempo: "2-0-4",
            instrucciones: [
                "Cada rep: 2s concéntrico, 4s excéntrico controlado",
                "Secuencia 1: 8 reps con tempo → FALLO",
                "Descanso: 15 segundos",
                "Secuencia 2: 4-6 reps con tempo → FALLO",
                "NOTA: Recuperación 72-96 horas por grupo"
            ]
        },
        {
            id: "RP-ISO",
            nombre: "Rest-Pause Isométrico",
            descripcion: "Con holds isométricos en contracción máxima. Intensifica la conexión mente-músculo.",
            reps: "8+4+2",
            series: "1 serie extendida",
            descanso: "10-15s micro",
            rpe: "10",
            tut: "80-100s",
            carga: "65-70% 1RM",
            holdDuration: "3-5s",
            instrucciones: [
                "Cada rep: Hold isométrico de 3-5s en contracción máxima",
                "Secuencia 1: 8 reps con hold → FALLO",
                "Descanso: 10-15 segundos",
                "Secuencia 2: 4 reps con hold → FALLO",
                "Descanso: 10-15 segundos",
                "Secuencia 3: 2 reps con hold → FALLO"
            ]
        }
    ],

    estructura: {
        semanas: 4,
        parametros: {
            semana1: {
                nombre: "Adaptación",
                protocolo: "RP-RC",
                intensidad: "Moderada",
                secuencias: 2,
                carga: "65-70% 1RM"
            },
            semana2: {
                nombre: "Progresión",
                protocolo: "RP-RC",
                intensidad: "Alta",
                secuencias: 3,
                carga: "70-75% 1RM"
            },
            semana3: {
                nombre: "Intensificación",
                protocolo: "RP-RC / RP-EXT",
                intensidad: "Máxima",
                secuencias: 3,
                carga: "75-80% 1RM"
            },
            semana4: {
                nombre: "Deload",
                protocolo: "Sin Rest-Pause",
                intensidad: "50%",
                series: "3x10-12 normal",
                carga: "50-60% 1RM"
            }
        }
    },

    timerConfig: {
        microRest: {
            rest: 15,
            alertGo: true,
            sound: "beep"
        },
        postSet: {
            rest: 150,
            alertAt: 30
        },
        sequences: {
            count: 3,
            alertOnComplete: true,
            message: "¡SECUENCIA COMPLETADA!"
        },
        myo: {
            rest: "respiraciones",
            count: 5,
            alertGo: true
        }
    },

    warmup: {
        set1: "30% x 15 reps",
        set2: "50% x 10 reps",
        movilidad: "5 min articular específico"
    },

    deload: {
        frequency: "Cada 3-4 semanas",
        duration: "1 semana",
        intensity: "50%, sin RP",
        training: "3x10-12 normal",
        signos: [
            "Rendimiento estancado 2+ semanas",
            "Fatiga acumulada persistente",
            "Dolor articular aumentado",
            "Falta de motivación"
        ]
    },

    compatibleWith: [
        "Heavy Duty",
        "Blood & Guts",
        "DC Training"
    ],

    incompatibleWith: [
        "SST",
        "GVT"
    ],

    ejerciciosRecomendados: {
        ideales: [
            "Máquinas de aislamiento",
            "Poleas y cables",
            "Press de pecho en máquina",
            "Jalón al pecho",
            "Prensa de piernas",
            "Curl femoral",
            "Extensión de cuádriceps"
        ],
        evitar: [
            "Peso muerto convencional",
            "Sentadilla libre pesada",
            "Ejercicios olímpicos",
            "Cualquier ejercicio donde la fatiga comprometa la técnica"
        ]
    },

    reglasClave: [
        "Máximo 2-3 protocolos Rest-Pause por sesión",
        "Cronometrar TODOS los descansos con timer",
        "No necesitas spotter (ventaja vs Blood & Guts)",
        "Preferir máquinas sobre peso libre",
        "Descanso 2-3 min obligatorio post-protocolo",
        "Hidratación constante durante sesión"
    ],

    progresion: {
        semanal: {
            opcion1: "Añadir 1-2 reps totales por serie",
            opcion2: "Reducir descanso micro en 2-3 segundos",
            opcion3: "Aumentar peso 2.5-5% cuando alcances límite superior de reps"
        },
        mensual: {
            semana1_2: "Consolidar protocolo RP-RC",
            semana3: "Introducir variantes (RP-MYO, RP-NEG)",
            semana4: "Deload obligatorio"
        }
    }
};

// Código de inyección para NEXUS-APP (añadir al final de protocolos.js)
const NEXUS_INJECTION_CODE = `
// ============================================
// REST-PAUSE SYSTEM - METODOLOGÍA #11
// Añadir dentro de METODOLOGIAS_COMPLETAS:
// ============================================

RestPause: {
    id: "RP",
    nombre: "Rest-Pause System",
    autor: "Raúl Carrasco",
    descripcion: "Sistema de alta intensidad con series extendidas mediante micro-descansos de 10-20s, múltiples fallos musculares y máximo estrés metabólico.",
    protocolos: [
        {
            id: "RP-RC",
            nombre: "Rest-Pause Clásico Carrasco",
            descripcion: "10-12 reps al fallo + 10-20s + 4-6 reps + 10-20s + 2-4 reps",
            reps: "16-22 total",
            series: "1",
            descanso: "10-20s micro",
            rpe: "10",
            tut: "90-120s"
        },
        {
            id: "RP-EXT",
            nombre: "Rest-Pause Extendido",
            descripcion: "4 secuencias para volumen extremo",
            reps: "22-30 total",
            series: "1",
            descanso: "15-20s micro",
            rpe: "10+",
            tut: "120-150s"
        },
        {
            id: "RP-MYO",
            nombre: "Myo-Reps Style",
            descripcion: "Set activación + mini-sets de 3-5 reps",
            reps: "12-15 + 4-5 mini",
            series: "1",
            descanso: "3-5 respiraciones",
            rpe: "9-10",
            tut: "60-90s"
        },
        {
            id: "RP-DS",
            nombre: "Rest-Pause + Drop Sets",
            descripcion: "Rest-Pause seguido de drop set",
            reps: "10+4 + AMRAP",
            series: "1",
            descanso: "10s + 0s",
            rpe: "10+",
            tut: "120-180s"
        },
        {
            id: "RP-NEG",
            nombre: "Rest-Pause Excéntrico",
            descripcion: "Énfasis en fase excéntrica de 4 segundos",
            reps: "8+4-6",
            series: "1",
            descanso: "15s micro",
            rpe: "10",
            tut: "100-130s"
        },
        {
            id: "RP-ISO",
            nombre: "Rest-Pause Isométrico",
            descripcion: "Con holds isométricos en contracción máxima",
            reps: "8+4+2",
            series: "1",
            descanso: "10-15s micro",
            rpe: "10",
            tut: "80-100s"
        }
    ],
    estructura: {
        semanas: 4,
        parametros: {
            semana1: { intensidad: "Moderada", secuencias: 2 },
            semana2: { intensidad: "Alta", secuencias: 3 },
            semana3: { intensidad: "Máxima", secuencias: 3 },
            semana4: { intensidad: "50% Deload", series: "3x10-12 normal" }
        }
    },
    timerConfig: {
        microRest: { rest: 15, alertGo: true },
        postSet: { rest: 150, alertAt: 30 }
    },
    warmup: {
        set1: "30% x 15 reps",
        set2: "50% x 10 reps"
    },
    compatibleWith: ["Heavy Duty", "Blood & Guts", "DC Training"],
    incompatibleWith: ["SST", "GVT"]
}
`;

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
    window.REST_PAUSE_METODOLOGIA = REST_PAUSE_METODOLOGIA;
    window.NEXUS_INJECTION_CODE = NEXUS_INJECTION_CODE;
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { REST_PAUSE_METODOLOGIA, NEXUS_INJECTION_CODE };
}

console.log("✅ Rest-Pause System cargado correctamente");
console.log("📋 Protocolos disponibles:", REST_PAUSE_METODOLOGIA.protocolos.map(p => p.id).join(", "));
