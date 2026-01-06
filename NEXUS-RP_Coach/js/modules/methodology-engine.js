/**
 * NEXUS-RP Coach - Motor de Metodologías v2
 * Carga y gestiona las 11 metodologías del sistema NEXUS
 * con todos sus 41 protocolos y configuraciones
 */

const MethodologyEngine = (() => {
    // Datos completos de las 11 metodologías con 41 protocolos
    const FULL_METHODOLOGIES = {
        "Y3T": {
            id: "Y3T",
            name: "Y3T (Yoda 3 Training)",
            creator: "Neil Hill",
            level: ["Principiante", "Intermedio", "Avanzado"],
            philosophy: "Ondulación semanal con tres fases distintas",
            sessionDuration: "60-90 min",
            frequency: "5-6 días/semana",
            volume: "Alto",
            intensity: "Variable",
            type: "HYBRID",
            requiresSpotter: false,
            protocols: [
                { id: "Y3T-W1", name: "Week 1 Heavy", description: "Cargas pesadas, 6-10 reps, enfoque en fuerza", reps: "6-10", sets: "3-4", rest: 150, rpe: "8-9", rir: 2, tut: "40-60s", intensifiers: ["Forced Reps"] },
                { id: "Y3T-W2", name: "Week 2 Moderate", description: "Cargas moderadas, 10-14 reps, controlado", reps: "10-14", sets: "3-4", rest: 75, rpe: "7-8", rir: 2, tut: "50-70s", intensifiers: ["Superseries"] },
                { id: "Y3T-W3", name: "Week 3 Annihilation", description: "Alto volumen, técnicas intensas, pump máximo", reps: "15-30+", sets: "3-5", rest: 45, rpe: "9-10", rir: 0, tut: "60-90s", intensifiers: ["Drop Sets", "Superseries", "Giant Sets"] },
                { id: "Y3T-DL", name: "Deload", description: "Semana de recuperación", reps: "12-15", sets: "2-3", rest: 90, rpe: "5-6", rir: 4, tut: "30-40s", intensifiers: [] },
                { id: "Y3T-MOD", name: "Modificado Principiante", description: "Versión reducida para principiantes", reps: "8-12", sets: "2-3", rest: 105, rpe: "6-7", rir: 3, tut: "40-50s", intensifiers: [] },
                { id: "Y3T-INT", name: "Intensificado Avanzado", description: "Con técnicas adicionales post-fallo", reps: "Varies", sets: "4-5", rest: 67, rpe: "10", rir: 0, tut: "70-100s", intensifiers: ["Forced Reps", "Negativas", "Drop Sets"] }
            ],
            warmup: { week1: "3 sets progresivos (30% → 50% → 70%)", week2: "2 sets progresivos (40% → 60%)", week3: "1 set ligero (40%) + movilidad" },
            deload: { frequency: "Cada 6-9 semanas", duration: "1 semana", intensity: "50%" }
        },

        "HeavyDuty": {
            id: "HeavyDuty",
            name: "Heavy Duty",
            creator: "Mike Mentzer",
            level: ["Intermedio", "Avanzado"],
            philosophy: "HIT - Mínimo estímulo, máxima intensidad",
            sessionDuration: "30-45 min",
            frequency: "3-4 días/semana",
            volume: "Muy Bajo",
            intensity: "Máxima",
            type: "HIT",
            requiresSpotter: true,
            protocols: [
                { id: "HD-SU", name: "Serie Única al Fallo", description: "1 working set hasta fallo muscular absoluto", reps: "6-10", sets: "1", rest: 150, rpe: "10", rir: 0, tut: "40-60s", intensifiers: [] },
                { id: "HD-FR", name: "Forced Reps", description: "Reps asistidas después del fallo", reps: "+2-3", sets: "1", rest: 210, rpe: "10+", rir: -2, tut: "+10-15s", intensifiers: ["Forced Reps"] },
                { id: "HD-NEG", name: "Negativas", description: "Fase excéntrica supramáxima", reps: "3-5", sets: "1", rest: 240, rpe: "10+", rir: 0, tut: "4-6s por rep", load: "100-120% 1RM", intensifiers: ["Negativas"] },
                { id: "HD-RP", name: "Rest-Pause", description: "Micro descansos intra-serie", reps: "Varies", sets: "1", rest: 15, rpe: "10", rir: 0, tut: "Varies", intensifiers: ["Rest-Pause"] },
                { id: "HD-PE", name: "Pre-Exhaustion", description: "Aislamiento antes de compuesto", reps: "10-12 + 6-8", sets: "1+1", rest: 0, rpe: "10", rir: 0, tut: "60-80s", intensifiers: ["Pre-Agotamiento"] },
                { id: "HD-SS", name: "Superseries HIT", description: "Dos ejercicios sin descanso", reps: "8-10 + 8-10", sets: "1", rest: 0, rpe: "10", rir: 0, tut: "50-70s", intensifiers: ["Superseries"] }
            ],
            warmup: { set1: "30% x 12 reps", set2: "50% x 8 reps", set3: "70% x 4 reps" },
            deload: { frequency: "Cada 4-6 semanas", duration: "5-7 días", intensity: "50%", noFailure: true }
        },

        "BloodAndGuts": {
            id: "BloodAndGuts",
            name: "Blood & Guts",
            creator: "Dorian Yates",
            level: ["Intermedio", "Avanzado"],
            philosophy: "HIT estilo Dorian - Intensidad máxima",
            sessionDuration: "45-60 min",
            frequency: "4 días/semana",
            volume: "Bajo",
            intensity: "Máxima",
            type: "HIT",
            requiresSpotter: true,
            protocols: [
                { id: "BG-DY", name: "Dorian Yates Original", description: "2 warm-ups + 1 working set al fallo", reps: "8-10", sets: "1", rest: 120, rpe: "10", rir: 0, tut: "40-60s", intensifiers: [] },
                { id: "BG-FR", name: "Forced Reps Dorian", description: "2-3 reps asistidas post-fallo", reps: "+2-3", sets: "1", rest: 180, rpe: "10+", rir: -2, tut: "+10s", intensifiers: ["Forced Reps"] },
                { id: "BG-NEG", name: "Negativas Controladas", description: "Excéntricas lentas 4-6s", reps: "3-4", sets: "1", rest: 240, rpe: "10+", rir: 0, tut: "4-6s", intensifiers: ["Negativas"] },
                { id: "BG-RP", name: "Rest-Pause Dorian", description: "Descanso 10-15s, continuar", reps: "Varies", sets: "1", rest: 12, rpe: "10", rir: 0, tut: "Varies", intensifiers: ["Rest-Pause"] },
                { id: "BG-PAR", name: "Partials", description: "Reps parciales post-fallo", reps: "4-6", sets: "1", rest: 0, rpe: "10+", rir: 0, tut: "+15-20s", intensifiers: ["Parciales"] },
                { id: "BG-DS", name: "Drop Sets", description: "Reducir peso, continuar sin descanso", reps: "8→8→8", sets: "3 drops", rest: 0, rpe: "10+", rir: 0, tut: "60-90s", loadReduction: "20-30% por drop", intensifiers: ["Drop Sets"] }
            ],
            warmup: { set1: "30% x 15 reps", set2: "50% x 10 reps" },
            deload: { frequency: "Cada 6-8 semanas", duration: "1 semana", intensity: "60%" }
        },

        "MTUT": {
            id: "MTUT",
            name: "MTUT (Tiempo Bajo Tensión)",
            creator: "Varios",
            level: ["Principiante", "Intermedio", "Avanzado"],
            philosophy: "Tiempo bajo tensión extremo",
            sessionDuration: "45-60 min",
            frequency: "3-4 días/semana",
            volume: "Moderado",
            intensity: "Moderada",
            type: "VOLUME",
            requiresSpotter: false,
            protocols: [
                { id: "MTUT-TCE", name: "Tempo Concéntrico Extremo", description: "Fase concéntrica ultra-lenta (4s+)", reps: "6-8", sets: "3", rest: 75, rpe: "8-9", rir: 1, tut: "40-60s", tempo: "4-1-2", load: "40-50% 1RM", intensifiers: ["Tempo Lento"] },
                { id: "MTUT-TEE", name: "Tempo Excéntrico Extremo", description: "Fase excéntrica ultra-lenta (4s+)", reps: "6-8", sets: "3", rest: 75, rpe: "8-9", rir: 1, tut: "50-70s", tempo: "2-1-4", load: "45-55% 1RM", intensifiers: ["Negativas Lentas"] },
                { id: "MTUT-VE", name: "Variante Equilibrada", description: "Ambas fases lentas", reps: "5-7", sets: "3", rest: 52, rpe: "8-9", rir: 1, tut: "45-65s", tempo: "3-2-3", load: "40-50% 1RM", intensifiers: ["Tempo Controlado"] },
                { id: "MTUT-ISO", name: "Isométricos Integrados", description: "Pausas isométricas en puntos clave", reps: "5-6", sets: "3", rest: 75, rpe: "9", rir: 1, tut: "50-70s", tempo: "2-3-2", intensifiers: ["Isométricos"] },
                { id: "MTUT-SH", name: "Shock Sets", description: "Combinación de tempos sin descanso", reps: "15-20 total", sets: "1", rest: 120, rpe: "10", rir: 0, tut: "90-120s", load: "30-40% 1RM", intensifiers: ["Shock Sets"] },
                { id: "MTUT-SS", name: "Superseries MTUT", description: "Dos ejercicios con tempo lento", reps: "6-8 + 6-8", sets: "2-3", rest: 90, rpe: "9", rir: 1, tut: "80-100s", intensifiers: ["Superseries", "Tempo Lento"] }
            ],
            warmup: { mobility: "5 min articular", set1: "30% x 8 reps @ tempo normal", set2: "40% x 5 reps @ tempo MTUT" },
            deload: { frequency: "Cada 6-8 semanas", duration: "1 semana", intensity: "Subir peso 20%, tempo normal" }
        },

        "SST": {
            id: "SST",
            name: "SST (Sarcoplasm Stimulating Training)",
            creator: "Varios",
            level: ["Intermedio", "Avanzado"],
            philosophy: "Estrés metabólico extremo",
            sessionDuration: "45-75 min",
            frequency: "4-5 días/semana",
            volume: "Moderado",
            intensity: "Alta (múltiples fallos)",
            type: "HYBRID",
            requiresSpotter: false,
            protocols: [
                { id: "SST-RIV", name: "Rest Interval Variable", description: "Descansos crecientes 5s→25s entre mini-sets", reps: "Hasta fallo x 6-9", sets: "1 protocolo", rest: [5, 10, 15, 20, 25], rpe: "10", rir: 0, tut: "3-5 min total", failures: 9, load: "60-70% 1RM", intensifiers: ["Rest-Pause Progresivo", "Fallo Múltiple"] },
                { id: "SST-CT", name: "Contracción Tipo", description: "Alternar tipos de contracción", reps: "Varies", sets: "1 protocolo", rest: 15, rpe: "10", rir: 0, tut: "2-3 min", failures: 4, load: "65-75% 1RM", intensifiers: ["Variación Contracción"] },
                { id: "SST-RT", name: "Rest Time", description: "Micro descansos fijos", reps: "Hasta fallo x 3-4", sets: "1 protocolo", rest: 12, rpe: "10", rir: 0, tut: "2 min", failures: 4, load: "75-80% 1RM", intensifiers: ["Rest-Pause Fijo"] },
                { id: "SST-TM", name: "Tempo Manipulation", description: "Cambios de tempo dentro del set", reps: "12-15 total", sets: "1", rest: 90, rpe: "9-10", rir: 0, tut: "60-90s", intensifiers: ["Tempo Variable"] },
                { id: "SST-ISOM", name: "Isométrico SST", description: "Holds isométricos en puntos de fallo", reps: "5-6 + holds", sets: "1", rest: 120, rpe: "10", rir: 0, tut: "45-60s", intensifiers: ["Isométricos"] },
                { id: "SST-NEG", name: "Negativas SST", description: "Excéntricas lentas post-fallo", reps: "8-10 + 3-4 neg", sets: "1", rest: 120, rpe: "10+", rir: 0, tut: "50-70s", intensifiers: ["Negativas"] }
            ],
            warmup: { general: "5 min cardio + movilidad", set1: "30% x 15 reps", set2: "50% x 10 reps", hydration: "500ml agua pre-protocolo" },
            deload: { frequency: "Cada 4-6 semanas", duration: "1 semana sin SST", training: "3x10-12 normal" }
        },

        "FST7": {
            id: "FST7",
            name: "FST-7 (Fascia Stretch Training)",
            creator: "Hany Rambod",
            level: ["Principiante", "Intermedio", "Avanzado"],
            philosophy: "Estiramiento de fascia con 7 series finales",
            sessionDuration: "60-75 min",
            frequency: "5-6 días/semana",
            volume: "Alto (finisher)",
            intensity: "Moderada-Alta",
            type: "HYBRID",
            requiresSpotter: false,
            protocols: [
                { id: "FST7-CL", name: "FST-7 Clásico", description: "7 series al final con 30-45s descanso", reps: "8-12", sets: "7", rest: 35, rpe: "8-9", rir: 1, tut: "Varies", load: "50-60% 1RM", intensifiers: ["Pump Extremo"] },
                { id: "FST7-BN", name: "FST-7 Burn", description: "Con drop set en serie final", reps: "12-15 + drop", sets: "7", rest: 35, rpe: "10", rir: 0, tut: "Varies", load: "40-50% 1RM", intensifiers: ["Drop Sets", "Pump Extremo"] },
                { id: "FST7-ST", name: "FST-7 Stretch", description: "Con énfasis en posición de estiramiento", reps: "10-12", sets: "7", rest: 35, rpe: "8-9", rir: 1, tut: "Varies", load: "50-60% 1RM", intensifiers: ["Stretch Profundo"] },
                { id: "FST7-DL", name: "FST-7 Double", description: "Dos grupos con FST-7 en misma sesión", reps: "8-12", sets: "7+7", rest: 35, rpe: "9", rir: 1, tut: "Varies", intensifiers: ["Alto Volumen"] },
                { id: "FST7-HY", name: "FST-7 Híbrido", description: "Combinado con otra metodología", reps: "10-12", sets: "5-7", rest: 40, rpe: "8-9", rir: 1, tut: "Varies", intensifiers: ["Flexible"] }
            ],
            warmup: { compounds: "Calentamiento normal", preFST: "1 set ligero (30%) x 15 reps", hydration: "Beber agua entre cada serie" },
            deload: { frequency: "Cada 6-8 semanas", duration: "1 semana sin FST-7", alternative: "Reducir a 4 series" }
        },

        "RestPause": {
            id: "RestPause",
            name: "Rest-Pause System",
            creator: "Raúl Carrasco",
            level: ["Intermedio", "Avanzado"],
            philosophy: "Micro-descansos para múltiples fallos en serie extendida",
            sessionDuration: "45-60 min",
            frequency: "4-5 días/semana",
            volume: "Moderado",
            intensity: "Alta",
            type: "HIT",
            requiresSpotter: false,
            protocols: [
                { id: "RP-RC", name: "Rest-Pause Clásico", description: "10-12 reps al fallo + 10-20s + 4-6 reps + 10-20s + 2-4 reps", reps: "16-22 total", sets: "1 extendida", rest: 15, rpe: "10", rir: 0, tut: "90-120s", load: "70-80% 1RM", sequences: 3, intensifiers: ["Rest-Pause"] },
                { id: "RP-EXT", name: "Rest-Pause Extendido", description: "4 secuencias para volumen extremo", reps: "22-30 total", sets: "1 extendida", rest: 17, rpe: "10+", rir: 0, tut: "120-150s", load: "65-75% 1RM", sequences: 4, intensifiers: ["Rest-Pause Extendido"] },
                { id: "RP-MYO", name: "Myo-Reps Style", description: "Set activación + mini-sets de 3-5 reps", reps: "12-15 + minis", sets: "1 extendida", rest: 5, rpe: "9-10", rir: 0, tut: "60-90s", load: "70-80% 1RM", intensifiers: ["Myo-Reps"] },
                { id: "RP-DS", name: "Rest-Pause + Drop Sets", description: "Rest-Pause seguido de drop set", reps: "10+4 + AMRAP", sets: "1 extendida", rest: 10, rpe: "10+", rir: 0, tut: "120-180s", load: "75%→55% 1RM", dropPercent: "30%", intensifiers: ["Rest-Pause", "Drop Sets"] },
                { id: "RP-NEG", name: "Rest-Pause Excéntrico", description: "Énfasis en fase excéntrica de 4 segundos", reps: "8+4-6", sets: "1 extendida", rest: 15, rpe: "10", rir: 0, tut: "100-130s", load: "70-75% 1RM", tempo: "2-0-4", intensifiers: ["Rest-Pause", "Negativas"] },
                { id: "RP-ISO", name: "Rest-Pause Isométrico", description: "Con holds isométricos en contracción máxima", reps: "8+4+2", sets: "1 extendida", rest: 12, rpe: "10", rir: 0, tut: "80-100s", load: "65-70% 1RM", holdDuration: "3-5s", intensifiers: ["Rest-Pause", "Isométricos"] }
            ],
            warmup: { set1: "30% x 15 reps", set2: "50% x 10 reps" },
            deload: { frequency: "Cada 3-4 semanas", duration: "1 semana", intensity: "50%, sin RP" }
        },

        "DCTraining": {
            id: "DCTraining",
            name: "DC Training (DoggCrapp)",
            creator: "Dante Trudel",
            level: ["Avanzado"],
            philosophy: "Alta frecuencia, bajo volumen, rest-pause extremo",
            sessionDuration: "45-60 min",
            frequency: "3 días/semana (A-B-A)",
            volume: "Muy Bajo",
            intensity: "Máxima",
            type: "HIT",
            requiresSpotter: true,
            protocols: [
                { id: "DC-RP", name: "Rest-Pause DC", description: "11-15 reps, descanso 10-15 resp, +reps hasta fallo x2", reps: "11-15 + 4-6 + 2-3", sets: "1", rest: 10, rpe: "10+", rir: 0, tut: "80-100s", intensifiers: ["Rest-Pause DC"] },
                { id: "DC-SS", name: "Straight Sets DC", description: "Para ejercicios donde RP no es práctico", reps: "15-20", sets: "1", rest: 120, rpe: "10", rir: 0, tut: "60-80s", intensifiers: [] },
                { id: "DC-WD", name: "Widowmaker", description: "1 set de 20 reps brutales post-ejercicio", reps: "20", sets: "1", rest: 180, rpe: "10+", rir: 0, tut: "90-120s", load: "50-60% 1RM", intensifiers: ["Widowmaker"] },
                { id: "DC-ES", name: "Extreme Stretching", description: "60-90s stretch post-ejercicio", reps: "N/A", sets: "1", rest: 0, rpe: "7-8", rir: 0, duration: "60-90s", intensifiers: ["Extreme Stretch"] }
            ],
            warmup: { set1: "30% x 12", set2: "50% x 8", set3: "70% x 4" },
            deload: { frequency: "Cada 2 semanas (blast/cruise)", duration: "1-2 semanas", intensity: "Sin fallo" }
        },

        "GVT": {
            id: "GVT",
            name: "GVT (German Volume Training)",
            creator: "Rolf Feser / Vince Gironda",
            level: ["Intermedio", "Avanzado"],
            philosophy: "10x10 - Volumen extremo para hipertrofia",
            sessionDuration: "60-75 min",
            frequency: "4-5 días/semana",
            volume: "Extremadamente Alto",
            intensity: "Moderada",
            type: "VOLUME",
            requiresSpotter: false,
            protocols: [
                { id: "GVT-CL", name: "GVT Clásico 10x10", description: "10 series de 10 reps con 60% 1RM", reps: "10", sets: "10", rest: 60, rpe: "7→9", rir: 3, tut: "40-50s", load: "60% 1RM", intensifiers: ["Alto Volumen"] },
                { id: "GVT-66", name: "GVT 6x6", description: "Variante de fuerza-hipertrofia", reps: "6", sets: "6", rest: 90, rpe: "8-9", rir: 2, tut: "30-40s", load: "70-75% 1RM", intensifiers: ["Volumen Moderado"] },
                { id: "GVT-55", name: "GVT 5x5", description: "Variante de fuerza", reps: "5", sets: "5", rest: 120, rpe: "9", rir: 1, tut: "25-35s", load: "80% 1RM", intensifiers: ["Fuerza"] },
                { id: "GVT-1012", name: "GVT Modificado 10x12", description: "Mayor TUT por serie", reps: "12", sets: "10", rest: 45, rpe: "8→10", rir: 2, tut: "50-60s", load: "55% 1RM", intensifiers: ["Alto TUT"] }
            ],
            warmup: { set1: "30% x 15", set2: "45% x 10", set3: "55% x 5" },
            deload: { frequency: "Cada 4-6 semanas", duration: "1 semana", volume: "5x5 @ 60%" }
        },

        "DUP": {
            id: "DUP",
            name: "DUP (Daily Undulating Periodization)",
            creator: "Varios / Dr. Mike Zourdos",
            level: ["Intermedio", "Avanzado"],
            philosophy: "Variar intensidad/volumen diariamente",
            sessionDuration: "60-90 min",
            frequency: "3-6 días/semana",
            volume: "Variable",
            intensity: "Variable",
            type: "VOLUME",
            requiresSpotter: false,
            protocols: [
                { id: "DUP-HY", name: "DUP Día Hipertrofia", description: "Alto volumen, moderada intensidad", reps: "8-12", sets: "3-4", rest: 90, rpe: "7-8", rir: 2, tut: "40-50s", load: "65-75% 1RM", intensifiers: [] },
                { id: "DUP-ST", name: "DUP Día Fuerza", description: "Bajo volumen, alta intensidad", reps: "3-5", sets: "4-6", rest: 180, rpe: "9", rir: 1, tut: "15-25s", load: "85-90% 1RM", intensifiers: [] },
                { id: "DUP-PW", name: "DUP Día Potencia", description: "Velocidad explosiva", reps: "1-3", sets: "5-8", rest: 180, rpe: "8", rir: 0, tut: "5-10s", load: "70-80% 1RM", intensifiers: ["Explosivo"] },
                { id: "DUP-EN", name: "DUP Día Resistencia", description: "Alto reps, bajo peso", reps: "15-20", sets: "2-3", rest: 60, rpe: "7-8", rir: 3, tut: "60-80s", load: "50-60% 1RM", intensifiers: [] }
            ],
            warmup: { general: "5 min cardio + movilidad específica", progressive: "Según día (más en día fuerza)" },
            deload: { frequency: "Cada 4 semanas", duration: "1 semana", method: "50% volumen, mantener intensidad" }
        },

        "531": {
            id: "531",
            name: "5/3/1 (Wendler)",
            creator: "Jim Wendler",
            level: ["Principiante", "Intermedio", "Avanzado"],
            philosophy: "Progresión mensual lenta y sostenible",
            sessionDuration: "45-75 min",
            frequency: "3-4 días/semana",
            volume: "Moderado",
            intensity: "Progresiva",
            type: "VOLUME",
            requiresSpotter: false,
            protocols: [
                { id: "531-W1", name: "Semana 1 (5s)", description: "3 sets de 5 reps progresivos", reps: "5/5/5+", sets: "3", rest: 180, rpe: "7-8-9+", rir: 3, tut: "25-35s", load: "65/75/85% TM", intensifiers: ["AMRAP último set"] },
                { id: "531-W2", name: "Semana 2 (3s)", description: "3 sets de 3 reps progresivos", reps: "3/3/3+", sets: "3", rest: 180, rpe: "8-9-10+", rir: 2, tut: "15-25s", load: "70/80/90% TM", intensifiers: ["AMRAP último set"] },
                { id: "531-W3", name: "Semana 3 (5/3/1)", description: "5, 3, 1+ reps progresivos", reps: "5/3/1+", sets: "3", rest: 240, rpe: "8-9-10+", rir: 1, tut: "15-20s", load: "75/85/95% TM", intensifiers: ["AMRAP último set"] },
                { id: "531-DL", name: "Deload", description: "Semana de recuperación", reps: "5/5/5", sets: "3", rest: 120, rpe: "5-6", rir: 4, tut: "25-35s", load: "40/50/60% TM", intensifiers: [] },
                { id: "531-BBB", name: "Boring But Big", description: "5x10 accesorio post-main", reps: "10", sets: "5", rest: 90, rpe: "7-8", rir: 2, tut: "40-50s", load: "50-60% TM", intensifiers: ["Alto Volumen"] }
            ],
            warmup: { set1: "40% x 5", set2: "50% x 5", set3: "60% x 3" },
            deload: { frequency: "Cada 4 semanas (7th week protocol opcional)", duration: "1 semana", method: "40/50/60% TM" }
        }
    };

    // Estado actual
    let current = {
        methodology: 'Y3T',
        protocol: 'Y3T-W1'
    };

    /**
     * Inicializa el motor
     */
    function init() {
        console.log('🔧 MethodologyEngine v2: Inicializando con 11 metodologías completas');
        loadFromStorage();
        emitChange();
        console.log(`✅ Metodología actual: ${current.methodology} - ${current.protocol}`);
    }

    /**
     * Carga configuración desde localStorage
     */
    function loadFromStorage() {
        try {
            const saved = localStorage.getItem('nexus_current_methodology');
            if (saved) {
                const parsed = JSON.parse(saved);
                current = { ...current, ...parsed };
            }
        } catch (e) {
            console.error('Error cargando metodología:', e);
        }
    }

    /**
     * Guarda configuración en localStorage
     */
    function saveToStorage() {
        localStorage.setItem('nexus_current_methodology', JSON.stringify(current));
    }

    /**
     * Emite evento de cambio de metodología
     */
    function emitChange() {
        const params = getCurrentParameters();
        window.dispatchEvent(new CustomEvent('methodologyChange', {
            detail: {
                methodology: current.methodology,
                protocol: current.protocol,
                parameters: params
            }
        }));
    }

    /**
     * Cambia la metodología actual
     */
    function setMethodology(methodologyId, protocolId = null) {
        const meth = FULL_METHODOLOGIES[methodologyId];
        if (!meth) {
            console.error(`Metodología ${methodologyId} no encontrada`);
            return false;
        }

        current.methodology = methodologyId;
        current.protocol = protocolId || meth.protocols[0]?.id;

        saveToStorage();
        emitChange();

        console.log(`✅ Metodología cambiada: ${meth.name} - ${current.protocol}`);
        return true;
    }

    /**
     * Cambia el protocolo actual
     */
    function setProtocol(protocolId) {
        const meth = FULL_METHODOLOGIES[current.methodology];
        const prot = meth?.protocols.find(p => p.id === protocolId);

        if (!prot) {
            console.error(`Protocolo ${protocolId} no encontrado`);
            return false;
        }

        current.protocol = protocolId;
        saveToStorage();
        emitChange();

        return true;
    }

    /**
     * Obtiene parámetros actuales
     */
    function getCurrentParameters() {
        const meth = FULL_METHODOLOGIES[current.methodology];
        if (!meth) return {};

        const prot = meth.protocols.find(p => p.id === current.protocol) || meth.protocols[0];
        if (!prot) return {};

        return {
            methodology: meth.name,
            methodologyId: meth.id,
            type: meth.type,
            protocol: prot.name,
            protocolId: prot.id,
            description: prot.description,
            sets: prot.sets,
            reps: prot.reps,
            rest: Array.isArray(prot.rest) ? prot.rest[0] : prot.rest,
            restArray: Array.isArray(prot.rest) ? prot.rest : [prot.rest],
            rpe: prot.rpe,
            rir: prot.rir !== undefined ? prot.rir : 2,
            tut: prot.tut,
            tempo: prot.tempo || null,
            load: prot.load || null,
            failures: prot.failures || null,
            sequences: prot.sequences || null,
            intensifiers: prot.intensifiers || [],
            requiresSpotter: meth.requiresSpotter
        };
    }

    /**
     * Obtiene una metodología completa
     */
    function getMethodology(methodologyId) {
        return FULL_METHODOLOGIES[methodologyId] || null;
    }

    /**
     * Obtiene un protocolo específico
     */
    function getProtocol(methodologyId, protocolId) {
        const meth = FULL_METHODOLOGIES[methodologyId];
        return meth?.protocols.find(p => p.id === protocolId) || null;
    }

    /**
     * Lista todas las metodologías
     */
    function listMethodologies() {
        return Object.entries(FULL_METHODOLOGIES).map(([id, m]) => ({
            id,
            name: m.name,
            creator: m.creator,
            type: m.type,
            level: m.level,
            volume: m.volume,
            intensity: m.intensity,
            protocols: m.protocols.length,
            requiresSpotter: m.requiresSpotter
        }));
    }

    /**
     * Filtra metodologías por tipo o nivel
     */
    function filterMethodologies(filter = {}) {
        let results = Object.values(FULL_METHODOLOGIES);

        if (filter.type) {
            results = results.filter(m => m.type === filter.type);
        }
        if (filter.level) {
            results = results.filter(m => m.level.includes(filter.level));
        }
        if (filter.requiresSpotter !== undefined) {
            results = results.filter(m => m.requiresSpotter === filter.requiresSpotter);
        }

        return results;
    }

    /**
     * Obtiene información de warmup para metodología
     */
    function getWarmup(methodologyId) {
        const meth = FULL_METHODOLOGIES[methodologyId];
        return meth?.warmup || null;
    }

    /**
     * Obtiene información de deload para metodología
     */
    function getDeload(methodologyId) {
        const meth = FULL_METHODOLOGIES[methodologyId];
        return meth?.deload || null;
    }

    // Inicializar al cargar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API Pública
    return {
        init,
        setMethodology,
        setProtocol,
        getCurrentParameters,
        getMethodology,
        getProtocol,
        listMethodologies,
        filterMethodologies,
        getWarmup,
        getDeload,
        current: () => current,
        FULL_METHODOLOGIES,
        // Alias para compatibilidad
        EMBEDDED_METHODOLOGIES: FULL_METHODOLOGIES
    };
})();

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.MethodologyEngine = MethodologyEngine;
}
