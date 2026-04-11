/**
 * NEXUS-RP Coach - Motor de Metodologías v2
 * Carga y gestiona las 9 metodologías RPizadas del sistema NEXUS
 * con todos sus protocolos y configuraciones optimizadas
 *
 * v3 - Actualización: Eliminadas GVT (score 73) y DC Training (score 67)
 * por incompatibilidad científica. Metodologías #5-#9 mejoradas con:
 * - Lengthened Partials (parciales en posición estirada)
 * - Myo-Reps (mini-series post-activación)
 * - Tempo excéntrico optimizado (2-4s, evidencia 2025)
 * - Cluster Sets para mejor calidad de movimiento
 */

const MethodologyEngine = (() => {
    // Datos completos de las 9 metodologías RPizadas
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
                { id: "Y3T-W1", name: "Week 1 Heavy", description: "Cargas pesadas, 6-10 reps, enfoque en fuerza", reps: "6-10", sets: "3-4", rest: 150, rpe: "8-9", rir: 2, tut: "40-60s", load: "75-85% 1RM", tempo: "2-1-2", intensifiers: ["Forced Reps"] },
                { id: "Y3T-W2", name: "Week 2 Moderate", description: "Cargas moderadas, 10-14 reps, controlado", reps: "10-14", sets: "3-4", rest: 75, rpe: "7-8", rir: 2, tut: "50-70s", load: "65-75% 1RM", tempo: "2-0-2", intensifiers: ["Superseries"] },
                { id: "Y3T-W3", name: "Week 3 Annihilation", description: "Alto volumen, técnicas intensas, pump máximo", reps: "15-30", sets: "3-5", rest: 45, rpe: "9-10", rir: 0, tut: "60-90s", load: "50-65% 1RM", tempo: "2-0-1", intensifiers: ["Drop Sets", "Superseries", "Giant Sets"] },
                { id: "Y3T-DL", name: "Deload", description: "Semana de recuperación", reps: "12-15", sets: "2-3", rest: 90, rpe: "5-6", rir: 4, tut: "30-40s", load: "50-60% 1RM", tempo: "2-0-2", intensifiers: [] },
                { id: "Y3T-MOD", name: "Modificado Principiante", description: "Versión reducida para principiantes", reps: "8-12", sets: "2-3", rest: 105, rpe: "6-7", rir: 3, tut: "40-50s", load: "60-70% 1RM", tempo: "2-1-2", intensifiers: [] },
                { id: "Y3T-INT", name: "Intensificado Avanzado", description: "Con técnicas adicionales post-fallo", reps: "6-12", sets: "4-5", rest: 67, rpe: "10", rir: 0, tut: "70-100s", load: "75-90% 1RM", tempo: "2-0-2", intensifiers: ["Forced Reps", "Negativas", "Drop Sets"] }
            ],
            warmup: { week1: "3 sets progresivos (30% → 50% → 70%)", week2: "2 sets progresivos (40% → 60%)", week3: "1 set ligero (40%) + movilidad" },
            deload: { frequency: "Cada 6-9 semanas", duration: "1 semana", intensity: "50%" }
        },

        "HeavyDuty": {
            id: "HeavyDuty",
            name: "HIT Inteligente (Heavy Duty RPizado)",
            creator: "Mike Mentzer / RP Style",
            level: ["Intermedio", "Avanzado"],
            philosophy: "HIT con volumen mínimo efectivo: 2-3 series (última al fallo), RIR progresivo, Myo-Reps como intensificador cuantificable",
            sessionDuration: "35-50 min",
            frequency: "3-4 días/semana",
            volume: "Bajo-Moderado",
            intensity: "Alta",
            type: "HIT",
            requiresSpotter: false,
            rpScore: 84,
            rpImprovements: ["Myo-Reps post-fallo", "RIR progresivo 2→1→0", "2-3 series vs 1", "Beyond failure solo en peak"],
            protocols: [
                { id: "HD-RP", name: "HIT Progresivo", description: "2-3 series con RIR progresivo (3→2→1→0 por semana), última serie al fallo", reps: "6-10", sets: "2-3", rest: 150, rpe: "8-10", rir: 2, tut: "40-60s", load: "75-85% 1RM", tempo: "2-1-3", intensifiers: ["Rest-Pause"] },
                { id: "HD-MYO", name: "HIT + Myo-Reps", description: "1 serie base al fallo + Myo-Reps: 20-30s descanso → 3-5 reps × 3 mini-series", reps: "6-10", extraReps: "+9-15 Myo-Reps (20-30s)", sets: "1+3 mini", rest: 25, rpe: "10", rir: 0, tut: "80-100s", load: "75-80% 1RM", tempo: "2-1-3", microRest: [20, 30], intensifiers: ["Myo-Reps"] },
                { id: "HD-NEG", name: "Negativas Controladas", description: "Fase excéntrica 4s controlada (no supramáxima). Solo semana Peak", reps: "6-8", sets: "2", rest: 180, rpe: "9-10", rir: 0, tut: "50-70s", load: "80-85% 1RM", tempo: "2-0-4", intensifiers: ["Negativas"] },
                { id: "HD-PE", name: "Pre-Exhaustion + Myo", description: "Aislamiento al fallo → compuesto → Myo-Reps en compuesto", reps: "12-15 + 6-8", extraReps: "+Myo 3-5x3", sets: "1+1+mini", rest: 0, rpe: "10", rir: 0, tut: "90-120s", load: "60-70% + 80% 1RM", tempo: "2-0-3", intensifiers: ["Pre-Agotamiento", "Myo-Reps"] },
                { id: "HD-LP", name: "HIT Lengthened Partials", description: "Series al fallo + 3-4 parciales en posición estirada post-fallo", reps: "6-10", extraReps: "+3-4 lengthened partials", sets: "2", rest: 150, rpe: "10+", rir: 0, tut: "60-80s", load: "75-85% 1RM", tempo: "2-1-3", intensifiers: ["Lengthened Partials"] }
            ],
            warmup: { set1: "30% x 12 reps", set2: "50% x 8 reps", set3: "70% x 4 reps" },
            deload: { frequency: "Cada 4 semanas", duration: "1 semana", intensity: "50%", noFailure: true }
        },

        "BloodAndGuts": {
            id: "BloodAndGuts",
            name: "Blood & Guts (HIT Inteligente - Yates)",
            creator: "Dorian Yates / RP Style",
            level: ["Intermedio", "Avanzado"],
            philosophy: "HIT estilo Dorian con volumen optimizado: 2-3 series, RIR progresivo, Myo-Reps y Lengthened Partials",
            sessionDuration: "45-60 min",
            frequency: "4 días/semana",
            volume: "Bajo-Moderado",
            intensity: "Alta",
            type: "HIT",
            requiresSpotter: false,
            rpScore: 84,
            rpImprovements: ["Myo-Reps post-fallo", "Lengthened Partials", "2-3 series con RIR progresivo", "Sin supramáximas innecesarias"],
            protocols: [
                { id: "BG-DY", name: "Yates Progresivo", description: "2-3 series con RIR 3→2→1→0 por semana. Última serie al fallo", reps: "8-10", sets: "2-3", rest: 120, rpe: "8-10", rir: 2, tut: "40-60s", load: "75-85% 1RM", tempo: "2-0-3", intensifiers: ["Forced Reps"] },
                { id: "BG-MYO", name: "B&G + Myo-Reps", description: "Serie al fallo + Myo-Reps (25s descanso → 3-5 reps × 3)", reps: "8-10", extraReps: "+9-15 Myo-Reps", sets: "1+3 mini", rest: 25, rpe: "10", rir: 0, tut: "70-90s", load: "75-80% 1RM", tempo: "2-0-3", microRest: [25], intensifiers: ["Myo-Reps"] },
                { id: "BG-LP", name: "B&G Lengthened Partials", description: "Serie al fallo + 4-6 parciales en posición estirada", reps: "8-10", extraReps: "+4-6 lengthened partials", sets: "2", rest: 150, rpe: "10+", rir: 0, tut: "60-80s", load: "75-85% 1RM", tempo: "2-0-3", intensifiers: ["Lengthened Partials"] },
                { id: "BG-NEG", name: "Excéntrico Controlado", description: "Excéntrica 4s controlada (no supramáxima). Solo semana Peak", reps: "8-10", sets: "2", rest: 180, rpe: "9-10", rir: 0, tut: "60-80s", load: "80-85% 1RM", tempo: "2-0-4", intensifiers: ["Negativas"] },
                { id: "BG-DS", name: "Drop Sets Progresivos", description: "Serie al fallo → drop 20% → Lengthened Partials finales", reps: "8→8→LP", sets: "1+2 drops", rest: 0, rpe: "10+", rir: 0, tut: "60-90s", load: "80%→60% 1RM", tempo: "2-0-3", loadReduction: "20% por drop", intensifiers: ["Drop Sets", "Lengthened Partials"] }
            ],
            warmup: { set1: "30% x 15 reps", set2: "50% x 10 reps" },
            deload: { frequency: "Cada 4 semanas", duration: "1 semana", intensity: "50%" }
        },

        "MTUT": {
            id: "MTUT",
            name: "Control Excéntrico Periodizado (MTUT RPizado)",
            creator: "Varios / RP Style",
            level: ["Principiante", "Intermedio", "Avanzado"],
            philosophy: "Concéntrica explosiva + excéntrica controlada 2s→3s→4s por mesociclo. Lengthened Partials en peak. Evidencia 2025: >4s no aporta beneficio adicional",
            sessionDuration: "45-60 min",
            frequency: "3-4 días/semana",
            volume: "Moderado",
            intensity: "Moderada-Alta",
            type: "VOLUME",
            requiresSpotter: false,
            rpScore: 85,
            rpImprovements: ["Tempo excéntrico 2-4s (evidencia 2025)", "Concéntrica explosiva", "Lengthened Partials en peak", "RIR progresivo", "Cargas más altas que MTUT original"],
            protocols: [
                { id: "MTUT-EXP", name: "Excéntrico Progresivo", description: "Concéntrica explosiva + excéntrica 2s→3s→4s según semana del mesociclo", reps: "8-10", sets: "3-4", rest: 90, rpe: "7-9", rir: 2, tut: "50-70s", tempo: "X-0-3", load: "65-75% 1RM", intensifiers: ["Tempo Lento"] },
                { id: "MTUT-LP", name: "Excéntrico + Lengthened Partials", description: "Series con tempo excéntrico 3-4s + 3-4 parciales en posición estirada al final", reps: "6-8", extraReps: "+3-4 LP", sets: "3", rest: 90, rpe: "9-10", rir: 0, tut: "60-80s", tempo: "X-0-4", load: "70-80% 1RM", intensifiers: ["Lengthened Partials"] },
                { id: "MTUT-ISO", name: "Isométricos en Estiramiento", description: "Pausa 2-3s en posición de máximo estiramiento muscular", reps: "6-8", sets: "3", rest: 90, rpe: "8-9", rir: 1, tut: "60-80s", load: "60-70% 1RM", tempo: "X-3-3", intensifiers: ["Isométricos", "Lengthened Partials"] },
                { id: "MTUT-VE", name: "Equilibrado Progresivo", description: "Tempo controlado ambas fases con RIR progresivo 3→1", reps: "8-10", sets: "3-4", rest: 75, rpe: "7-9", rir: 2, tut: "50-70s", tempo: "2-1-3", load: "60-70% 1RM", intensifiers: ["Tempo Controlado"] },
                { id: "MTUT-SS", name: "Superseries Excéntricas", description: "Dos ejercicios con énfasis excéntrico, segundo en posición estirada", reps: "8 + 8", sets: "3", rest: 90, rpe: "9", rir: 1, tut: "80-100s", load: "60-70% 1RM", tempo: "X-0-3", intensifiers: ["Superseries", "Lengthened Partials"] }
            ],
            warmup: { mobility: "5 min articular", set1: "30% x 8 reps @ tempo normal", set2: "50% x 5 reps @ tempo excéntrico" },
            deload: { frequency: "Cada 4 semanas", duration: "1 semana", intensity: "Subir peso 15%, tempo normal (sin excéntrico lento)" }
        },

        "SST": {
            id: "SST",
            name: "Estrés Metabólico Progresivo (SST RPizado)",
            creator: "Varios / RP Style",
            level: ["Intermedio", "Avanzado"],
            philosophy: "Series base con RIR progresivo + SST finisher como estrés metabólico. Semanas 3-4 cambia SST por Myo-Reps para cuantificar mejor la progresión",
            sessionDuration: "45-75 min",
            frequency: "4-5 días/semana",
            volume: "Moderado",
            intensity: "Alta",
            type: "HYBRID",
            requiresSpotter: false,
            rpScore: 84,
            rpImprovements: ["Series base con RIR progresivo", "SST como finisher (no base)", "Myo-Reps en semanas peak", "Progresión cuantificable", "Lengthened Partials opcionales"],
            protocols: [
                { id: "SST-BASE", name: "Base + SST Finisher", description: "3 series base RIR 3→1 + 1 protocolo SST finisher (secuencia 8-6-4)", reps: "8-12", extraReps: "+SST 8-6-4", sets: "3+1 SST", rest: 90, rpe: "7-9", rir: 2, tut: "60-80s", load: "65-75% 1RM", tempo: "2-0-2", intensifiers: ["Rest-Pause Progresivo"] },
                { id: "SST-MYO", name: "Base + Myo-Reps Finisher", description: "3 series base + Myo-Reps (activación 15-20 reps → mini-series 5-3-3). Semanas 3-4", reps: "8-12", extraReps: "+15-20 act + 5-3-3 Myo", sets: "3+1 Myo", rest: 90, rpe: "9-10", rir: 1, tut: "80-120s", load: "65-75% 1RM", tempo: "2-0-2", microRest: [20, 30], intensifiers: ["Myo-Reps"] },
                { id: "SST-LP", name: "SST + Lengthened Partials", description: "Protocolo SST clásico pero las reps finales como parciales en estiramiento", reps: "Hasta fallo x 4-6", extraReps: "+LP finales", sets: "1 protocolo", rest: [5, 10, 15, 20], rpe: "10", rir: 0, tut: "3-4 min", failures: 6, load: "60-70% 1RM", tempo: "2-0-2", microRest: [5, 10, 15, 20], intensifiers: ["Rest-Pause Progresivo", "Lengthened Partials"] },
                { id: "SST-CT", name: "Contracción Tipo Progresiva", description: "Alternar contracciones con RIR decreciente por semana", reps: "8-10 + variantes", sets: "1 protocolo", rest: 15, rpe: "8-10", rir: 1, tut: "2-3 min", failures: 4, load: "65-75% 1RM", tempo: "2-1-2", microRest: [15], intensifiers: ["Variación Contracción"] },
                { id: "SST-TM", name: "Tempo Metabólico", description: "Excéntrica controlada 3s + SST finisher. Combina estrés mecánico y metabólico", reps: "10-12", sets: "3", rest: 75, rpe: "8-9", rir: 1, tut: "70-90s", load: "60-70% 1RM", tempo: "X-0-3", intensifiers: ["Tempo Controlado", "Rest-Pause Progresivo"] }
            ],
            warmup: { general: "5 min cardio + movilidad", set1: "30% x 15 reps", set2: "50% x 10 reps", hydration: "500ml agua pre-protocolo" },
            deload: { frequency: "Cada 4 semanas", duration: "1 semana sin SST/Myo-Reps", training: "3x10-12 normal" }
        },

        "FST7": {
            id: "FST7",
            name: "FST-7 + Lengthened Partials",
            creator: "Hany Rambod / RP Style",
            level: ["Principiante", "Intermedio", "Avanzado"],
            philosophy: "Series base con RIR progresivo + 7 series finisher en posición estirada (Lengthened Partials). Evidencia 2025: parciales en estiramiento = o > ROM completo para hipertrofia",
            sessionDuration: "60-75 min",
            frequency: "5-6 días/semana",
            volume: "Alto (finisher)",
            intensity: "Moderada-Alta",
            type: "HYBRID",
            requiresSpotter: false,
            rpScore: 86,
            rpImprovements: ["7 series FST en posición estirada (Lengthened Partials)", "Series base con RIR progresivo", "Evidencia 2025 respalda parciales estirados"],
            protocols: [
                { id: "FST7-LP", name: "FST-7 Lengthened Partials", description: "3-4 series base ROM completo RIR 3→1 + 7 series FST en mitad estirada del ROM", reps: "8-12", sets: "3-4 + 7 LP", rest: 35, rpe: "8-9", rir: 1, tut: "Varies", load: "50-65% 1RM", tempo: "2-0-2", intensifiers: ["Pump Extremo", "Lengthened Partials"] },
                { id: "FST7-CL", name: "FST-7 Clásico RPizado", description: "Series base progresivas + 7 series finisher con 30-45s descanso", reps: "8-12", sets: "3-4 + 7", rest: 35, rpe: "8-9", rir: 2, tut: "Varies", load: "50-65% 1RM", tempo: "2-0-2", intensifiers: ["Pump Extremo"] },
                { id: "FST7-BN", name: "FST-7 Burn + LP", description: "7 series con Lengthened Partials + drop set final en posición estirada", reps: "10-12 + drop LP", sets: "7", rest: 35, rpe: "10", rir: 0, tut: "Varies", load: "40-55% 1RM", tempo: "2-0-2", intensifiers: ["Drop Sets", "Pump Extremo", "Lengthened Partials"] },
                { id: "FST7-ST", name: "FST-7 Stretch Máximo", description: "Ejercicios seleccionados por máximo estiramiento + Lengthened Partials", reps: "10-12", sets: "7", rest: 35, rpe: "8-9", rir: 1, tut: "Varies", load: "50-60% 1RM", tempo: "2-1-2", intensifiers: ["Stretch Profundo", "Lengthened Partials"] },
                { id: "FST7-HY", name: "FST-7 Híbrido", description: "Combinable con otra metodología. 5-7 series finisher adaptables", reps: "10-12", sets: "5-7", rest: 40, rpe: "8-9", rir: 1, tut: "Varies", load: "55-65% 1RM", tempo: "2-0-2", intensifiers: ["Flexible", "Lengthened Partials"] }
            ],
            warmup: { compounds: "Calentamiento normal", preFST: "1 set ligero (30%) x 15 reps", hydration: "Beber agua entre cada serie" },
            deload: { frequency: "Cada 4 semanas", duration: "1 semana sin FST-7", alternative: "Reducir a 4 series, sin LP" }
        },

        "RestPause": {
            id: "RestPause",
            name: "Rest-Pause + Clusters (RPizado)",
            creator: "Raúl Carrasco / RP Style",
            level: ["Intermedio", "Avanzado"],
            philosophy: "Rest-Pause con progresión dual (peso + densidad). Reps post-pausa como Lengthened Partials. Cluster Sets para mejor calidad. Meta-análisis 2024: RP mejora IGF-1 y ratio follistatin/myostatin",
            sessionDuration: "45-60 min",
            frequency: "4-5 días/semana",
            volume: "Moderado",
            intensity: "Alta",
            type: "HIT",
            requiresSpotter: false,
            rpScore: 85,
            rpImprovements: ["Reps post-pausa como Lengthened Partials", "Progresión dual: peso + densidad (20s→15s→10s)", "Cluster Sets opcionales", "RIR progresivo por mesociclo"],
            protocols: [
                { id: "RP-LP", name: "Rest-Pause + Lengthened Partials", description: "Serie al fallo → 15-20s → reps adicionales como parciales en posición estirada", reps: "10-12", extraReps: "+4-6 LP (15-20s)", sets: "1 extendida", rest: 17, rpe: "10", rir: 0, tut: "90-120s", load: "70-80% 1RM", tempo: "2-0-2", sequences: 3, microRest: [15, 20], intensifiers: ["Rest-Pause", "Lengthened Partials"] },
                { id: "RP-DEN", name: "Rest-Pause Densidad Progresiva", description: "Descanso intra-serie decreciente por mesociclo: 20s → 15s → 10s", reps: "10-12", extraReps: "+6-10 RP (progresivo)", sets: "1 extendida", rest: 15, rpe: "9-10", rir: 0, tut: "90-120s", load: "70-80% 1RM", tempo: "2-0-2", sequences: 3, microRest: [10, 15, 20], intensifiers: ["Rest-Pause"] },
                { id: "RP-CL", name: "Cluster Rest-Pause", description: "Series cluster (5 reps → 15s → 5 reps → 15s → 5 reps) para calidad de movimiento", reps: "5+5+5", sets: "1 cluster", rest: 15, rpe: "8-9", rir: 1, tut: "60-80s", load: "80-85% 1RM", tempo: "2-0-2", microRest: [15], intensifiers: ["Rest-Pause"] },
                { id: "RP-MYO", name: "Myo-Reps", description: "Set activación 12-15 reps → mini-sets 3-5 reps con 5-10s descanso", reps: "12-15", extraReps: "+3-5 x 4-5 (5-10s)", sets: "1 extendida", rest: 7, rpe: "9-10", rir: 0, tut: "60-90s", load: "65-75% 1RM", tempo: "2-0-2", microRest: [5, 10], intensifiers: ["Myo-Reps"] },
                { id: "RP-DS", name: "Rest-Pause + Drop + LP", description: "RP al fallo → drop 25% → Lengthened Partials finales", reps: "10+4 + LP", sets: "1 extendida", rest: 10, rpe: "10+", rir: 0, tut: "120-180s", load: "75%→55% 1RM", tempo: "2-0-2", dropPercent: "25%", intensifiers: ["Rest-Pause", "Drop Sets", "Lengthened Partials"] },
                { id: "RP-ECC", name: "Rest-Pause Excéntrico", description: "Reps post-pausa con excéntrica 4s en posición estirada", reps: "8-10", extraReps: "+4-6 RP (4s exc LP)", sets: "1 extendida", rest: 15, rpe: "10", rir: 0, tut: "100-130s", load: "70-75% 1RM", tempo: "2-0-4", microRest: [15], intensifiers: ["Rest-Pause", "Negativas", "Lengthened Partials"] }
            ],
            warmup: { set1: "30% x 15 reps", set2: "50% x 10 reps" },
            deload: { frequency: "Cada 4 semanas", duration: "1 semana", intensity: "50%, sin RP" }
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
                { id: "DUP-HY", name: "DUP Día Hipertrofia", description: "Alto volumen, moderada intensidad", reps: "8-12", sets: "3-4", rest: 90, rpe: "7-8", rir: 2, tut: "40-50s", load: "65-75% 1RM", tempo: "2-0-2", intensifiers: ["Tempo Controlado"] },
                { id: "DUP-ST", name: "DUP Día Fuerza", description: "Bajo volumen, alta intensidad", reps: "3-5", sets: "4-6", rest: 180, rpe: "9", rir: 1, tut: "15-25s", load: "85-90% 1RM", tempo: "1-1-1", intensifiers: ["Fuerza"] },
                { id: "DUP-PW", name: "DUP Día Potencia", description: "Velocidad explosiva", reps: "1-3", sets: "5-8", rest: 180, rpe: "8", rir: 0, tut: "5-10s", load: "70-80% 1RM", tempo: "X-0-1", intensifiers: ["Explosivo"] },
                { id: "DUP-EN", name: "DUP Día Resistencia", description: "Alto reps, bajo peso", reps: "15-20", sets: "2-3", rest: 60, rpe: "7-8", rir: 3, tut: "60-80s", load: "50-60% 1RM", tempo: "2-0-2", intensifiers: ["Pump Extremo"] }
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
                { id: "531-W1", name: "Semana 1 (5s)", description: "3 sets de 5 reps progresivos", reps: "5/5/5+", sets: "3", rest: 180, rpe: "7-8-9+", rir: 3, tut: "25-35s", load: "65/75/85% TM", tempo: "2-0-2", intensifiers: ["AMRAP último set"] },
                { id: "531-W2", name: "Semana 2 (3s)", description: "3 sets de 3 reps progresivos", reps: "3/3/3+", sets: "3", rest: 180, rpe: "8-9-10+", rir: 2, tut: "15-25s", load: "70/80/90% TM", tempo: "2-0-1", intensifiers: ["AMRAP último set"] },
                { id: "531-W3", name: "Semana 3 (5/3/1)", description: "5, 3, 1+ reps progresivos", reps: "5/3/1+", sets: "3", rest: 240, rpe: "8-9-10+", rir: 1, tut: "15-20s", load: "75/85/95% TM", tempo: "1-0-1", intensifiers: ["AMRAP último set"] },
                { id: "531-DL", name: "Deload", description: "Semana de recuperación", reps: "5/5/5", sets: "3", rest: 120, rpe: "5-6", rir: 4, tut: "25-35s", load: "40/50/60% TM", tempo: "2-0-2", intensifiers: [] },
                { id: "531-BBB", name: "Boring But Big", description: "5x10 accesorio post-main", reps: "10", sets: "5", rest: 90, rpe: "7-8", rir: 2, tut: "40-50s", load: "50-60% TM", tempo: "2-0-2", intensifiers: ["Alto Volumen"] }
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
        console.log('🔧 MethodologyEngine v3: Inicializando con 9 metodologías RPizadas');
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
            extraReps: prot.extraReps || null,
            rest: Array.isArray(prot.rest) ? prot.rest[0] : prot.rest,
            restArray: Array.isArray(prot.rest) ? prot.rest : [prot.rest],
            microRest: prot.microRest || null,
            restBreaths: prot.restBreaths || null,
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
