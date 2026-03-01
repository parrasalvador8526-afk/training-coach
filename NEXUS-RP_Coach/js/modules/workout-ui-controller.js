/**
 * NEXUS-RP Coach - Workout UI Controller
 * Controlador de UI para la sección ENTRENAR
 * 
 * Conecta la interfaz de usuario con los módulos:
 * - MethodologyEngine
 * - RoutineGenerator
 * - ActiveWorkout
 * - NEXUSBridge
 */

const WorkoutUIController = (() => {
    // Referencias a elementos del DOM
    let elements = {};

    // Mesocycle week → RIR mapping
    const MESOCYCLE_RIR_MAP = {
        1: { rir: 3, name: 'Acumulación', color: '#3B82F6', description: 'Volumen moderado, lejos del fallo' },
        2: { rir: 2, name: 'Progresión', color: '#F59E0B', description: 'Incremento progresivo de intensidad' },
        3: { rir: 1, name: 'Intensificación', color: '#EF4444', description: 'Alta intensidad, cerca del fallo' },
        4: { rir: 0, name: 'Peak', color: '#DC2626', description: 'Máxima intensidad, al fallo muscular' },
        5: { rir: 4, name: 'Deload', color: '#10B981', description: 'Descarga activa, recuperación' }
    };

    // Instrucciones técnicas de cada intensificador
    const INTENSIFIER_INSTRUCTIONS = {
        'Forced Reps': { icon: '💪', instruction: 'Al fallo → compañero asiste mínimamente 2-3 reps extra. Solo última serie.', level: 'advanced' },
        'Negativas': { icon: '⬇️', instruction: 'Fase excéntrica 4-6s con carga supramáxima (105-120% 1RM). Requiere asistencia.', level: 'advanced' },
        'Negativas Lentas': { icon: '⬇️', instruction: 'Fase excéntrica 4-6s controlada con carga normal. Sin asistencia requerida.', level: 'intermediate' },
        'Drop Sets': { icon: '🔻', instruction: 'Al fallo → reducir peso 20-30% → continuar sin descanso → repetir 2-3 veces.', level: 'intermediate' },
        'Superseries': { icon: '🔄', instruction: '2 ejercicios seguidos sin descanso (agonista-antagonista o mismo grupo).', level: 'intermediate' },
        'Giant Sets': { icon: '🔥', instruction: '3-4 ejercicios seguidos sin descanso para el mismo grupo muscular.', level: 'advanced' },
        'Rest-Pause': { icon: '⏸️', instruction: 'Al fallo → 10-15s descanso → continuar hasta fallo → repetir 2-4 mini-series.', level: 'intermediate' },
        'Rest-Pause Extendido': { icon: '⏸️', instruction: 'Serie extendida: fallo → 15-20s x4 pausas → acumular 12-20 reps extra.', level: 'advanced' },
        'Rest-Pause Progresivo': { icon: '⏸️', instruction: 'Pausas incrementales: 5s→10s→15s→20s→25s entre mini-series al fallo.', level: 'advanced' },
        'Rest-Pause Fijo': { icon: '⏸️', instruction: 'Fallo → 12s pausa fija → repetir 3-4 ciclos manteniendo peso.', level: 'intermediate' },
        'Rest-Pause DC': { icon: '⏸️', instruction: 'DoggCrapp: serie 11-15 reps → 10-15 resp → 4-6 reps → 10-15 resp → 2-3 reps.', level: 'advanced' },
        'Myo-Reps': { icon: '⚡', instruction: 'Serie activación 12-15 reps → 5s pausa → 3-5 reps x 4-5 mini-series.', level: 'intermediate' },
        'Parciales': { icon: '📐', instruction: 'Al fallo en rango completo → 4-6 reps en rango parcial (parte fuerte del movimiento).', level: 'advanced' },
        'Pump Extremo': { icon: '💥', instruction: 'Series de 8-12 reps con 30-45s descanso para máximo bombeo muscular.', level: 'beginner' },
        'Tempo Lento': { icon: '🐌', instruction: 'Fase concéntrica 4s, pausa 1s, excéntrica 2s. Mantener tensión constante.', level: 'beginner' },
        'Tempo Controlado': { icon: '⏱️', instruction: 'Tempo 3-2-3: controlar ambas fases con pausa isométrica de 2s.', level: 'beginner' },
        'Isométricos': { icon: '🧊', instruction: 'Pausa isométrica de 3-5s en punto de máxima contracción de cada rep.', level: 'intermediate' },
        'Shock Sets': { icon: '⚡', instruction: 'Serie continua: tempo variable (rápido→lento→rápido) sin descanso, 15-20 reps.', level: 'advanced' },
        'Pre-Agotamiento': { icon: '🎯', instruction: 'Aislamiento al fallo → sin descanso → compuesto pesado del mismo grupo.', level: 'advanced' },
        'Stretch Profundo': { icon: '🧘', instruction: 'Ejercicio con máximo estiramiento en posición baja. Pausa 2s en posición estirada.', level: 'beginner' },
        'Alto Volumen': { icon: '📊', instruction: 'Alto número de series (7-10) con descanso corto (30-45s) para máximo pump.', level: 'intermediate' },
        'Volumen Moderado': { icon: '📊', instruction: '6 series con descanso moderado. Balance entre intensidad y volumen.', level: 'beginner' },
        'Fuerza': { icon: '🏋️', instruction: 'Series de 5 reps pesadas con descanso largo (120s). Enfoque en carga máxima.', level: 'intermediate' },
        'Alto TUT': { icon: '⏱️', instruction: '10x12 con tempo 4-0-2. Altísimo tiempo bajo tensión acumulado.', level: 'intermediate' },
        'Flexible': { icon: '🔧', instruction: 'Adaptar series/reps al nivel de fatiga. Reducir si pump es bajo.', level: 'beginner' },
        'Explosivo': { icon: '💨', instruction: 'Fase concéntrica explosiva máxima (X tempo). Controlar excéntrica 1s.', level: 'intermediate' },
        'Fallo Múltiple': { icon: '🔥', instruction: 'Alcanzar fallo muscular múltiples veces con micro-pausas (5-25s).', level: 'advanced' },
        'Variación Contracción': { icon: '🔄', instruction: 'Alternar tipo de contracción: concéntrica→isométrica→excéntrica en la misma serie.', level: 'advanced' },
        'Tempo Variable': { icon: '🎵', instruction: 'Variar tempo dentro de la serie: 2 reps lentas → 2 reps normales → 2 lentas.', level: 'intermediate' },
        'Widowmaker': { icon: '💀', instruction: 'Una serie de 20 reps con tu peso de 10RM. Pausar respirando pero sin soltar barra.', level: 'advanced' },
        'Extreme Stretch': { icon: '🧘', instruction: 'Stretch estático de 60-90s con peso al final de la sesión. Dolor tolerable.', level: 'advanced' },
        'AMRAP último set': { icon: '🔥', instruction: 'Último set: máximas reps posibles (AMRAP). Registrar reps para progresión.', level: 'intermediate' }
    };

    // Protocol difficulty → level mapping for filtering
    const PROTOCOL_LEVEL_ASSIGNMENTS = {
        // Blood & Guts
        'BG-DY': 'intermediate', 'BG-DS': 'intermediate', 'BG-RP': 'intermediate',
        'BG-FR': 'advanced', 'BG-NEG': 'advanced', 'BG-PAR': 'advanced',
        // Heavy Duty
        'HD-SU': 'intermediate', 'HD-RP': 'intermediate',
        'HD-FR': 'advanced', 'HD-NEG': 'advanced', 'HD-PE': 'advanced', 'HD-SS': 'advanced',
        // Y3T
        'Y3T-MOD': 'beginner', 'Y3T-DL': 'beginner',
        'Y3T-W1': 'intermediate', 'Y3T-W2': 'intermediate', 'Y3T-W3': 'intermediate',
        'Y3T-INT': 'advanced',
        // MTUT
        'MTUT-VE': 'beginner', 'MTUT-ISO': 'beginner',
        'MTUT-TCE': 'intermediate', 'MTUT-TEE': 'intermediate', 'MTUT-SS': 'intermediate',
        'MTUT-SH': 'advanced',
        // SST
        'SST-TM': 'beginner',
        'SST-CT': 'intermediate', 'SST-RT': 'intermediate', 'SST-ISOM': 'intermediate',
        'SST-RIV': 'advanced', 'SST-NEG': 'advanced',
        // FST-7
        'FST7-HY': 'beginner', 'FST7-ST': 'beginner',
        'FST7-CL': 'intermediate', 'FST7-DL': 'intermediate',
        'FST7-BN': 'advanced',
        // Rest-Pause
        'RP-MYO': 'intermediate', 'RP-RC': 'intermediate',
        'RP-EXT': 'advanced', 'RP-DS': 'advanced', 'RP-NEG': 'advanced', 'RP-ISO': 'advanced',
        // DC Training
        'DC-RP': 'intermediate', 'DC-STR': 'intermediate',
        'DC-WM': 'advanced',
        // GVT
        'GVT-10x10': 'intermediate',
        // DUP
        'DUP-HYP': 'beginner',
        'DUP-STR': 'intermediate', 'DUP-POW': 'advanced',
        // 5/3/1
        '531-BBB': 'beginner', '531-W1': 'beginner',
        '531-W2': 'intermediate',
        '531-W3': 'advanced'
    };

    /**
     * Distribución de protocolos por semana del mesociclo.
     * S1 (Acumulación): protocolo base / fácil
     * S2 (Progresión): protocolo intermedio bajo
     * S3 (Intensificación): protocolo intermedio alto
     * S4 (Peak): protocolo intenso
     * S5 (Deload): protocolo base sin intensificador o recuperación
     */
    const MESOCYCLE_PROTOCOL_MAP = {
        'BloodAndGuts': {
            advanced: { 1: 'BG-DY', 2: 'BG-DS', 3: 'BG-RP', 4: 'BG-FR', 5: 'BG-DY' },
            intermediate: { 1: 'BG-DY', 2: 'BG-DS', 3: 'BG-RP', 4: 'BG-DS', 5: 'BG-DY' },
            beginner: { 1: 'BG-DY', 2: 'BG-DY', 3: 'BG-DY', 4: 'BG-DY', 5: 'BG-DY' }
        },
        'HeavyDuty': {
            advanced: { 1: 'HD-SU', 2: 'HD-SS', 3: 'HD-PE', 4: 'HD-FR', 5: 'HD-SU' },
            intermediate: { 1: 'HD-SU', 2: 'HD-SS', 3: 'HD-RP', 4: 'HD-RP', 5: 'HD-SU' },
            beginner: { 1: 'HD-SU', 2: 'HD-SU', 3: 'HD-SU', 4: 'HD-SU', 5: 'HD-SU' }
        },
        'Y3T': {
            advanced: { 1: 'Y3T-W1', 2: 'Y3T-W2', 3: 'Y3T-W3', 4: 'Y3T-INT', 5: 'Y3T-DL' },
            intermediate: { 1: 'Y3T-MOD', 2: 'Y3T-W1', 3: 'Y3T-W2', 4: 'Y3T-W3', 5: 'Y3T-DL' },
            beginner: { 1: 'Y3T-MOD', 2: 'Y3T-MOD', 3: 'Y3T-W1', 4: 'Y3T-W2', 5: 'Y3T-DL' }
        },
        'MTUT': {
            advanced: { 1: 'MTUT-TCE', 2: 'MTUT-TEE', 3: 'MTUT-SS', 4: 'MTUT-SH', 5: 'MTUT-VE' },
            intermediate: { 1: 'MTUT-VE', 2: 'MTUT-TCE', 3: 'MTUT-TEE', 4: 'MTUT-SS', 5: 'MTUT-VE' },
            beginner: { 1: 'MTUT-VE', 2: 'MTUT-VE', 3: 'MTUT-ISO', 4: 'MTUT-ISO', 5: 'MTUT-VE' }
        },
        'SST': {
            advanced: { 1: 'SST-ISOM', 2: 'SST-CT', 3: 'SST-RT', 4: 'SST-RIV', 5: 'SST-TM' },
            intermediate: { 1: 'SST-TM', 2: 'SST-ISOM', 3: 'SST-CT', 4: 'SST-RT', 5: 'SST-TM' },
            beginner: { 1: 'SST-TM', 2: 'SST-TM', 3: 'SST-TM', 4: 'SST-TM', 5: 'SST-TM' }
        },
        'FST7': {
            advanced: { 1: 'FST7-ST', 2: 'FST7-CL', 3: 'FST7-BN', 4: 'FST7-DL', 5: 'FST7-HY' },
            intermediate: { 1: 'FST7-HY', 2: 'FST7-ST', 3: 'FST7-CL', 4: 'FST7-CL', 5: 'FST7-HY' },
            beginner: { 1: 'FST7-HY', 2: 'FST7-HY', 3: 'FST7-ST', 4: 'FST7-ST', 5: 'FST7-HY' }
        },
        'RestPause': {
            advanced: { 1: 'RP-RC', 2: 'RP-DS', 3: 'RP-EXT', 4: 'RP-ISO', 5: 'RP-MYO' },
            intermediate: { 1: 'RP-MYO', 2: 'RP-RC', 3: 'RP-RC', 4: 'RP-RC', 5: 'RP-MYO' },
            beginner: { 1: 'RP-MYO', 2: 'RP-MYO', 3: 'RP-MYO', 4: 'RP-MYO', 5: 'RP-MYO' }
        },
        'DCTraining': {
            advanced: { 1: 'DC-RP', 2: 'DC-STR', 3: 'DC-RP', 4: 'DC-WM', 5: 'DC-STR' },
            intermediate: { 1: 'DC-RP', 2: 'DC-RP', 3: 'DC-STR', 4: 'DC-RP', 5: 'DC-STR' },
            beginner: { 1: 'DC-RP', 2: 'DC-RP', 3: 'DC-RP', 4: 'DC-RP', 5: 'DC-STR' }
        },
        'GVT': {
            advanced: { 1: 'GVT-10x10', 2: 'GVT-10x10', 3: 'GVT-10x10', 4: 'GVT-10x10', 5: 'GVT-10x10' },
            intermediate: { 1: 'GVT-10x10', 2: 'GVT-10x10', 3: 'GVT-10x10', 4: 'GVT-10x10', 5: 'GVT-10x10' },
            beginner: { 1: 'GVT-10x10', 2: 'GVT-10x10', 3: 'GVT-10x10', 4: 'GVT-10x10', 5: 'GVT-10x10' }
        },
        'DUP': {
            advanced: { 1: 'DUP-HYP', 2: 'DUP-STR', 3: 'DUP-POW', 4: 'DUP-STR', 5: 'DUP-HYP' },
            intermediate: { 1: 'DUP-HYP', 2: 'DUP-HYP', 3: 'DUP-STR', 4: 'DUP-POW', 5: 'DUP-HYP' },
            beginner: { 1: 'DUP-HYP', 2: 'DUP-HYP', 3: 'DUP-HYP', 4: 'DUP-HYP', 5: 'DUP-HYP' }
        },
        '531': {
            advanced: { 1: '531-W1', 2: '531-W2', 3: '531-W3', 4: '531-W3', 5: '531-BBB' },
            intermediate: { 1: '531-BBB', 2: '531-W1', 3: '531-W2', 4: '531-W3', 5: '531-BBB' },
            beginner: { 1: '531-BBB', 2: '531-W1', 3: '531-W1', 4: '531-W2', 5: '531-BBB' }
        }
    };

    /**
     * Obtiene el protocolo asignado para una semana específica del mesociclo
     */
    function getProtocolForWeek(methodologyId, level, week) {
        const methMap = MESOCYCLE_PROTOCOL_MAP[methodologyId];
        if (!methMap) return null;
        const levelMap = methMap[level] || methMap['intermediate'];
        if (!levelMap) return null;
        return levelMap[week] || null;
    }

    /**
     * Inicializa el controlador
     */
    function init() {
        console.log('🎮 WorkoutUIController: Inicializando...');

        // Cachear elementos del DOM
        cacheElements();

        // Configurar event listeners
        setupEventListeners();

        // Inicializar vista
        updateMethodologyPreview();
        updateUIState();

        // Escuchar cambios de metodología
        window.addEventListener('methodologyChange', handleMethodologyChange);
        window.addEventListener('protocolChange', handleProtocolChange);

        console.log('✅ WorkoutUIController: Listo');
    }

    /**
     * Cachea referencias a elementos del DOM
     */
    function cacheElements() {
        elements = {
            // Estados
            noRoutineState: document.getElementById('no-routine-state'),
            activeWorkoutState: document.getElementById('active-workout-state'),

            // Preview de metodología
            previewName: document.getElementById('preview-methodology-name'),
            previewParams: document.getElementById('preview-methodology-params'),

            // Botones principales
            btnCreateRoutine: document.getElementById('btn-create-routine'),
            btnImportNexus: document.getElementById('btn-import-nexus'),
            btnStartWorkout: document.getElementById('btn-start-workout'),

            // Modal crear rutina
            createModal: document.getElementById('create-routine-modal'),
            btnCloseModal: document.getElementById('btn-close-modal'),
            btnCancelRoutine: document.getElementById('btn-cancel-routine'),
            btnGenerateRoutine: document.getElementById('btn-generate-routine'),

            // Selectores del modal
            methodologySelect: document.getElementById('routine-methodology'),
            protocolSelect: document.getElementById('routine-protocol'),
            splitSelect: document.getElementById('routine-split'),
            mesocycleWeekSelect: document.getElementById('routine-mesocycle-week'),
            levelSelect: document.getElementById('routine-level'),
            protocolDescription: document.getElementById('protocol-description'),
            summaryText: document.getElementById('summary-text'),

            // Entrenamiento activo
            currentExerciseName: document.getElementById('current-exercise-name'),
            exerciseProgress: document.getElementById('exercise-progress'),
            setProgress: document.getElementById('set-progress'),
            targetRir: document.getElementById('target-rir'),
            suggestionText: document.getElementById('suggestion-text'),
            workoutWeight: document.getElementById('workout-weight'),
            workoutReps: document.getElementById('workout-reps'),
            workoutRpe: document.getElementById('workout-rpe'),
            workoutRpeValue: document.getElementById('workout-rpe-value'),
            btnCompleteSet: document.getElementById('btn-complete-set'),
            setFeedback: document.getElementById('set-feedback'),
            feedbackIcon: document.getElementById('feedback-icon'),
            feedbackMessage: document.getElementById('feedback-message'),
            feedbackSuggestion: document.getElementById('feedback-suggestion'),
            workoutTimer: document.getElementById('workout-timer'),
            timerCountdown: document.getElementById('timer-countdown'),
            btnSkipTimer: document.getElementById('btn-skip-timer'),
            completedSetsList: document.getElementById('completed-sets-list'),

            // Feedback ejercicio
            exerciseFeedbackModal: document.getElementById('exercise-feedback-modal'),
            feedbackPump: document.getElementById('feedback-pump'),
            feedbackJoints: document.getElementById('feedback-joints'),
            btnSubmitFeedback: document.getElementById('btn-submit-feedback')
        };
    }

    /**
     * Configura event listeners
     */
    function setupEventListeners() {
        // Botón Crear Rutina
        if (elements.btnCreateRoutine) {
            elements.btnCreateRoutine.addEventListener('click', showCreateModal);
        }

        // Botón Importar desde NEXUS
        if (elements.btnImportNexus) {
            elements.btnImportNexus.addEventListener('click', importFromNEXUS);
        }

        // Botón Cerrar Modal
        if (elements.btnCloseModal) {
            elements.btnCloseModal.addEventListener('click', hideCreateModal);
        }

        // Botón Cancelar Rutina
        if (elements.btnCancelRoutine) {
            elements.btnCancelRoutine.addEventListener('click', hideCreateModal);
        }

        // Selector de Metodología en modal
        if (elements.methodologySelect) {
            elements.methodologySelect.addEventListener('change', handleModalMethodologyChange);
        }

        // Selector de Protocolo en modal
        if (elements.protocolSelect) {
            elements.protocolSelect.addEventListener('change', handleModalProtocolChange);
        }

        // Selector de Semana del Mesociclo
        if (elements.mesocycleWeekSelect) {
            elements.mesocycleWeekSelect.addEventListener('change', handleModalProtocolChange);
        }

        // Selector de Nivel — reevaluar compatibilidad y descripción
        if (elements.levelSelect) {
            elements.levelSelect.addEventListener('change', handleModalMethodologyChange);
        }

        // Botón Generar Rutina
        if (elements.btnGenerateRoutine) {
            elements.btnGenerateRoutine.addEventListener('click', generateRoutine);
        }

        // Botón Iniciar Entrenamiento
        if (elements.btnStartWorkout) {
            elements.btnStartWorkout.addEventListener('click', startWorkout);
        }

        // RPE Slider
        if (elements.workoutRpe) {
            elements.workoutRpe.addEventListener('input', () => {
                if (elements.workoutRpeValue) {
                    elements.workoutRpeValue.textContent = elements.workoutRpe.value;
                }
            });
        }

        // Botón Completar Set
        if (elements.btnCompleteSet) {
            elements.btnCompleteSet.addEventListener('click', completeSet);
        }

        // Botón Saltar Timer
        if (elements.btnSkipTimer) {
            elements.btnSkipTimer.addEventListener('click', skipTimer);
        }

        // Botón Enviar Feedback
        if (elements.btnSubmitFeedback) {
            elements.btnSubmitFeedback.addEventListener('click', submitFeedbackAndNext);
        }
    }

    /**
     * Actualiza preview de metodología en la pantalla principal
     */
    function updateMethodologyPreview() {
        if (!window.MethodologyEngine) return;

        const params = MethodologyEngine.getCurrentParameters();

        if (elements.previewName) {
            elements.previewName.textContent = `${params.methodology} - ${params.protocol}`;
        }

        if (elements.previewParams) {
            elements.previewParams.textContent =
                `Sets: ${params.sets} | Reps: ${params.reps} | Descanso: ${params.rest}s | RIR: ${params.rir}`;
        }
    }

    /**
     * Muestra el modal de crear rutina
     */
    function showCreateModal() {
        if (elements.createModal) {
            elements.createModal.classList.remove('hidden');
            elements.noRoutineState.classList.add('hidden');

            // Actualizar protocolos según metodología seleccionada
            handleModalMethodologyChange();
        }
    }

    /**
     * Oculta el modal de crear rutina
     */
    function hideCreateModal() {
        if (elements.createModal) {
            elements.createModal.classList.add('hidden');
            elements.noRoutineState.classList.remove('hidden');
        }
    }

    /**
     * Calcula la dificultad de un protocolo (0-100) para ordenar de fácil a difícil
     */
    function getProtocolDifficulty(protocol) {
        let score = 0;
        // RIR bajo = más difícil
        const rir = protocol.rir ?? 2;
        score += (4 - Math.max(rir, -2)) * 10; // RIR -2 → 60, RIR 0 → 40, RIR 2 → 20, RIR 4 → 0
        // Más intensificadores = más difícil
        score += (protocol.intensifiers?.length || 0) * 8;
        // Extra reps = más difícil
        if (protocol.extraReps) score += 12;
        // RPE alto = más difícil
        const rpe = parseFloat(String(protocol.rpe || '7').replace('+', '')) || 7;
        score += (rpe - 5) * 3;
        // Menos descanso = más difícil (para protocolos de estrés metabólico)
        const rest = Array.isArray(protocol.rest) ? protocol.rest[0] : (protocol.rest || 90);
        if (rest < 30) score += 8;
        else if (rest < 60) score += 4;
        return score;
    }

    /**
     * Determina el nivel de dificultad de un protocolo para filtrar por nivel
     * Returns: 'beginner' | 'intermediate' | 'advanced'
     */
    function getProtocolLevel(protocol) {
        const difficulty = getProtocolDifficulty(protocol);
        if (difficulty <= 25) return 'beginner';
        if (difficulty <= 50) return 'intermediate';
        return 'advanced';
    }

    /**
     * Maneja cambio de metodología en el modal
     */
    function handleModalMethodologyChange() {
        const methodologyId = elements.methodologySelect?.value;
        if (!methodologyId || !window.MethodologyEngine) return;

        const methodologies = MethodologyEngine.EMBEDDED_METHODOLOGIES;
        const methodology = methodologies[methodologyId];
        if (!methodology || !elements.protocolSelect) return;

        const currentLevel = elements.levelSelect?.value || 'intermediate';
        const levelMap = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };
        const userLevelEs = levelMap[currentLevel];

        // Level order for sorting: beginner < intermediate < advanced
        const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };

        // Sort protocols by assigned level (easiest first)
        const sortedProtocols = [...methodology.protocols].sort((a, b) => {
            const aLevel = PROTOCOL_LEVEL_ASSIGNMENTS[a.id] || 'intermediate';
            const bLevel = PROTOCOL_LEVEL_ASSIGNMENTS[b.id] || 'intermediate';
            return levelOrder[aLevel] - levelOrder[bLevel];
        });

        // Icons per level
        const difficultyIcons = { beginner: '🟢', intermediate: '🟡', advanced: '🔴' };

        // Filter protocols by user level:
        // Beginner: only beginner protocols
        // Intermediate: beginner + intermediate protocols
        // Advanced: all protocols
        const filteredProtocols = sortedProtocols.filter(p => {
            const pLevel = PROTOCOL_LEVEL_ASSIGNMENTS[p.id] || 'intermediate';
            if (currentLevel === 'beginner') return pLevel === 'beginner';
            if (currentLevel === 'intermediate') return pLevel === 'beginner' || pLevel === 'intermediate';
            return true; // advanced sees all
        });

        // If no protocols match, fallback to showing all (shouldn't happen normally)
        const displayProtocols = filteredProtocols.length > 0 ? filteredProtocols : sortedProtocols;

        // Build protocol options with level indicators
        elements.protocolSelect.innerHTML = displayProtocols.map(p => {
            const pLevel = PROTOCOL_LEVEL_ASSIGNMENTS[p.id] || 'intermediate';
            const icon = difficultyIcons[pLevel];
            const details = [];
            details.push(p.reps);
            if (p.sets) details.push(`${p.sets} sets`);
            if (p.intensifiers?.length > 0) details.push(p.intensifiers.join(', '));
            if (p.extraReps) details.push(p.extraReps);

            return `<option value="${p.id}">${icon} ${p.name} (${details.join(' · ')})</option>`;
        }).join('');

        // Level compatibility warning
        if (methodology.level && !methodology.level.includes(userLevelEs)) {
            if (elements.protocolDescription) {
                elements.protocolDescription.innerHTML =
                    `⚠️ <strong style="color: #F59E0B;">Nota:</strong> ${methodology.name} está diseñada para nivel <strong>${methodology.level.join('/')}</strong>. ` +
                    `Se adaptará automáticamente a tu nivel (${userLevelEs}).`;
            }
        }

        // Auto-select: pick the first protocol that matches user's exact level, else first available
        const appropriateProtocol = displayProtocols.find(p => {
            const pLevel = PROTOCOL_LEVEL_ASSIGNMENTS[p.id] || 'intermediate';
            return pLevel === currentLevel;
        }) || displayProtocols[0];

        if (appropriateProtocol && elements.protocolSelect) {
            elements.protocolSelect.value = appropriateProtocol.id;
        }

        handleModalProtocolChange();
    }

    /**
     * Maneja cambio de protocolo en el modal
     */
    function handleModalProtocolChange() {
        const methodologyId = elements.methodologySelect?.value;
        const protocolId = elements.protocolSelect?.value;

        if (!methodologyId || !window.MethodologyEngine) return;

        const methodologies = MethodologyEngine.EMBEDDED_METHODOLOGIES;
        const methodology = methodologies[methodologyId];

        if (!methodology) return;

        const protocol = methodology.protocols.find(p => p.id === protocolId) || methodology.protocols[0];

        if (!protocol) return;

        // Actualizar descripción con detalles completos del protocolo
        if (elements.protocolDescription) {
            const restText = Array.isArray(protocol.rest)
                ? protocol.rest.join('→') + 's'
                : protocol.rest + 's';
            const extras = [];
            if (protocol.tempo) extras.push(`Tempo: ${protocol.tempo}`);
            if (protocol.load) extras.push(`Carga: ${protocol.load}`);
            if (protocol.tut) extras.push(`TUT: ${protocol.tut}`);
            if (protocol.extraReps) extras.push(protocol.extraReps);
            if (protocol.intensifiers?.length > 0) extras.push(`💪 ${protocol.intensifiers.join(', ')}`);

            const extrasText = extras.length > 0 ? `\n${extras.join(' | ')}` : '';
            elements.protocolDescription.innerHTML =
                `📋 <strong>${protocol.name}</strong>: ${protocol.description || ''}<br>` +
                `<span style="font-size: 0.8rem;">Reps: ${protocol.reps}${protocol.extraReps ? ' ' + protocol.extraReps : ''} · Sets: ${protocol.sets} · Rest: ${restText} · RIR: ${protocol.rir ?? 2}` +
                `${protocol.tempo ? ' · Tempo: ' + protocol.tempo : ''}` +
                `${protocol.load ? ' · Carga: ' + protocol.load : ''}` +
                `${protocol.intensifiers?.length > 0 ? '<br>💪 ' + protocol.intensifiers.join(', ') : ''}</span>`;
        }

        // Actualizar resumen con RIR ajustado por mesociclo
        if (elements.summaryText) {
            const restValue = Array.isArray(protocol.rest) ? protocol.rest[0] : protocol.rest;
            const mesocycleWeek = parseInt(elements.mesocycleWeekSelect?.value) || 1;
            const mesocycleRIR = MESOCYCLE_RIR_MAP[mesocycleWeek]?.rir ?? protocol.rir;
            const mesocycleName = MESOCYCLE_RIR_MAP[mesocycleWeek]?.name || '';
            elements.summaryText.textContent =
                `Sets: ${protocol.sets} | Reps: ${protocol.reps} | RIR: ${mesocycleRIR} (${mesocycleName}) | Descanso: ${restValue}s`;
        }
    }

    /**
     * Genera la rutina con los parámetros seleccionados
     */
    function generateRoutine() {
        const methodology = elements.methodologySelect?.value || 'Y3T';
        const split = elements.splitSelect?.value || 'push_pull_legs';
        const level = elements.levelSelect?.value || 'intermediate';
        const mesocycleWeek = parseInt(elements.mesocycleWeekSelect?.value) || 1;

        // Obtener el protocolo de ESTA semana según la distribución del mesociclo
        const weekProtocolId = getProtocolForWeek(methodology, level, mesocycleWeek);
        const protocol = weekProtocolId || elements.protocolSelect?.value;

        console.log('🔨 Generando rutina:', { methodology, protocol, split, level, mesocycleWeek });

        // Generar rutina con el protocolo de esta semana
        let routine;
        if (window.RoutineGenerator && typeof RoutineGenerator.createRoutine === 'function') {
            routine = RoutineGenerator.createRoutine({ methodology, protocol, split, level });
        }
        if (!routine) {
            routine = createBasicRoutine(methodology, protocol, split, level);
        }

        console.log('✅ Rutina generada:', routine);

        // Apply mesocycle week adaptation to parameters
        const mesocycleData = MESOCYCLE_RIR_MAP[mesocycleWeek];
        if (routine.parameters) {
            routine.parameters = adaptParamsToMesocycle(routine.parameters, mesocycleWeek);
        }
        routine.mesocycleWeek = mesocycleWeek;
        routine.mesocycleName = mesocycleData.name;

        // Update exercises with mesocycle-adapted parameters + protocol intensifiers
        if (routine.days) {
            routine.days.forEach(day => {
                day.exercises?.forEach(ex => {
                    ex.targetRIR = routine.parameters.rir;
                    ex.targetReps = routine.parameters.reps || ex.targetReps;

                    // IMPORTANTE: Modulamos el volumen base usando baseSets (ancla inmutable).
                    // Evita acumulación cíclica y sobreescrituras en cambios de semana S1-S5
                    ex.baseSets = ex.baseSets || ex.sets || 3; // Fallback
                    const isMassiveStatic = ex.baseSets >= 7;
                    if (!isMassiveStatic) {
                        if (mesocycleWeek === 2 && ex.isPrimary) {
                            ex.sets = ex.baseSets + 1;
                        } else if (mesocycleWeek === 3) {
                            ex.sets = ex.baseSets + 1;
                        } else if (mesocycleWeek === 4) {
                            ex.sets = ex.isPrimary ? ex.baseSets + 2 : ex.baseSets + 1; // Peak MRV
                        } else if (mesocycleWeek === 5) {
                            ex.sets = Math.max(Math.floor(ex.baseSets * 0.5), 1); // Deload
                        } else {
                            ex.sets = ex.baseSets; // Week 1 u otro
                        }
                    } else if (mesocycleWeek === 5) {
                        ex.sets = Math.max(Math.floor(ex.baseSets * 0.5), 1);
                    } else {
                        ex.sets = ex.baseSets;
                    }

                    ex.load = routine.parameters.load || ex.load;
                    ex.tempo = routine.parameters.tempo || ex.tempo;
                    ex.restSeconds = Array.isArray(routine.parameters.rest) ? routine.parameters.rest[0] : (routine.parameters.rest || ex.restSeconds);
                    ex.intensifiers = [...(routine.parameters.intensifiers || [])];
                    ex.extraReps = ex.isPrimary ? (routine.parameters.extraReps || null) : null;
                });
            });
        }

        // Re-save active routine with mesocycle data
        localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));

        // Guardar también para la sección RUTINA
        const routineForDisplay = {
            methodology: routine.methodologyName || methodology,
            protocol: routine.protocolName || protocol,
            protocolDescription: routine.protocolDescription || '',
            split: getSplitDisplayName(split),
            level: getLevelDisplayName(level),
            sets: routine.parameters?.sets || '3-4',
            reps: routine.parameters?.reps || '8-12',
            rir: routine.parameters?.rir,
            rest: routine.parameters?.rest || 90,
            tempo: routine.parameters?.tempo || null,
            load: routine.parameters?.load || null,
            tut: routine.parameters?.tut || null,
            extraReps: routine.parameters?.extraReps || null,
            intensifiers: routine.parameters?.intensifiers?.join(', ') || 'Ninguno',
            mesocycleWeek: mesocycleWeek,
            mesocycleName: mesocycleData.name,
            levelNote: routine.parameters?.levelNote || '',
            mesocycleNote: routine.parameters?.mesocycleNote || ''
        };
        localStorage.setItem('rpCoach_currentRoutine', JSON.stringify(routineForDisplay));

        // Ocultar wizard, mostrar estado listo para entrenar
        const wizardSection = document.getElementById('routine-wizard-section');
        if (wizardSection) {
            wizardSection.classList.add('hidden');
        }

        // Mostrar estado listo para entrenar
        showReadyToTrainState(routine);

        // Ya no cambiamos a feedback automáticamente, nos quedamos en Entrenamiento

        // Notificar éxito
        showNotification('¡Rutina generada con éxito!', 'success');
    }

    /**
     * Obtiene nombre legible del split
     */
    function getSplitDisplayName(split) {
        const names = {
            push_pull_legs: 'Push/Pull/Legs (6 días)',
            upper_lower: 'Upper/Lower (4 días)',
            bro_split: 'Bro Split (5 días)',
            hit_3day: 'HIT 3 Días',
            full_body: 'Full Body (3 días)'
        };
        return names[split] || split;
    }

    /**
     * Obtiene nombre legible del nivel
     */
    function getLevelDisplayName(level) {
        const names = {
            beginner: 'Principiante',
            intermediate: 'Intermedio',
            advanced: 'Avanzado'
        };
        return names[level] || level;
    }

    /**
     * Adapta los parámetros del protocolo según nivel de experiencia.
     * Mantiene SOLO los intensificadores del protocolo seleccionado.
     * El filtro por mesociclo se aplica después.
     */
    function adaptParamsToLevel(params, level, methodologyType) {
        const adapted = { ...params, intensifiers: [...(params.intensifiers || [])] };
        const baseSets = parseInt(params.sets) || 3;

        // Los intensificadores SON el protocolo (definen cómo hacer la serie).
        // El nivel filtra qué PROTOCOLOS puede ver el usuario (paso 2→3 del wizard),
        // por eso aquí NO se filtran intensificadores — ya vienen del protocolo correcto.
        // Solo se ajustan los parámetros numéricos.

        if (level === 'beginner') {
            if (methodologyType === 'HIT') {
                adapted.sets = String(Math.max(baseSets, 2));
                adapted.rir = Math.max((params.rir ?? 0) + 3, 3);
                adapted.load = adjustLoad(params.load, -15);
                adapted.rest = increaseRest(params.rest, 30);
            } else {
                adapted.sets = String(Math.max(baseSets - 1, 2));
                adapted.rir = Math.min((params.rir ?? 2) + 1, 4);
                adapted.load = adjustLoad(params.load, -10);
            }
            adapted.rpe = adjustRPE(params.rpe, -1.5);
            adapted.extraReps = null;
            adapted.levelNote = '🟢 Principiante: volumen reducido, RIR alto';

        } else if (level === 'intermediate') {
            if (adapted.extraReps && (adapted.extraReps.includes('Forced') || adapted.extraReps.includes('Neg'))) {
                adapted.extraReps = null;
            }
            adapted.levelNote = '🟡 Intermedio: parámetros estándar';

        } else { // advanced
            adapted.sets = String(baseSets + (methodologyType === 'HIT' ? 0 : 1));
            adapted.rir = Math.max((params.rir ?? 2) - 1, -2);
            adapted.rpe = adjustRPE(params.rpe, +0.5);
            adapted.load = adjustLoad(params.load, +5);
            adapted.levelNote = '🔴 Avanzado: volumen alto, protocolo completo';
        }

        return adapted;
    }

    /**
     * Incrementa tiempo de descanso
     */
    function increaseRest(rest, addSeconds) {
        if (Array.isArray(rest)) return rest.map(r => r + addSeconds);
        if (typeof rest === 'number') return rest + addSeconds;
        return rest;
    }

    /**
     * Adapta los parámetros según semana del mesociclo.
     * El intensificador es parte del protocolo (define CÓMO haces la serie),
     * por lo que se mantiene en S1-S4. Solo en S5 (Deload) se quita.
     * Lo que cambia por semana son los parámetros numéricos: sets, RIR, carga, extraReps.
     */
    function adaptParamsToMesocycle(params, mesocycleWeek) {
        const adapted = { ...params, intensifiers: [...(params.intensifiers || [])] };
        const baseSets = parseInt(params.sets) || 3;

        switch (mesocycleWeek) {
            case 1: // Acumulación - protocolo con parámetros conservadores
                adapted.rir = 3;
                adapted.load = adjustLoad(params.load, -5, params.reps);
                adapted.extraReps = null; // Sin reps extra en acumulación
                adapted.mesocycleNote = 'Acumulación: volumen base, carga moderada';
                break;
            case 2: // Progresión - subir volumen
                adapted.sets = String(baseSets + 1);
                adapted.rir = 2;
                adapted.mesocycleNote = 'Progresión: +1 serie, carga estándar';
                break;
            case 3: // Intensificación - subir carga y volumen
                adapted.rir = 1;
                adapted.load = adjustLoad(params.load, +5, params.reps);
                adapted.sets = String(baseSets + 2);
                adapted.mesocycleNote = 'Intensificación: carga elevada, cerca del fallo';
                break;
            case 4: // Peak / MRV - máxima intensidad y volumen
                adapted.rir = 0;
                adapted.load = adjustLoad(params.load, +10, params.reps);
                adapted.sets = String(baseSets + 3);
                adapted.mesocycleNote = 'Peak (MRV): máximo esfuerzo y tolerancia de volumen';
                break;
            case 5: // Deload - recuperación, sin intensificadores
                adapted.sets = String(Math.max(Math.floor(baseSets * 0.5), 1));
                adapted.rir = 4;
                adapted.load = adjustLoad(params.load, -20, params.reps);
                adapted.intensifiers = []; // Solo en deload se quitan
                adapted.extraReps = null;
                adapted.mesocycleNote = 'Deload: 50% volumen, sin intensificadores';
                break;
        }

        return adapted;
    }

    /**
     * Ajusta RPE string (+/- delta)
     */
    function adjustRPE(rpeStr, delta) {
        if (!rpeStr) return rpeStr;
        const match = rpeStr.match(/(\d+(?:\.\d+)?)/);
        if (match) {
            const val = Math.min(10, Math.max(5, parseFloat(match[1]) + delta));
            return String(val);
        }
        return rpeStr;
    }

    /**
     * Ajusta carga % string (+/- delta porcentual) con límite fisiológico
     */
    function adjustLoad(loadStr, deltaPercent, repsStr = null) {
        if (!loadStr) return loadStr;

        let maxLoadAllowed = 100; // Por defecto
        if (repsStr) {
            const matchReps = repsStr.match(/(\d+)/g);
            if (matchReps && matchReps.length > 0) {
                const maxReps = Math.max(...matchReps.map(Number));
                if (maxReps >= 20) maxLoadAllowed = 60;
                else if (maxReps >= 15) maxLoadAllowed = 65;
                else if (maxReps >= 10) maxLoadAllowed = 75;
                else if (maxReps >= 8) maxLoadAllowed = 80;
                else if (maxReps >= 6) maxLoadAllowed = 85;
            }
        }

        const match = loadStr.match(/(\d+)-(\d+)% 1RM/);
        if (match) {
            // Evitamos que los topes bajen el porcentaje si la base era ya alta, pero limitamos el pico inflado
            const baseLow = parseInt(match[1]);
            const baseHigh = parseInt(match[2]);

            // Si delta suma, aplicamos techo. Si resta, lo dejamos bajar nomás.
            let low = Math.max(30, baseLow + deltaPercent);
            let high = Math.max(30, baseHigh + deltaPercent);

            if (deltaPercent > 0) {
                low = Math.min(low, Math.max(baseLow, maxLoadAllowed - 5));
                high = Math.min(high, Math.max(baseHigh, maxLoadAllowed));
            }
            return `${low}-${high}% 1RM`;
        }
        return loadStr;
    }

    /**
     * Crea una rutina con adaptación por nivel y mesociclo
     */
    function createBasicRoutine(methodology, protocol, split, level) {
        const methodologies = window.MethodologyEngine?.EMBEDDED_METHODOLOGIES || {};
        const meth = methodologies[methodology] || {};
        const prot = meth.protocols?.find(p => p.id === protocol) || meth.protocols?.[0] || {};

        // 1. Obtener parámetros base del protocolo
        let params = {
            sets: prot.sets || '3-4',
            reps: prot.reps || '8-12',
            extraReps: prot.extraReps || null,
            rest: prot.rest || 90,
            rir: prot.rir !== undefined ? prot.rir : 2,
            rpe: prot.rpe || '7-8',
            tempo: prot.tempo || null,
            load: prot.load || null,
            tut: prot.tut || null,
            intensifiers: [...(prot.intensifiers || [])],
            microRest: prot.microRest || null,
            restBreaths: prot.restBreaths || null,
            sequences: prot.sequences || null
        };

        // 2. Adaptar por nivel de experiencia
        params = adaptParamsToLevel(params, level, meth.type);

        // 3. Adaptar por semana del mesociclo (se aplicará después en generateRoutine)
        // No se aplica aquí porque generateRoutine ya maneja mesocycleWeek

        const routine = {
            id: 'routine_' + Date.now(),
            methodology,
            methodologyName: meth.name || methodology,
            methodologyType: meth.type || 'VOLUME',
            protocolId: prot.id || protocol,
            protocolName: prot.name || protocol,
            protocolDescription: prot.description || '',
            protocol,
            split,
            level,
            createdAt: new Date().toISOString(),
            parameters: params,
            days: generateDaysForSplit(split, methodology, prot, level, params)
        };

        // Guardar en localStorage
        localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));

        return routine;
    }

    /**
     * Genera días según el split seleccionado
     */
    function generateDaysForSplit(split, methodology, protocol, level, adaptedParams) {
        const splits = {
            push_pull_legs: [
                { name: 'Push', muscles: ['Pecho', 'Hombros', 'Tríceps'] },
                { name: 'Pull', muscles: ['Espalda', 'Bíceps'] },
                { name: 'Legs', muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'] },
                { name: 'Push 2', muscles: ['Pecho', 'Hombros', 'Tríceps'] },
                { name: 'Pull 2', muscles: ['Espalda', 'Bíceps'] },
                { name: 'Legs 2', muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'] }
            ],
            upper_lower: [
                { name: 'Upper A', muscles: ['Pecho', 'Espalda', 'Hombros'] },
                { name: 'Lower A', muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'] },
                { name: 'Upper B', muscles: ['Espalda', 'Pecho', 'Brazos'] },
                { name: 'Lower B', muscles: ['Isquiotibiales', 'Cuádriceps', 'Pantorrillas'] }
            ],
            bro_split: [
                { name: 'Pecho', muscles: ['Pecho'] },
                { name: 'Espalda', muscles: ['Espalda'] },
                { name: 'Hombros', muscles: ['Hombros'] },
                { name: 'Piernas', muscles: ['Cuádriceps', 'Isquiotibiales'] },
                { name: 'Brazos', muscles: ['Bíceps', 'Tríceps'] }
            ],
            hit_3day: [
                { name: 'Día A', muscles: ['Pecho', 'Hombros', 'Tríceps'] },
                { name: 'Día B', muscles: ['Espalda', 'Bíceps'] },
                { name: 'Día C', muscles: ['Piernas'] }
            ],
            full_body: [
                { name: 'Full Body A', muscles: ['Pecho', 'Espalda', 'Piernas'] },
                { name: 'Full Body B', muscles: ['Hombros', 'Brazos', 'Piernas'] },
                { name: 'Full Body C', muscles: ['Espalda', 'Pecho', 'Core'] }
            ]
        };

        const days = splits[split] || splits.push_pull_legs;

        // Cantidad de ejercicios por grupo según nivel
        const exercisesPerMuscle = level === 'beginner' ? 1 : level === 'advanced' ? 3 : 2;

        return days.map((day, idx) => ({
            dayNumber: idx + 1,
            name: day.name,
            muscles: day.muscles,
            exercises: generateExercisesForMuscles(day.muscles, protocol, exercisesPerMuscle, adaptedParams),
            completed: false
        }));
    }

    /**
     * Genera ejercicios para los grupos musculares (adaptado por nivel)
     */
    function generateExercisesForMuscles(muscles, protocol, maxPerMuscle, adaptedParams) {
        const exerciseDB = {
            'Pecho': ['Press Banca', 'Press Inclinado', 'Cruces Cable', 'Aperturas Inclinado'],
            'Espalda': ['Jalón Dorsal', 'Remo con Barra', 'Pullover', 'Remo T'],
            'Hombros': ['Press Militar', 'Elevaciones Laterales', 'Face Pulls', 'Press Arnold'],
            'Cuádriceps': ['Sentadilla', 'Prensa', 'Extensión de Pierna', 'Hack Squat'],
            'Isquiotibiales': ['Curl Femoral', 'Peso Muerto Rumano', 'Curl Nórdico'],
            'Glúteos': ['Hip Thrust', 'Sentadilla Sumo', 'Patada de Glúteo'],
            'Bíceps': ['Curl con Barra', 'Curl Martillo', 'Curl Alterno'],
            'Tríceps': ['Press Francés', 'Extensiones Cable', 'Fondos'],
            'Piernas': ['Sentadilla', 'Prensa', 'Curl Femoral', 'Extensión de Pierna'],
            'Brazos': ['Curl con Barra', 'Press Francés', 'Curl Martillo'],
            'Core': ['Plancha', 'Crunches'],
            'Pantorrillas': ['Elevación Talones', 'Elevación Sentado']
        };

        const exercises = [];
        muscles.forEach((muscle, muscleIdx) => {
            const muscleExercises = exerciseDB[muscle] || ['Ejercicio Genérico'];
            const count = Math.min(maxPerMuscle || 2, muscleExercises.length);
            muscleExercises.slice(0, count).forEach((exName, exIdx) => {
                // Determine intensifiers for this exercise from adapted params
                const intensifiers = adaptedParams?.intensifiers || protocol.intensifiers || [];
                // Primary exercises get all intensifiers; secondary get simpler ones
                const exerciseIntensifiers = exIdx === 0 ? intensifiers : intensifiers.filter(i => {
                    const info = INTENSIFIER_INSTRUCTIONS[i];
                    return info && info.level !== 'advanced';
                });

                exercises.push({
                    id: `ex_${Date.now()}_${muscleIdx}_${exIdx}`,
                    name: exName,
                    muscleGroup: muscle,
                    isPrimary: exIdx === 0,
                    sets: parseInt(protocol.sets) || 3,
                    targetReps: protocol.reps || '8-12',
                    targetRIR: protocol.rir !== undefined ? protocol.rir : 2,
                    restSeconds: Array.isArray(protocol.rest) ? protocol.rest[0] : (protocol.rest || 90),
                    tempo: protocol.tempo || null,
                    load: protocol.load || null,
                    intensifiers: exerciseIntensifiers,
                    extraReps: exIdx === 0 ? (adaptedParams?.extraReps || protocol.extraReps || null) : null
                });
            });
        });

        return exercises;
    }

    /**
     * Muestra estado listo para entrenar con tabla de rutina completa
     */
    function showReadyToTrainState(routine) {
        // Re-obtener el elemento para asegurar que tenemos la referencia correcta
        const container = document.getElementById('no-routine-state');
        if (!container) {
            console.error('Container no-routine-state no encontrado');
            return;
        }

        // Asegurar que el elemento es visible
        container.classList.remove('hidden');

        // Obtener el nombre de la metodología de forma legible
        const methodologies = window.MethodologyEngine?.EMBEDDED_METHODOLOGIES || {};
        const methName = methodologies[routine.methodology]?.name || routine.methodology;
        const currentDayIndex = routine.currentDayIndex || 0;

        // Get mesocycle data
        const mesocycleWeek = routine.mesocycleWeek || 1;
        const mesocycleInfo = MESOCYCLE_RIR_MAP[mesocycleWeek];

        container.innerHTML = `
            <div class="card__header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3 class="card__title" style="margin: 0; display: inline-block;">📋 Rutina - ${methName}</h3>
                    <span class="rp-badge" style="vertical-align: middle; margin-left: 8px;">${routine.days?.length || 0} días</span>
                </div>
                <button id="btn-new-routine" class="btn btn--secondary btn--sm" style="opacity: 0.8; height: fit-content; margin: 0;">
                    🔄 Recrear Rutina
                </button>
            </div>

            <!-- Mesocycle Week Tabs (interactive) -->
            <div style="margin-bottom: 12px;">
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 6px 0;">📅 Semana del Mesociclo:</p>
                <div class="day-tabs" id="mesocycle-week-tabs" style="margin-bottom: 8px;">
                    ${[1, 2, 3, 4, 5].map(w => {
            const info = MESOCYCLE_RIR_MAP[w];
            return `<button class="day-tab ${w === mesocycleWeek ? 'active' : ''}" data-week="${w}" style="font-size: 0.75rem; ${w === mesocycleWeek ? 'background:' + info.color + '; border-color:' + info.color + ';' : ''}">
                            S${w} ${info.name}
                        </button>`;
        }).join('')}
                </div>
                <div id="mesocycle-info-bar" style="background: linear-gradient(135deg, ${mesocycleInfo.color}22, ${mesocycleInfo.color}11); border: 1px solid ${mesocycleInfo.color}55; border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 10px;">
                    <div style="background: ${mesocycleInfo.color}; color: white; border-radius: 6px; padding: 4px 10px; font-weight: bold; font-size: 0.95rem;">
                        RIR ${mesocycleInfo.rir}
                    </div>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${mesocycleInfo.description}</span>
                </div>
            </div>

            <!-- Protocol Detail Panel -->
            <div style="background: rgba(224, 64, 251, 0.08); border: 1px solid rgba(224, 64, 251, 0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: #E040FB; font-size: 0.9rem;">🎯 ${routine.protocolName || 'Protocolo'}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Nivel: ${getLevelDisplayName(routine.level)}</span>
                </div>
                ${routine.protocolDescription ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 8px 0;">${routine.protocolDescription}</p>` : ''}
                <div style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.75rem;">
                    <span style="background: rgba(16, 185, 129, 0.15); color: #10B981; padding: 3px 8px; border-radius: 4px;">
                        Sets: ${routine.parameters?.sets || '3'}
                    </span>
                    <span style="background: rgba(59, 130, 246, 0.15); color: #3B82F6; padding: 3px 8px; border-radius: 4px;">
                        Reps: ${routine.parameters?.reps || '8-12'}${routine.parameters?.extraReps ? ' ' + routine.parameters.extraReps : ''}
                    </span>
                    <span style="background: rgba(239, 68, 68, 0.15); color: #EF4444; padding: 3px 8px; border-radius: 4px;">
                        RIR: ${routine.parameters?.rir ?? 2}
                    </span>
                    <span style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; padding: 3px 8px; border-radius: 4px;">
                        Rest: ${formatRest(routine.parameters?.rest)}
                    </span>
                    ${routine.parameters?.tempo ? `<span style="background: rgba(139, 92, 246, 0.15); color: #8B5CF6; padding: 3px 8px; border-radius: 4px;">Tempo: ${routine.parameters.tempo}</span>` : ''}
                    ${routine.parameters?.load ? `<span style="background: rgba(236, 72, 153, 0.15); color: #EC4899; padding: 3px 8px; border-radius: 4px;">Carga: ${routine.parameters.load}</span>` : ''}
                    ${routine.parameters?.tut ? `<span style="background: rgba(168, 85, 247, 0.15); color: #A855F7; padding: 3px 8px; border-radius: 4px;">TUT: ${routine.parameters.tut}</span>` : ''}
                </div>
                ${(routine.parameters?.intensifiers?.length > 0) ? `
                <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
                    ${routine.parameters.intensifiers.map(i => `<span style="background: rgba(224, 64, 251, 0.2); color: #E040FB; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 500;">💪 ${i}</span>`).join('')}
                </div>` : ''}
                ${routine.parameters?.levelNote ? `<p style="font-size: 0.7rem; color: var(--text-muted); margin: 6px 0 0 0; font-style: italic;">📊 ${routine.parameters.levelNote}</p>` : ''}
                ${routine.parameters?.mesocycleNote ? `<p style="font-size: 0.7rem; color: var(--text-muted); margin: 2px 0 0 0; font-style: italic;">📅 ${routine.parameters.mesocycleNote}</p>` : ''}
            </div>

            <!-- Tabs de días -->
            <div class="day-tabs" id="day-tabs">
                ${routine.days?.map((day, idx) => `
                    <button class="day-tab ${idx === currentDayIndex ? 'active' : ''}"
                            data-day-index="${idx}">
                        ${day.name}
                    </button>
                `).join('') || ''}
            </div>

            <!-- Información del día actual -->
            <div class="routine-day-header">
                <div>
                    <strong id="current-day-name">${routine.days?.[currentDayIndex]?.name || 'Día 1'}</strong>
                    <span class="routine-day-info">
                        <span>🎯 ${routine.days?.[currentDayIndex]?.muscles?.join(', ') || ''}</span>
                        <span>⏱️ ~${estimateWorkoutDuration(routine.days?.[currentDayIndex])} min</span>
                    </span>
                </div>
            </div>

            <!-- Tabla de ejercicios -->
            <div id="routine-table-container">
                ${renderRoutineTable(routine, currentDayIndex)}
            </div>

            <!-- Reglas de Control Progresivo RP -->
            <div class="rp-rules-card mt-2" style="background: linear-gradient(135deg, rgba(224, 64, 251, 0.1), rgba(156, 39, 176, 0.05)); border: 1px solid rgba(224, 64, 251, 0.3); border-radius: 12px; padding: 16px;">
                <h5 style="margin: 0 0 12px 0; color: #E040FB; font-size: 0.95rem;">📐 Reglas de Control Progresivo RP</h5>
                <div style="display: grid; gap: 8px; font-size: 0.8rem;">
                    <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">
                        <span style="color: #10B981; font-weight: bold; font-size: 1.1rem; min-width: 24px;">↑</span>
                        <div>
                            <span style="color: var(--text-primary); font-weight: 500;">RIR ≤ 1 + reps ≥ 8</span>
                            <span style="color: #10B981; margin-left: 8px;">→ +2.5kg peso</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">
                        <span style="color: #10B981; font-weight: bold; font-size: 1.1rem; min-width: 24px;">↑↑</span>
                        <div>
                            <span style="color: var(--text-primary); font-weight: 500;">RIR ≥ 3 (muy fácil)</span>
                            <span style="color: #10B981; margin-left: 8px;">→ +5kg peso</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 6px;">
                        <span style="color: #F59E0B; font-weight: bold; font-size: 1.1rem; min-width: 24px;">→</span>
                        <div>
                            <span style="color: var(--text-primary); font-weight: 500;">RIR = 2 (óptimo)</span>
                            <span style="color: #F59E0B; margin-left: 8px;">→ Mantener peso, +1-2 reps</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">
                        <span style="color: #EF4444; font-weight: bold; font-size: 1.1rem; min-width: 24px;">↓</span>
                        <div>
                            <span style="color: var(--text-primary); font-weight: 500;">Reps < 6</span>
                            <span style="color: #EF4444; margin-left: 8px;">→ -10% peso</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RP Progressive Parameters Section -->
            <div class="rp-progressive-section">
                <h4>📊 Parámetros Progresivos RP</h4>
                
                <div class="rp-feedback-grid">
                    <div class="feedback-slider">
                        <label>💪 Pump (Bombeo)</label>
                        <input type="range" class="range-slider" id="daily-pump" min="1" max="5" value="3">
                        <span class="feedback-value" id="pump-value">3 - Normal</span>
                    </div>
                    <div class="feedback-slider">
                        <label>🦵 Soreness (Agujetas)</label>
                        <input type="range" class="range-slider" id="daily-soreness" min="1" max="5" value="3">
                        <span class="feedback-value" id="soreness-value">3 - Normal</span>
                    </div>
                    <div class="feedback-slider">
                        <label>😓 Fatigue (Fatiga)</label>
                        <input type="range" class="range-slider" id="daily-fatigue" min="1" max="5" value="3">
                        <span class="feedback-value" id="fatigue-value">3 - Normal</span>
                    </div>
                </div>
                
                <div id="rp-recommendation" class="rp-recommendation">
                    <span>🎯</span>
                    <span id="recommendation-text">Parámetros óptimos - Continúa con el volumen actual</span>
                </div>
            </div>

            <!-- Volume Control Section MEV → MRV -->
            <div class="volume-control-section">
                <h4>📈 Control de Volumen (MEV → MRV)</h4>
                <div id="volume-bars-container">
                    ${renderVolumeControl(routine.days?.[currentDayIndex]?.muscles || [], routine.level || 'intermediate', routine.methodology)}
                </div>
            </div>

            <!-- Registro de Rendimiento - Workout Log Table -->
            <div class="card mt-3" style="border: 1px solid rgba(224, 64, 251, 0.3);">
                <div class="card__header" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                    <h4 style="margin: 0;">📝 Registro de Rendimiento</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Anota tu rendimiento real para calcular la progresión</p>
                </div>
                
                <div class="workout-log-table-container" style="overflow-x: auto;">
                    <table class="routine-table workout-log-table" id="workout-log-table">
                        <thead>
                            <tr>
                                <th>Ejercicio</th>
                                <th style="width: 80px;">Peso (kg)</th>
                                <th style="width: 70px;">Reps</th>
                                <th style="width: 70px;">RPE</th>
                                <th style="width: 60px;">RIR</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${routine.days?.[currentDayIndex]?.exercises?.map((ex, idx) => `
                                <tr data-exercise-idx="${idx}">
                                    <td>
                                        ${ex.isPrimary ? '⭐ ' : ''}${ex.name}
                                        <small style="display: block; color: var(--text-muted); font-size: 0.7rem;">
                                            Objetivo: ${ex.targetReps || routine.parameters?.reps || '8-12'} reps
                                        </small>
                                    </td>
                                    <td><input type="number" class="log-input log-weight" placeholder="-" step="0.5" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; color: white; text-align: center;"></td>
                                    <td><input type="number" class="log-input log-reps" placeholder="-" min="1" max="50" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; color: white; text-align: center;"></td>
                                    <td><input type="number" class="log-input log-rpe" placeholder="-" min="5" max="10" step="0.5" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; color: white; text-align: center;"></td>
                                    <td><input type="number" class="log-input log-rir" placeholder="-" min="-2" max="5" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; color: white; text-align: center;"></td>
                                </tr>
                            `).join('') || '<tr><td colspan="5">No hay ejercicios</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <button id="btn-calculate-progression" class="btn btn--primary btn--block mt-2" 
                    style="background: linear-gradient(135deg, #10B981, #059669);">
                    📊 CALCULAR PRÓXIMA SESIÓN
                </button>

                <!-- Parámetros Progresivos RP -->
                <div class="rp-params-reference mt-2" style="background: rgba(224, 64, 251, 0.08); border-radius: 8px; padding: 12px; border: 1px solid rgba(224, 64, 251, 0.2);">
                    <h5 style="margin: 0 0 8px 0; font-size: 0.85rem; color: #E040FB;">📐 Parámetros Progresivos RP</h5>
                    <div style="display: grid; gap: 6px; font-size: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #10B981; font-weight: bold; min-width: 20px;">↑</span>
                            <span style="color: var(--text-muted);">RIR ≤ 1 y reps ≥ 8 →</span>
                            <span style="color: #10B981;">+2.5kg peso</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #10B981; font-weight: bold; min-width: 20px;">↑↑</span>
                            <span style="color: var(--text-muted);">RIR ≥ 3 (muy fácil) →</span>
                            <span style="color: #10B981;">+5kg peso</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #F59E0B; font-weight: bold; min-width: 20px;">→</span>
                            <span style="color: var(--text-muted);">RIR 2 (óptimo) →</span>
                            <span style="color: #F59E0B;">Mantener, +1-2 reps</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #EF4444; font-weight: bold; min-width: 20px;">↓</span>
                            <span style="color: var(--text-muted);">Reps < 6 →</span>
                            <span style="color: #EF4444;">-10% peso</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla de Próxima Sesión (aparece después del cálculo) -->
            <div id="next-session-container" class="card mt-3 hidden" style="border: 1px solid rgba(16, 185, 129, 0.5); background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05));">
                <div class="card__header" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                    <h4 style="margin: 0; color: #10B981;">🎯 Próxima Sesión - Objetivos Progresivos</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Basado en tu rendimiento y reglas RP de progresión</p>
                </div>
                
                <div class="next-session-table-container" style="overflow-x: auto;">
                    <table class="routine-table" id="next-session-table">
                        <thead>
                            <tr>
                                <th>Ejercicio</th>
                                <th>Peso Objetivo</th>
                                <th>Reps Objetivo</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody id="next-session-tbody">
                            <!-- Se llena dinámicamente -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Resumen de Sesión (aparece después de guardar) -->
            <div id="session-summary-container" class="card mt-3 hidden" style="border: 1px solid rgba(139, 92, 246, 0.5); background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(109, 40, 217, 0.05));">
                <div class="card__header" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                    <h4 style="margin: 0; color: #8B5CF6;">📊 Resumen de Sesión</h4>
                </div>

                <!-- Stats row -->
                <div class="module-grid mt-2" style="gap: 8px;">
                    <div class="stat-box" style="padding: 10px;">
                        <div id="summary-total-volume" class="stat-box__value" style="font-size: 1.2rem; color: #10B981;">0</div>
                        <div class="stat-box__label">Vol. Total (kg)</div>
                    </div>
                    <div class="stat-box" style="padding: 10px;">
                        <div id="summary-total-sets" class="stat-box__value" style="font-size: 1.2rem; color: #3B82F6;">0</div>
                        <div class="stat-box__label">Sets Totales</div>
                    </div>
                    <div class="stat-box" style="padding: 10px;">
                        <div id="summary-avg-rpe" class="stat-box__value" style="font-size: 1.2rem; color: #F59E0B;">0</div>
                        <div class="stat-box__label">RPE Promedio</div>
                    </div>
                    <div class="stat-box" style="padding: 10px;">
                        <div id="summary-avg-rir" class="stat-box__value" style="font-size: 1.2rem; color: #EF4444;">0</div>
                        <div class="stat-box__label">RIR Promedio</div>
                    </div>
                </div>

                <!-- Volume vs MEV/MAV/MRV -->
                <div class="mt-2" style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                    <h5 style="margin: 0 0 8px 0; font-size: 0.85rem; color: #8B5CF6;">📈 Volumen vs Landmarks</h5>
                    <div id="summary-volume-landmarks">
                        <!-- Se llena dinámicamente -->
                    </div>
                </div>

                <!-- Session rating -->
                <div class="mt-2" style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                    <h5 style="margin: 0 0 8px 0; font-size: 0.85rem;">⭐ Calificación de la Sesión</h5>
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button class="session-rating-btn" data-rating="1" style="font-size: 1.5rem; background: none; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 12px; cursor: pointer;">😫</button>
                        <button class="session-rating-btn" data-rating="2" style="font-size: 1.5rem; background: none; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 12px; cursor: pointer;">😐</button>
                        <button class="session-rating-btn" data-rating="3" style="font-size: 1.5rem; background: none; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 12px; cursor: pointer;">💪</button>
                        <button class="session-rating-btn" data-rating="4" style="font-size: 1.5rem; background: none; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 12px; cursor: pointer;">🔥</button>
                        <button class="session-rating-btn" data-rating="5" style="font-size: 1.5rem; background: none; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 12px; cursor: pointer;">🏆</button>
                    </div>
                </div>

                <p id="summary-saved-message" class="text-muted mt-2" style="text-align: center; font-size: 0.8rem;">
                    ✅ Sesión guardada en historial — visible en Progreso
                </p>
            </div>

            <button id="btn-generate-progressive" class="btn btn--primary btn--block mt-3"
                style="font-size: 1.1rem; padding: 1rem; background: linear-gradient(135deg, #E040FB, #9C27B0);">
                📈 ACTUALIZAR Y GENERAR RUTINA PROGRESIVA
            </button>
            <button id="btn-save-session" class="btn btn--primary btn--block mt-1"
                style="font-size: 1rem; padding: 0.8rem; background: linear-gradient(135deg, #8B5CF6, #6D28D9);">
                💾 GUARDAR SESIÓN EN HISTORIAL
            </button>
        `;

        // Añadir listeners a los nuevos botones
        document.getElementById('btn-generate-progressive')?.addEventListener('click', generateProgressiveRoutine);
        document.getElementById('btn-save-session')?.addEventListener('click', () => saveSessionToHistory(routine));
        document.getElementById('btn-new-routine')?.addEventListener('click', () => {
            localStorage.removeItem('rpCoach_active_routine');
            localStorage.removeItem('rpCoach_currentRoutine');

            // Ocultar la vista de rutina y mostrar el wizard
            const container = document.getElementById('no-routine-state');
            const wizardSection = document.getElementById('routine-wizard-section');
            if (container) container.classList.add('hidden');
            if (wizardSection) wizardSection.classList.remove('hidden');

            // Cambiar automáticamente a la pestaña ENTRENAMIENTO
            const workoutTab = document.querySelector('[data-module="workout"]');
            if (workoutTab) workoutTab.click();

            // Notificar al usuario (asumiendo que showNotification existe en el scope un nivel arriba)
            if (typeof showNotification === 'function') {
                showNotification('Configuración reiniciada. Puedes escoger otra metodología.', 'info');
            }
        });

        // Añadir listeners a los tabs de días
        document.querySelectorAll('#day-tabs .day-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const dayIndex = parseInt(e.target.dataset.dayIndex);
                if (!isNaN(dayIndex)) switchDayView(routine, dayIndex);
            });
        });

        // Añadir listeners a los tabs de semana del mesociclo
        document.querySelectorAll('#mesocycle-week-tabs .day-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const week = parseInt(e.target.dataset.week);
                if (!isNaN(week)) switchMesocycleWeek(routine, week);
            });
        });

        // Configurar auto-fill RIR from RPE
        setupAutoFillRIR();

        // Configurar listeners para feedback RP
        setupRPFeedbackListeners();

        // Configurar calculadora de progresión
        setupProgressionCalculator();

        console.log('✅ Estado de rutina con parámetros RP mostrado');
    }

    /**
     * Renderiza la tabla de rutina para un día específico
     */
    function renderRoutineTable(routine, dayIndex) {
        const day = routine.days?.[dayIndex];
        if (!day || !day.exercises || day.exercises.length === 0) {
            return '<p class="text-muted">No hay ejercicios para este día</p>';
        }

        const params = routine.parameters || {};

        return `
            <table class="routine-table">
                <thead>
                    <tr>
                        <th>Ejercicio</th>
                        <th>Series</th>
                        <th>Reps</th>
                        <th>%RM</th>
                        <th>Tempo</th>
                        <th>RIR</th>
                        <th>Rest</th>
                        <th>Último Peso</th>
                    </tr>
                </thead>
                <tbody>
                    ${day.exercises.map(ex => {
            const exIntensifiers = ex.intensifiers || params.intensifiers || [];
            const intensifierRows = exIntensifiers.map(intName => {
                const info = INTENSIFIER_INSTRUCTIONS[intName];
                if (!info) return '';
                return `<tr class="intensifier-row">
                                <td colspan="8" style="padding: 2px 12px 6px 28px; border-top: none; background: rgba(139, 92, 246, 0.08);">
                                    <span style="font-size: 0.75rem; color: #A78BFA; font-weight: 600;">${info.icon} ${intName}</span>
                                    <span style="font-size: 0.7rem; color: var(--text-muted); margin-left: 6px;">${info.instruction}</span>
                                </td>
                            </tr>`;
            }).join('');
            const extraRepsRow = ex.extraReps ? `<tr class="intensifier-row">
                            <td colspan="8" style="padding: 2px 12px 6px 28px; border-top: none; background: rgba(245, 158, 11, 0.08);">
                                <span style="font-size: 0.75rem; color: #F59E0B; font-weight: 600;">⚡ ${ex.extraReps}</span>
                            </td>
                        </tr>` : '';
            return `
                        <tr>
                            <td class="${ex.isPrimary ? 'exercise-primary' : ''}">
                                ${ex.isPrimary ? '⭐ ' : ''}${ex.name}
                                <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">
                                    ${ex.muscleGroup || ''}
                                </small>
                            </td>
                            <td>${ex.sets || params.sets || 3}</td>
                            <td>${formatRepsWithExtra(ex.targetReps || params.reps || '8-12', params.extraReps)}</td>
                            <td>${ex.load || params.load || '-'}</td>
                            <td class="tempo-cell">${ex.tempo || params.tempo || '-'}</td>
                            <td>${ex.targetRIR !== undefined ? ex.targetRIR : (params.rir !== undefined ? params.rir : 2)}</td>
                            <td class="rest-cell">${formatRestComplete(ex.restSeconds || params.rest, params.microRest)}</td>
                            <td class="weight-cell">${formatLastWeight(ex.name)}</td>
                        </tr>
                        ${intensifierRows}
                        ${extraRepsRow}`;
        }).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Cambia la vista a un día diferente
     */
    function switchDayView(routine, dayIndex) {
        const day = routine.days?.[dayIndex];
        if (!day) return;

        // Actualizar tab activa (solo las de días, no las de mesociclo)
        document.querySelectorAll('#day-tabs .day-tab').forEach((tab, idx) => {
            tab.classList.toggle('active', idx === dayIndex);
        });

        // Actualizar nombre del día
        const dayNameEl = document.getElementById('current-day-name');
        if (dayNameEl) {
            dayNameEl.textContent = day.name;
        }

        // Actualizar info de músculos y duración
        const dayInfo = document.querySelector('.routine-day-info');
        if (dayInfo) {
            dayInfo.innerHTML = `
                <span>🎯 ${day.muscles?.join(', ') || ''}</span>
                <span>⏱️ ~${estimateWorkoutDuration(day)} min</span>
            `;
        }

        // Actualizar tabla de rutina
        const tableContainer = document.getElementById('routine-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = renderRoutineTable(routine, dayIndex);
        }

        // Actualizar tabla de registro de rendimiento (workout log)
        const workoutLogTbody = document.querySelector('#workout-log-table tbody');
        if (workoutLogTbody && day.exercises) {
            workoutLogTbody.innerHTML = day.exercises.map((ex, idx) => `
                <tr data-exercise-idx="${idx}">
                    <td>
                        ${ex.isPrimary ? '⭐ ' : ''}${ex.name}
                        <small style="display: block; color: var(--text-muted); font-size: 0.7rem;">
                            Objetivo: ${ex.targetReps || routine.parameters?.reps || '8-12'} reps
                        </small>
                    </td>
                    <td><input type="number" class="log-input log-weight" placeholder="-" step="0.5" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; color: white; text-align: center;"></td>
                    <td><input type="number" class="log-input log-reps" placeholder="-" min="1" max="50" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; color: white; text-align: center;"></td>
                    <td><input type="number" class="log-input log-rpe" placeholder="-" min="5" max="10" step="0.5" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; color: white; text-align: center;"></td>
                    <td><input type="number" class="log-input log-rir" placeholder="-" min="-2" max="5" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; color: white; text-align: center;"></td>
                </tr>
            `).join('');
        }

        // Actualizar control de volumen
        const volumeContainer = document.getElementById('volume-bars-container');
        if (volumeContainer && day.muscles) {
            volumeContainer.innerHTML = renderVolumeControl(day.muscles, routine.level || 'intermediate', routine.methodology);
        }

        // Ocultar tabla de próxima sesión y resumen (ya no son válidos para el nuevo día)
        const nextSessionContainer = document.getElementById('next-session-container');
        if (nextSessionContainer) {
            nextSessionContainer.classList.add('hidden');
        }
        const summaryContainer = document.getElementById('session-summary-container');
        if (summaryContainer) {
            summaryContainer.classList.add('hidden');
        }

        // Re-setup auto-fill RIR para los nuevos inputs
        setupAutoFillRIR();

        // Actualizar rutina actual guardada
        routine.currentDayIndex = dayIndex;
        localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));
    }

    /**
     * Cambia la semana del mesociclo y recalcula parámetros
     */
    function switchMesocycleWeek(routine, newWeek) {
        const mesocycleInfo = MESOCYCLE_RIR_MAP[newWeek];
        if (!mesocycleInfo) return;

        const methodologies = window.MethodologyEngine?.EMBEDDED_METHODOLOGIES || {};
        const meth = methodologies[routine.methodology] || {};

        // Obtener el protocolo asignado a ESTA semana del mesociclo
        const weekProtocolId = getProtocolForWeek(routine.methodology, routine.level, newWeek);
        const prot = weekProtocolId
            ? (meth.protocols?.find(p => p.id === weekProtocolId) || meth.protocols?.[0] || {})
            : (meth.protocols?.find(p => p.id === routine.protocolId) || meth.protocols?.[0] || {});

        // Params del protocolo de esta semana
        let params = {
            sets: prot.sets || '3-4', reps: prot.reps || '8-12',
            extraReps: prot.extraReps || null, rest: prot.rest || 90,
            rir: prot.rir !== undefined ? prot.rir : 2, rpe: prot.rpe || '7-8',
            tempo: prot.tempo || null, load: prot.load || null,
            tut: prot.tut || null, intensifiers: [...(prot.intensifiers || [])],
            microRest: prot.microRest || null
        };
        params = adaptParamsToLevel(params, routine.level, meth.type);
        params = adaptParamsToMesocycle(params, newWeek);

        // Update routine
        routine.parameters = params;
        routine.protocolId = prot.id;
        routine.protocolName = prot.name;
        routine.protocolDescription = prot.description || '';
        routine.mesocycleWeek = newWeek;
        routine.mesocycleName = mesocycleInfo.name;

        // Update exercises with this week's protocol params + intensifiers
        if (routine.days) {
            routine.days.forEach(day => {
                day.exercises?.forEach(ex => {
                    ex.targetRIR = params.rir;
                    ex.targetReps = params.reps || ex.targetReps;

                    ex.baseSets = ex.baseSets || ex.sets || parseInt(params.sets) || 3;
                    const isMassiveStatic = ex.baseSets >= 7;
                    if (!isMassiveStatic) {
                        if (newWeek === 2 && ex.isPrimary) {
                            ex.sets = ex.baseSets + 1;
                        } else if (newWeek === 3) {
                            ex.sets = ex.baseSets + 1;
                        } else if (newWeek === 4) {
                            ex.sets = ex.isPrimary ? ex.baseSets + 2 : ex.baseSets + 1;
                        } else if (newWeek === 5) {
                            ex.sets = Math.max(Math.floor(ex.baseSets * 0.5), 1);
                        } else {
                            ex.sets = ex.baseSets;
                        }
                    } else if (newWeek === 5) {
                        ex.sets = Math.max(Math.floor(ex.baseSets * 0.5), 1);
                    } else {
                        ex.sets = ex.baseSets;
                    }
                    ex.load = params.load || ex.load;
                    ex.tempo = params.tempo || ex.tempo;
                    ex.restSeconds = Array.isArray(params.rest) ? params.rest[0] : (params.rest || ex.restSeconds);
                    // Intensificadores del protocolo de esta semana
                    ex.intensifiers = [...(params.intensifiers || [])];
                    ex.extraReps = ex.isPrimary ? (params.extraReps || null) : null;
                });
            });
        }

        // Save
        localStorage.setItem('rpCoach_active_routine', JSON.stringify(routine));

        // Update mesocycle tab visuals
        document.querySelectorAll('#mesocycle-week-tabs .day-tab').forEach(tab => {
            const w = parseInt(tab.dataset.week);
            const isActive = w === newWeek;
            tab.classList.toggle('active', isActive);
            tab.style.background = isActive ? MESOCYCLE_RIR_MAP[w].color : '';
            tab.style.borderColor = isActive ? MESOCYCLE_RIR_MAP[w].color : '';
        });

        // Update info bar with protocol info
        const infoBar = document.getElementById('mesocycle-info-bar');
        if (infoBar) {
            infoBar.style.background = `linear-gradient(135deg, ${mesocycleInfo.color}22, ${mesocycleInfo.color}11)`;
            infoBar.style.borderColor = `${mesocycleInfo.color}55`;
            const intensifierText = params.intensifiers?.length > 0
                ? params.intensifiers.map(i => { const info = INTENSIFIER_INSTRUCTIONS[i]; return info ? `${info.icon} ${i}` : i; }).join(' · ')
                : 'Sin intensificador';
            infoBar.innerHTML = `
                <div style="background: ${mesocycleInfo.color}; color: white; border-radius: 6px; padding: 4px 10px; font-weight: bold; font-size: 0.95rem;">
                    RIR ${mesocycleInfo.rir}
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-size: 0.85rem; color: white; font-weight: 600;">📋 ${prot.name || ''}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${intensifierText} · ${mesocycleInfo.description}</span>
                </div>
            `;
        }

        // Update protocol detail panel
        const protocolPanel = document.querySelector('[data-protocol-panel]');
        if (protocolPanel) {
            const restText = Array.isArray(params.rest) ? params.rest.join('→') + 's' : params.rest + 's';
            protocolPanel.querySelector('h3').textContent = `🎯 ${prot.name || ''}`;
            const badgesContainer = protocolPanel.querySelector('.badges-container');
            if (badgesContainer) {
                badgesContainer.innerHTML = `
                    <span class="badge" style="background: #10B981;">Sets: ${params.sets}</span>
                    <span class="badge" style="background: #3B82F6;">Reps: ${params.reps}${params.extraReps ? ' ' + params.extraReps : ''}</span>
                    <span class="badge" style="background: ${mesocycleInfo.color};">RIR: ${params.rir}</span>
                    <span class="badge" style="background: #EF4444;">Rest: ${restText}</span>
                    ${params.tempo ? `<span class="badge" style="background: #F59E0B;">Tempo: ${params.tempo}</span>` : ''}
                    ${params.load ? `<span class="badge" style="background: #8B5CF6;">Carga: ${params.load}</span>` : ''}
                    ${params.tut ? `<span class="badge" style="background: #EC4899;">TUT: ${params.tut}</span>` : ''}
                `;
            }
            const intensBadge = protocolPanel.querySelector('.intensifier-badge');
            if (intensBadge) {
                intensBadge.innerHTML = params.intensifiers?.length > 0
                    ? params.intensifiers.map(i => { const info = INTENSIFIER_INSTRUCTIONS[i]; return `<span style="background: #7C3AED; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.8rem;">${info?.icon || '💪'} ${i}</span>`; }).join(' ')
                    : '<span style="color: var(--text-muted); font-size: 0.8rem;">Sin intensificador (base)</span>';
            }
        }

        // Re-render the routine table for current day
        const currentDayIndex = routine.currentDayIndex || 0;
        const tableContainer = document.getElementById('routine-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = renderRoutineTable(routine, currentDayIndex);
        }

        // Update log table targets
        const logTbody = document.querySelector('#workout-log-table tbody');
        const currentDay = routine.days?.[currentDayIndex];
        if (logTbody && currentDay?.exercises) {
            logTbody.querySelectorAll('tr').forEach((row, idx) => {
                const ex = currentDay.exercises[idx];
                if (ex) {
                    const small = row.querySelector('small');
                    if (small) small.textContent = `Objetivo: ${ex.targetReps || params.reps || '8-12'} reps · RIR ${params.rir}`;
                }
            });
        }

        showNotification(`S${newWeek} ${mesocycleInfo.name}: ${prot.name || ''} (RIR ${mesocycleInfo.rir})`, 'success');
    }

    /**
     * Estima la duración del entrenamiento en minutos
     */
    function estimateWorkoutDuration(day) {
        if (!day || !day.exercises) return 45;
        const totalSets = day.exercises.reduce((sum, ex) => sum + (ex.sets || 3), 0);
        const avgRestMin = 2; // 2 minutos promedio de descanso
        const avgSetTime = 1; // 1 minuto por set
        return Math.round(totalSets * (avgSetTime + avgRestMin));
    }

    /**
     * Formatea el tiempo de descanso
     */
    function formatRest(rest) {
        if (!rest) return '90s';
        if (Array.isArray(rest)) {
            return rest.map(r => `${r}s`).join('→');
        }
        return typeof rest === 'number' ? `${rest}s` : rest;
    }

    /**
     * Formatea las repeticiones con técnica intensiva adicional
     * @param {string} baseReps - Repeticiones base (ej: "8-10")
     * @param {string} extraReps - Repeticiones adicionales (ej: "+2-3 Forced")
     * @returns {string} Formato combinado (ej: "8-10 (+2-3 Forced)")
     */
    function formatRepsWithExtra(baseReps, extraReps) {
        if (!extraReps) return baseReps;
        return `${baseReps} <span style="color: #E040FB; font-size: 0.85em;">(${extraReps})</span>`;
    }

    /**
     * Formatea el descanso incluyendo micro-descansos para Rest-Pause/SST
     * @param {number|Array} rest - Descanso en segundos o array de micro-descansos
     * @param {Array} microRest - Array opcional de micro-descansos
     * @returns {string} Formato de descanso
     */
    function formatRestComplete(rest, microRest) {
        if (microRest && Array.isArray(microRest)) {
            return `<span style="color: #F59E0B;">${microRest.join('→')}s</span>`;
        }
        if (Array.isArray(rest)) {
            return `<span style="color: #F59E0B;">${rest.join('→')}s</span>`;
        }
        if (!rest) return '90s';
        return typeof rest === 'number' ? `${rest}s` : rest;
    }

    /**
     * Obtiene el último peso usado para un ejercicio
     * @param {string} exerciseName - Nombre del ejercicio
     * @returns {object|null} Objeto con peso y fecha, o null si no hay registro
     */
    function getLastWeight(exerciseName) {
        try {
            const weights = JSON.parse(localStorage.getItem('rpCoach_exercise_weights') || '{}');
            return weights[exerciseName] || null;
        } catch (e) {
            console.error('Error obteniendo peso:', e);
            return null;
        }
    }

    /**
     * Guarda el peso usado para un ejercicio
     * @param {string} exerciseName - Nombre del ejercicio
     * @param {number} weight - Peso en kg
     */
    function saveExerciseWeight(exerciseName, weight) {
        try {
            const weights = JSON.parse(localStorage.getItem('rpCoach_exercise_weights') || '{}');
            weights[exerciseName] = {
                weight: weight,
                date: Date.now()
            };
            localStorage.setItem('rpCoach_exercise_weights', JSON.stringify(weights));
            console.log(`💾 Peso guardado: ${exerciseName} = ${weight}kg`);
        } catch (e) {
            console.error('Error guardando peso:', e);
        }
    }

    /**
     * Formatea el último peso para mostrar en la tabla
     * @param {string} exerciseName - Nombre del ejercicio
     * @returns {string} HTML con el peso formateado
     */
    function formatLastWeight(exerciseName) {
        const lastData = getLastWeight(exerciseName);
        if (!lastData || !lastData.weight) {
            return `<span style="color: var(--text-muted); font-size: 0.85em;">🆕 Primera vez</span>`;
        }
        return `<span style="color: #10B981; font-weight: bold;">${lastData.weight} kg</span>`;
    }

    /**
     * Genera una nueva rutina progresiva basada en el rendimiento registrado
     */
    function generateProgressiveRoutine() {
        const routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || '{}');
        const logTable = document.getElementById('workout-log-table');
        const nextSessionContainer = document.getElementById('next-session-container');
        const nextSessionTbody = document.getElementById('next-session-tbody');

        if (!logTable || !nextSessionTbody) {
            showNotification('Error: No se encontró la tabla de registro', 'error');
            return;
        }

        const rows = logTable.querySelectorAll('tbody tr');
        let hasData = false;
        const progressiveExercises = [];

        // Obtener parámetros de la rutina
        const params = routine.parameters || {};
        const targetReps = params.reps || '8-12';
        const extraReps = params.extraReps || null;

        rows.forEach((row, idx) => {
            const exerciseName = row.querySelector('td')?.textContent?.trim()?.split('\n')[0]?.replace('⭐ ', '') || `Ejercicio ${idx + 1}`;
            const weight = parseFloat(row.querySelector('.log-weight')?.value) || 0;
            const reps = parseInt(row.querySelector('.log-reps')?.value) || 0;
            const rpe = parseFloat(row.querySelector('.log-rpe')?.value) || 0;
            const rir = parseInt(row.querySelector('.log-rir')?.value);

            // Guardar peso si se registró
            if (weight > 0) {
                saveExerciseWeight(exerciseName, weight);
                hasData = true;
            }

            // Calcular progresión basada en reglas RP
            let action = 'MAINTAIN';
            let newWeight = weight;
            let newReps = targetReps;
            let color = '#F59E0B';
            let icon = '→';
            let actionText = 'Mantener';

            if (weight > 0 && reps > 0) {
                const actualRIR = !isNaN(rir) ? rir : (10 - rpe);

                // Reglas RP de Progresión
                if (actualRIR <= 1 && reps >= 8) {
                    action = 'INCREASE_WEIGHT';
                    newWeight = weight + 2.5;
                    color = '#10B981';
                    icon = '↑';
                    actionText = 'Subir';
                } else if (actualRIR >= 3) {
                    action = 'INCREASE_WEIGHT_MORE';
                    newWeight = weight + 5;
                    color = '#10B981';
                    icon = '↑↑';
                    actionText = 'Subir +';
                } else if (reps < 6) {
                    action = 'REDUCE_WEIGHT';
                    newWeight = Math.round(weight * 0.9 * 2) / 2;
                    color = '#EF4444';
                    icon = '↓';
                    actionText = 'Reducir';
                } else {
                    newReps = `${targetReps} (+1-2)`;
                    actionText = 'Mantener';
                }
            }

            progressiveExercises.push({
                name: exerciseName,
                weight,
                newWeight,
                reps,
                newReps: extraReps ? `${newReps} (${extraReps})` : newReps,
                action,
                color,
                icon,
                actionText
            });
        });

        if (!hasData) {
            showNotification('Completa al menos un ejercicio para generar progresión', 'warning');
            return;
        }

        // Generar tabla de próxima sesión
        nextSessionTbody.innerHTML = progressiveExercises.map(r => `
            <tr>
                <td>${r.name}</td>
                <td style="font-weight: bold; color: ${r.color};">
                    ${r.weight > 0 ? `${r.newWeight} kg` : '-'}
                    ${r.weight > 0 && r.newWeight !== r.weight ? `<small style="color: var(--text-muted);"> (era ${r.weight})</small>` : ''}
                </td>
                <td>${r.newReps}</td>
                <td style="color: ${r.color}; font-weight: bold;">
                    ${r.icon} ${r.actionText}
                </td>
            </tr>
        `).join('');

        // Mostrar contenedor de próxima sesión
        if (nextSessionContainer) {
            nextSessionContainer.classList.remove('hidden');
            nextSessionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Actualizar la tabla de rutina para reflejar los nuevos pesos guardados
        const dayIndex = routine.currentDayIndex || 0;
        const tableContainer = document.getElementById('routine-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = renderRoutineTable(routine, dayIndex);
        }

        showNotification('✅ Rutina progresiva generada y pesos guardados', 'success');
    }

    /**
     * Renderiza el control de volumen MEV → MRV para los grupos musculares del día
     */
    function renderVolumeControl(muscles, level, methodology) {
        if (!muscles || muscles.length === 0) {
            return '<p class="text-muted">Sin datos de volumen disponibles</p>';
        }

        // Mapeo de nombres de músculo a IDs del módulo de volumen
        const muscleMap = {
            'Pecho': 'chest',
            'Espalda': 'back',
            'Hombros': 'shoulders',
            'Cuádriceps': 'quads',
            'Isquiotibiales': 'hamstrings',
            'Glúteos': 'glutes',
            'Bíceps': 'biceps',
            'Tríceps': 'triceps',
            'Pantorrillas': 'calves',
            'Abdominales': 'abs',
            'Core': 'abs',
            'Brazos': 'biceps' // Simplificación
        };

        return muscles.map(muscle => {
            const muscleId = muscleMap[muscle] || 'chest';

            // Intentar obtener landmarks del módulo si está disponible
            let landmarks = { MEV: 8, MAV: 12, MRV: 20 };
            if (window.VolumeMEVMRVModule) {
                const volumeData = VolumeMEVMRVModule.getVolumeLandmarks(muscleId, level, methodology);
                if (volumeData) {
                    landmarks = {
                        MEV: volumeData.MEV || 8,
                        MAV: volumeData.MAV?.high || volumeData.MAV || 12,
                        MRV: volumeData.MRV || 20
                    };
                }
            }

            // Calcular posiciones porcentuales (basado en MRV = 100%)
            const mevPercent = (landmarks.MEV / landmarks.MRV) * 100;
            const mavPercent = (landmarks.MAV / landmarks.MRV) * 100;

            // Volumen actual simulado (entre MEV y MAV típicamente)
            const currentVolume = landmarks.MEV + Math.floor((landmarks.MAV - landmarks.MEV) * 0.5);
            const currentPercent = (currentVolume / landmarks.MRV) * 100;

            return `
                <div class="volume-muscle-row">
                    <label>
                        <span class="muscle-name">${muscle}</span>
                        <span class="volume-stats">${currentVolume} sets/sem (MEV:${landmarks.MEV} | MAV:${landmarks.MAV} | MRV:${landmarks.MRV})</span>
                    </label>
                    <div class="volume-progress">
                        <div class="volume-zone volume-zone--mev" style="width: ${mevPercent}%;">MEV</div>
                        <div class="volume-zone volume-zone--mav" style="left: ${mevPercent}%; width: ${mavPercent - mevPercent}%;">MAV</div>
                        <div class="volume-zone volume-zone--mrv" style="left: ${mavPercent}%; width: ${100 - mavPercent}%;">MRV</div>
                        <div class="volume-current-marker" style="left: ${currentPercent}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Configura listeners para los sliders de feedback RP
     */
    function setupRPFeedbackListeners() {
        const pumpSlider = document.getElementById('daily-pump');
        const sorenessSlider = document.getElementById('daily-soreness');
        const fatigueSlider = document.getElementById('daily-fatigue');

        const valueLabels = {
            1: '1 - Muy bajo',
            2: '2 - Bajo',
            3: '3 - Normal',
            4: '4 - Alto',
            5: '5 - Muy alto'
        };

        function updateRecommendation() {
            const pump = parseInt(pumpSlider?.value || 3);
            const soreness = parseInt(sorenessSlider?.value || 3);
            const fatigue = parseInt(fatigueSlider?.value || 3);

            // Actualizar labels
            if (document.getElementById('pump-value')) {
                document.getElementById('pump-value').textContent = valueLabels[pump];
            }
            if (document.getElementById('soreness-value')) {
                document.getElementById('soreness-value').textContent = valueLabels[soreness];
            }
            if (document.getElementById('fatigue-value')) {
                document.getElementById('fatigue-value').textContent = valueLabels[fatigue];
            }

            // Obtener recomendación del AutoregulationModule si está disponible
            let recommendation = { label: '🎯 Parámetros óptimos', description: 'Continúa con el volumen actual' };
            let recClass = '';

            if (window.AutoregulationModule) {
                const evalResult = AutoregulationModule.evaluateSession(pump, soreness, fatigue);
                recommendation = evalResult;

                // Determinar clase CSS según la acción
                if (evalResult.action === 'ADD_VOLUME' || evalResult.action === 'ADD_INTENSITY') {
                    recClass = 'recommendation--add';
                } else if (evalResult.action === 'REDUCE_VOLUME' || evalResult.action === 'REDUCE_INTENSITY') {
                    recClass = 'recommendation--reduce';
                } else if (evalResult.action === 'DELOAD') {
                    recClass = 'recommendation--deload';
                }
            } else {
                // Lógica simple de fallback
                if (pump >= 4 && soreness <= 2 && fatigue <= 2) {
                    recommendation = { label: '📈 Añadir Volumen', description: 'Buena recuperación. Considera añadir 1-2 series.' };
                    recClass = 'recommendation--add';
                } else if (fatigue >= 4 || soreness >= 4) {
                    recommendation = { label: '📉 Reducir Volumen', description: 'Fatiga detectada. Reduce 1-2 series por grupo.' };
                    recClass = 'recommendation--reduce';
                } else if (fatigue >= 5 && soreness >= 4) {
                    recommendation = { label: '⚠️ DELOAD', description: 'Fatiga crítica. Considera una semana de descarga.' };
                    recClass = 'recommendation--deload';
                }
            }

            // Actualizar UI
            const recContainer = document.getElementById('rp-recommendation');
            const recText = document.getElementById('recommendation-text');

            if (recContainer) {
                recContainer.className = 'rp-recommendation ' + recClass;
            }
            if (recText) {
                recText.textContent = `${recommendation.label}: ${recommendation.description}`;
            }
        }

        // Añadir listeners
        if (pumpSlider) pumpSlider.addEventListener('input', updateRecommendation);
        if (sorenessSlider) sorenessSlider.addEventListener('input', updateRecommendation);
        if (fatigueSlider) fatigueSlider.addEventListener('input', updateRecommendation);
    }

    /**
     * Configura la calculadora de progresión para todos los ejercicios
     */
    function setupProgressionCalculator() {
        const btnCalculate = document.getElementById('btn-calculate-progression');
        if (!btnCalculate) return;

        btnCalculate.addEventListener('click', () => {
            const routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || '{}');
            const logTable = document.getElementById('workout-log-table');
            const nextSessionContainer = document.getElementById('next-session-container');
            const nextSessionTbody = document.getElementById('next-session-tbody');

            if (!logTable || !nextSessionTbody) return;

            const rows = logTable.querySelectorAll('tbody tr');
            const results = [];
            let hasData = false;

            // Obtener parámetros de la rutina
            const targetReps = routine.parameters?.reps || '8-12';
            const targetRIR = routine.parameters?.rir ?? 2;
            const extraReps = routine.parameters?.extraReps || null;

            rows.forEach((row, idx) => {
                const exerciseName = row.querySelector('td')?.textContent?.trim()?.split('\n')[0]?.replace('⭐ ', '') || `Ejercicio ${idx + 1}`;
                const weight = parseFloat(row.querySelector('.log-weight')?.value) || 0;
                const reps = parseInt(row.querySelector('.log-reps')?.value) || 0;
                const rpe = parseFloat(row.querySelector('.log-rpe')?.value) || 0;
                const rir = parseInt(row.querySelector('.log-rir')?.value);

                // Calcular progresión basada en reglas RP
                let action = 'MAINTAIN';
                let newWeight = weight;
                let newReps = targetReps;
                let color = '#F59E0B'; // Amarillo/ámbar por defecto
                let icon = '→';

                if (weight > 0 && reps > 0) {
                    hasData = true;
                    const actualRIR = !isNaN(rir) ? rir : (10 - rpe);

                    // Reglas RP de Progresión:
                    // - Si RIR <= 0 y cumplió reps objetivo → Subir peso 2.5kg
                    // - Si RIR <= 1 y cumplió reps objetivo → Subir peso 2.5kg
                    // - Si RIR >= 3 → Peso muy ligero, subir más
                    // - Si no llegó a reps mínimas → Reducir peso
                    // - Si está en el rango → Mantener peso, intentar +reps

                    if (actualRIR <= 1 && reps >= 8) {
                        action = 'INCREASE_WEIGHT';
                        newWeight = weight + 2.5;
                        color = '#10B981'; // Verde
                        icon = '↑';
                    } else if (actualRIR >= 3) {
                        action = 'INCREASE_WEIGHT_MORE';
                        newWeight = weight + 5;
                        color = '#10B981';
                        icon = '↑↑';
                    } else if (reps < 6) {
                        action = 'REDUCE_WEIGHT';
                        newWeight = Math.round(weight * 0.9 * 2) / 2; // Redondear a 0.5
                        color = '#EF4444'; // Rojo
                        icon = '↓';
                    } else {
                        // Mantener peso, ajustar reps
                        newReps = `${targetReps} (+1-2)`;
                    }
                }

                results.push({
                    name: exerciseName,
                    weight,
                    newWeight,
                    reps,
                    newReps: extraReps ? `${newReps} (${extraReps})` : newReps,
                    action,
                    color,
                    icon
                });
            });

            if (!hasData) {
                showNotification('Completa al menos un ejercicio para calcular progresión', 'warning');
                return;
            }

            // Generar tabla de próxima sesión
            nextSessionTbody.innerHTML = results.map(r => `
                <tr>
                    <td>${r.name}</td>
                    <td style="font-weight: bold; color: ${r.color};">
                        ${r.weight > 0 ? `${r.newWeight} kg` : '-'}
                        ${r.weight > 0 && r.newWeight !== r.weight ? `<small style="color: var(--text-muted);"> (era ${r.weight})</small>` : ''}
                    </td>
                    <td>${r.newReps}</td>
                    <td style="color: ${r.color}; font-weight: bold;">
                        ${r.icon} ${r.action === 'INCREASE_WEIGHT' ? 'Subir' :
                    r.action === 'INCREASE_WEIGHT_MORE' ? 'Subir +' :
                        r.action === 'REDUCE_WEIGHT' ? 'Reducir' : 'Mantener'}
                    </td>
                </tr>
            `).join('');

            // Mostrar contenedor
            if (nextSessionContainer) {
                nextSessionContainer.classList.remove('hidden');
                nextSessionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            showNotification('✅ Progresión calculada para todos los ejercicios', 'success');
        });
    }

    /**
     * Configura auto-fill RIR cuando se cambia RPE en la tabla de registro
     */
    function setupAutoFillRIR() {
        const logTable = document.getElementById('workout-log-table');
        if (!logTable) return;

        logTable.addEventListener('input', (e) => {
            if (e.target.classList.contains('log-rpe')) {
                const rpe = parseFloat(e.target.value);
                if (!isNaN(rpe) && rpe >= 5 && rpe <= 10) {
                    const row = e.target.closest('tr');
                    const rirInput = row?.querySelector('.log-rir');
                    if (rirInput) {
                        rirInput.value = Math.round((10 - rpe) * 10) / 10;
                        // Highlight briefly
                        rirInput.style.background = 'rgba(16, 185, 129, 0.2)';
                        setTimeout(() => {
                            rirInput.style.background = 'rgba(255,255,255,0.05)';
                        }, 800);
                    }
                }
            }
            // Also auto-fill RPE from RIR if RIR is entered
            if (e.target.classList.contains('log-rir')) {
                const rir = parseFloat(e.target.value);
                if (!isNaN(rir) && rir >= -2 && rir <= 5) {
                    const row = e.target.closest('tr');
                    const rpeInput = row?.querySelector('.log-rpe');
                    if (rpeInput && !rpeInput.value) {
                        rpeInput.value = Math.round((10 - rir) * 10) / 10;
                        rpeInput.style.background = 'rgba(16, 185, 129, 0.2)';
                        setTimeout(() => {
                            rpeInput.style.background = 'rgba(255,255,255,0.05)';
                        }, 800);
                    }
                }
            }
        });
    }

    /**
     * Guarda la sesión actual en el historial y muestra el resumen
     */
    function saveSessionToHistory(routine) {
        const logTable = document.getElementById('workout-log-table');
        if (!logTable) {
            showNotification('No se encontró la tabla de registro', 'error');
            return;
        }

        const rows = logTable.querySelectorAll('tbody tr');
        const currentDay = routine.days?.[routine.currentDayIndex || 0];
        const mesocycleWeek = routine.mesocycleWeek || 1;
        const mesocycleInfo = MESOCYCLE_RIR_MAP[mesocycleWeek];

        let totalVolume = 0;
        let totalSets = 0;
        let totalRPE = 0;
        let totalRIR = 0;
        let rpeCount = 0;
        const exerciseData = [];
        const muscleVolume = {}; // sets per muscle group

        rows.forEach((row, idx) => {
            const exerciseName = row.querySelector('td')?.textContent?.trim()?.split('\n')[0]?.replace('⭐ ', '') || `Ejercicio ${idx + 1}`;
            const weight = parseFloat(row.querySelector('.log-weight')?.value) || 0;
            const reps = parseInt(row.querySelector('.log-reps')?.value) || 0;
            const rpe = parseFloat(row.querySelector('.log-rpe')?.value) || 0;
            const rir = parseFloat(row.querySelector('.log-rir')?.value);

            if (weight > 0 && reps > 0) {
                const volume = weight * reps;
                totalVolume += volume;
                totalSets++;
                if (rpe > 0) {
                    totalRPE += rpe;
                    rpeCount++;
                }
                const actualRIR = !isNaN(rir) ? rir : (10 - rpe);
                totalRIR += actualRIR;

                // Save weight for next session reference
                saveExerciseWeight(exerciseName, weight);

                // Track volume per muscle
                const muscleGroup = currentDay?.exercises?.[idx]?.muscleGroup || 'General';
                muscleVolume[muscleGroup] = (muscleVolume[muscleGroup] || 0) + 1;

                exerciseData.push({
                    name: exerciseName,
                    weight, reps, rpe,
                    rir: actualRIR,
                    volume,
                    muscleGroup
                });
            }
        });

        if (exerciseData.length === 0) {
            showNotification('Registra al menos un ejercicio antes de guardar', 'warning');
            return;
        }

        // Calculate averages
        const avgRPE = rpeCount > 0 ? (totalRPE / rpeCount).toFixed(1) : '-';
        const avgRIR = exerciseData.length > 0 ? (totalRIR / exerciseData.length).toFixed(1) : '-';

        // Build session record
        const sessionRecord = {
            id: 'session_' + Date.now(),
            date: new Date().toISOString(),
            dayName: currentDay?.name || 'Entrenamiento',
            muscles: currentDay?.muscles || [],
            methodology: routine.methodology,
            mesocycleWeek,
            mesocycleName: mesocycleInfo.name,
            targetRIR: mesocycleInfo.rir,
            exercises: exerciseData,
            stats: {
                totalVolume: Math.round(totalVolume),
                totalSets,
                avgRPE,
                avgRIR,
                exerciseCount: exerciseData.length
            },
            muscleVolume,
            rating: 0 // Will be updated by rating buttons
        };

        // Save to localStorage history
        const history = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]');
        history.unshift(sessionRecord);
        // Keep last 50 sessions
        if (history.length > 50) history.length = 50;
        localStorage.setItem('rpCoach_session_history', JSON.stringify(history));

        // Also save as last session for Progreso
        localStorage.setItem('rpCoach_last_session', JSON.stringify(sessionRecord));

        // Update summary UI
        const summaryContainer = document.getElementById('session-summary-container');
        if (summaryContainer) {
            summaryContainer.classList.remove('hidden');

            document.getElementById('summary-total-volume').textContent = Math.round(totalVolume).toLocaleString();
            document.getElementById('summary-total-sets').textContent = totalSets;
            document.getElementById('summary-avg-rpe').textContent = avgRPE;
            document.getElementById('summary-avg-rir').textContent = avgRIR;

            // Volume vs MEV/MAV/MRV per muscle
            const landmarksContainer = document.getElementById('summary-volume-landmarks');
            if (landmarksContainer) {
                landmarksContainer.innerHTML = Object.entries(muscleVolume).map(([muscle, sets]) => {
                    const muscleMap = {
                        'Pecho': 'chest', 'Espalda': 'back', 'Hombros': 'shoulders',
                        'Cuádriceps': 'quads', 'Isquiotibiales': 'hamstrings', 'Glúteos': 'glutes',
                        'Bíceps': 'biceps', 'Tríceps': 'triceps', 'Pantorrillas': 'calves',
                        'Core': 'abs', 'Brazos': 'biceps', 'Piernas': 'quads'
                    };
                    const muscleId = muscleMap[muscle] || 'chest';
                    let landmarks = { MEV: 8, MAV: 12, MRV: 20 };
                    if (window.VolumeMEVMRVModule) {
                        const vData = VolumeMEVMRVModule.getVolumeLandmarks(muscleId, routine.level || 'intermediate');
                        if (vData) {
                            landmarks = { MEV: vData.MEV || 8, MAV: vData.MAV?.high || vData.MAV || 12, MRV: vData.MRV || 20 };
                        }
                    }

                    let status, statusColor;
                    if (sets < landmarks.MEV) {
                        status = `⚠️ Bajo MEV (${landmarks.MEV})`;
                        statusColor = '#EF4444';
                    } else if (sets <= landmarks.MAV) {
                        status = `✅ En MAV (${landmarks.MEV}-${landmarks.MAV})`;
                        statusColor = '#10B981';
                    } else if (sets <= landmarks.MRV) {
                        status = `📈 Cerca MRV (${landmarks.MRV})`;
                        statusColor = '#F59E0B';
                    } else {
                        status = `🔴 Sobre MRV (${landmarks.MRV})`;
                        statusColor = '#DC2626';
                    }

                    return `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="font-size: 0.85rem;">${muscle}</span>
                            <span style="font-size: 0.8rem;"><strong>${sets}</strong> sets</span>
                            <span style="font-size: 0.75rem; color: ${statusColor};">${status}</span>
                        </div>
                    `;
                }).join('');
            }

            // Rating buttons
            summaryContainer.querySelectorAll('.session-rating-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const rating = parseInt(e.currentTarget.dataset.rating);
                    // Update record
                    sessionRecord.rating = rating;
                    const hist = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]');
                    if (hist[0]?.id === sessionRecord.id) {
                        hist[0].rating = rating;
                        localStorage.setItem('rpCoach_session_history', JSON.stringify(hist));
                    }
                    // Visual feedback
                    summaryContainer.querySelectorAll('.session-rating-btn').forEach(b => {
                        b.style.border = '2px solid rgba(255,255,255,0.2)';
                        b.style.background = 'none';
                    });
                    e.currentTarget.style.border = '2px solid #8B5CF6';
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    showNotification(`Sesión calificada: ${['😫', '😐', '💪', '🔥', '🏆'][rating - 1]}`, 'success');
                });
            });

            summaryContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        showNotification('💾 Sesión guardada en historial', 'success');
        console.log('💾 Sesión guardada:', sessionRecord);
    }

    /**
     * Importa rutina desde NEXUS
     */
    function importFromNEXUS() {
        if (!window.NEXUSBridge) {
            showNotification('Bridge de NEXUS no disponible', 'error');
            return;
        }

        const result = NEXUSBridge.importFromNEXUS();

        if (result.success) {
            showNotification(`Rutina importada: ${result.routine.methodology}`, 'success');
            showReadyToTrainState(result.routine);
        } else {
            showNotification(result.message || 'No se encontraron rutinas en NEXUS', 'warning');
        }
    }

    /**
     * Inicia el entrenamiento
     */
    function startWorkout() {
        console.log('🚀 Iniciando entrenamiento...');

        if (!window.ActiveWorkout) {
            console.error('ActiveWorkout no disponible');
            showNotification('Error: Módulo de entrenamiento no cargado', 'error');
            return;
        }

        // Verificar si hay rutina activa
        const routineData = localStorage.getItem('rpCoach_active_routine');
        if (!routineData) {
            showNotification('Primero debes crear o importar una rutina', 'warning');
            return;
        }

        const workoutState = ActiveWorkout.startWorkout();

        if (workoutState) {
            console.log('✅ Entrenamiento iniciado correctamente', workoutState);
            showActiveWorkoutUI(workoutState);
            updateActiveWorkoutDisplay();
            showNotification(`¡Entrenando ${workoutState.dayName}!`, 'success');
        } else {
            showNotification('Error al iniciar entrenamiento', 'error');
        }
    }

    /**
     * Muestra la UI de entrenamiento activo
     */
    function showActiveWorkoutUI(workoutState) {
        // Ocultar estado de no rutina/rutina lista
        const noRoutineState = document.getElementById('no-routine-state');
        if (noRoutineState) {
            noRoutineState.classList.add('hidden');
        }

        // Mostrar estado de entrenamiento activo
        const activeState = document.getElementById('active-workout-state');
        if (activeState) {
            activeState.classList.remove('hidden');
        } else {
            console.log('Creando UI de entrenamiento activo...');
            // Si no existe el estado activo, crearlo dinámicamente
            createActiveWorkoutUI(workoutState);
        }
    }

    /**
     * Crea la UI de entrenamiento activo dinámicamente si no existe
     */
    function createActiveWorkoutUI(workoutState) {
        const moduleWorkout = document.getElementById('module-workout');
        if (!moduleWorkout) return;

        // Obtener primer ejercicio para mostrar datos
        const firstEx = workoutState.exercises?.[0] || {};
        const routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || '{}');
        const params = routine.parameters || {};

        // Crear contenedor de entrenamiento activo
        const activeUI = document.createElement('div');
        activeUI.id = 'active-workout-state';
        activeUI.className = 'active-workout-container';

        activeUI.innerHTML = `
            <!-- Header con info del protocolo -->
            <div class="alert alert--info mb-2">
                <span>📋</span>
                <div style="width: 100%;">
                    <strong id="protocol-name">${routine.protocolName || 'Protocolo'}</strong>
                    <p id="protocol-description" style="font-size: 0.85rem; margin-top: 4px;">
                        ${routine.protocolDescription || 'Sigue las instrucciones de la metodología'}
                    </p>
                </div>
            </div>

            <!-- Card principal del ejercicio -->
            <div class="card card--highlight">
                <div class="card__header">
                    <h3 id="current-exercise-name" class="card__title">${firstEx.name || 'Cargando...'}</h3>
                    <span id="exercise-progress" class="rp-badge">1/${workoutState.exercises?.length || 1}</span>
                </div>
                
                <!-- Grupo muscular y tipo -->
                <div class="flex-between mb-2" style="font-size: 0.9rem; color: var(--text-muted);">
                    <span id="muscle-group">🎯 ${firstEx.muscleGroup || ''}</span>
                    <span id="exercise-type">${firstEx.isPrimary ? '⭐ Principal' : '○ Accesorio'}</span>
                </div>

                <!-- Parámetros del protocolo -->
                <div class="module-grid mb-2" style="gap: 8px;">
                    <div class="stat-box" style="padding: 8px;">
                        <div id="param-sets" class="stat-box__value" style="font-size: 1.2rem;">${firstEx.sets || params.sets || '3'}</div>
                        <div class="stat-box__label">Sets</div>
                    </div>
                    <div class="stat-box" style="padding: 8px;">
                        <div id="param-reps" class="stat-box__value" style="font-size: 1.2rem;">${firstEx.targetReps || params.reps || '8-12'}</div>
                        <div class="stat-box__label">Reps</div>
                    </div>
                    <div class="stat-box" style="padding: 8px;">
                        <div id="param-rir" class="stat-box__value" style="font-size: 1.2rem;">${firstEx.targetRIR !== undefined ? firstEx.targetRIR : 2}</div>
                        <div class="stat-box__label">RIR</div>
                    </div>
                    <div class="stat-box" style="padding: 8px;">
                        <div id="param-rest" class="stat-box__value" style="font-size: 1.2rem;">${firstEx.restSeconds || params.rest || 90}s</div>
                        <div class="stat-box__label">Descanso</div>
                    </div>
                </div>

                <!-- Tempo si aplica -->
                ${params.tempo ? `
                <div class="alert alert--warning mb-2" style="padding: 8px;">
                    <span>⏱️</span>
                    <span><strong>Tempo:</strong> ${params.tempo} (Concéntrico-Pausa-Excéntrico)</span>
                </div>
                ` : ''}

                <!-- Load si aplica -->
                ${params.load ? `
                <div class="alert mb-2" style="padding: 8px; background: rgba(59, 130, 246, 0.1);">
                    <span>🏋️</span>
                    <span><strong>Carga:</strong> ${params.load}</span>
                </div>
                ` : ''}

                <!-- Progreso de sets -->
                <div class="flex-between mb-2">
                    <span id="set-progress">Set <strong>1</strong> de ${firstEx.sets || 3}</span>
                    <span id="target-rir">RIR → <strong>${firstEx.targetRIR !== undefined ? firstEx.targetRIR : 2}</strong></span>
                </div>

                <!-- Inputs del set -->
                <div class="module-grid">
                    <div class="form-group">
                        <label class="form-label">Peso (kg)</label>
                        <input type="number" id="workout-weight" class="form-input" placeholder="0" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Reps realizadas</label>
                        <input type="number" id="workout-reps" class="form-input" placeholder="${getFirstNumber(firstEx.targetReps) || 10}">
                    </div>
                </div>

                <!-- RPE Slider -->
                <div class="form-group mt-2">
                    <label class="form-label flex-between">
                        <span>📊 RPE (Esfuerzo)</span>
                        <span id="workout-rpe-value" class="text-primary">7</span>
                    </label>
                    <input type="range" id="workout-rpe" class="range-slider" min="5" max="10" step="0.5" value="7">
                    <div class="range-value" style="font-size: 0.75rem;">
                        <span>5-Fácil</span>
                        <span>7-8 Moderado</span>
                        <span>10-Fallo</span>
                    </div>
                </div>

                <!-- Intensificadores -->
                <div id="intensifiers-section" class="mt-2" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                    <label class="form-label">💪 Técnicas Intensificadoras Usadas:</label>
                    <div id="intensifier-checkboxes" class="intensifier-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px;">
                        ${generateIntensifierCheckboxes(firstEx.availableIntensifiers || params.intensifiers || [])}
                    </div>
                </div>

                <button id="btn-complete-set" class="btn btn--primary btn--block mt-2"
                    style="background: linear-gradient(135deg, #10B981, #059669); font-size: 1.1rem; padding: 1rem;">
                    ✓ SET COMPLETADO
                </button>
            </div>

            <!-- Feedback del set -->
            <div id="set-feedback" class="alert mt-2 hidden">
                <span id="feedback-icon">✅</span>
                <div>
                    <strong id="feedback-message">¡Perfecto!</strong>
                    <p id="feedback-suggestion">Justo en el target RIR</p>
                </div>
            </div>

            <!-- Timer de descanso -->
            <div id="workout-timer" class="card mt-2 hidden" style="text-align: center;">
                <h4>⏱️ Descanso</h4>
                <span id="timer-countdown" class="stat-box__value" style="font-size: 2.5rem; display: block;">02:00</span>
                <p id="timer-rest-type" class="text-muted" style="font-size: 0.85rem;">Descanso estándar</p>
                <button id="btn-skip-timer" class="btn btn--secondary btn--block mt-1">
                    ⏭️ Saltar Timer
                </button>
            </div>

            <!-- Sets completados -->
            <div class="card mt-2">
                <h4>📋 Sets Completados</h4>
                <div id="completed-sets-list" class="mt-1">
                    <p class="text-muted">Aún no has completado sets</p>
                </div>
            </div>

            <!-- Botones de control -->
            <button id="btn-finish-exercise" class="btn btn--secondary btn--block mt-2">
                ⏭️ Terminar Ejercicio
            </button>
            <button id="btn-cancel-workout" class="btn btn--secondary btn--block mt-1" style="opacity: 0.6;">
                ❌ Cancelar Entrenamiento
            </button>
        `;

        moduleWorkout.appendChild(activeUI);

        // Configurar event listeners para los nuevos elementos
        setupActiveWorkoutListeners();

        // Actualizar cache de elementos
        cacheElements();
    }

    /**
     * Genera checkboxes para intensificadores
     */
    function generateIntensifierCheckboxes(intensifiers) {
        if (!intensifiers || intensifiers.length === 0) {
            return '<span class="text-muted">Sin técnicas adicionales para este protocolo</span>';
        }

        return intensifiers.map((int, idx) => `
            <label class="checkbox-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                <input type="checkbox" class="intensifier-checkbox" value="${int}" id="int-${idx}">
                <span style="font-size: 0.85rem;">${int}</span>
            </label>
        `).join('');
    }

    /**
     * Obtiene el primer número de un string de reps
     */
    function getFirstNumber(repsStr) {
        if (typeof repsStr === 'number') return repsStr;
        if (!repsStr) return 10;
        const match = repsStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 10;
    }

    /**
     * Configura listeners para los elementos de entrenamiento activo
     */
    function setupActiveWorkoutListeners() {
        // RPE Slider
        const rpeSlider = document.getElementById('workout-rpe');
        if (rpeSlider) {
            rpeSlider.addEventListener('input', () => {
                const valueEl = document.getElementById('workout-rpe-value');
                if (valueEl) valueEl.textContent = rpeSlider.value;
            });
        }

        // Botón Completar Set
        const btnComplete = document.getElementById('btn-complete-set');
        if (btnComplete) {
            btnComplete.addEventListener('click', completeSet);
        }

        // Botón Saltar Timer
        const btnSkip = document.getElementById('btn-skip-timer');
        if (btnSkip) {
            btnSkip.addEventListener('click', skipTimer);
        }

        // Botón Terminar Ejercicio
        const btnFinish = document.getElementById('btn-finish-exercise');
        if (btnFinish) {
            btnFinish.addEventListener('click', () => {
                if (window.ActiveWorkout) {
                    const nextEx = ActiveWorkout.nextExercise();
                    if (nextEx) {
                        updateActiveWorkoutDisplay();
                        showNotification(`Siguiente: ${nextEx.name}`, 'info');
                    } else {
                        finishWorkout();
                    }
                }
            });
        }

        // Botón Cancelar
        const btnCancel = document.getElementById('btn-cancel-workout');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                if (confirm('¿Seguro que quieres cancelar el entrenamiento?')) {
                    if (window.ActiveWorkout) ActiveWorkout.cancelWorkout();
                    location.reload();
                }
            });
        }
    }

    /**
     * Actualiza el display del entrenamiento activo
     */
    function updateActiveWorkoutDisplay() {
        if (!window.ActiveWorkout) return;

        const exercise = ActiveWorkout.getCurrentExercise();
        if (!exercise) {
            console.log('No hay ejercicio actual');
            return;
        }

        console.log('📋 Ejercicio actual:', exercise);

        // Obtener parámetros actualizados del protocolo
        const params = window.MethodologyEngine?.getCurrentParameters() || {};
        const routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || '{}');

        // Actualizar nombre del ejercicio
        const nameEl = document.getElementById('current-exercise-name');
        if (nameEl) nameEl.textContent = exercise.name;

        // Actualizar grupo muscular
        const muscleEl = document.getElementById('muscle-group');
        if (muscleEl) muscleEl.textContent = `🎯 ${exercise.muscleGroup || ''}`;

        // Actualizar progreso de ejercicio
        const progressEl = document.getElementById('exercise-progress');
        if (progressEl) progressEl.textContent = `${exercise.exerciseNumber}/${exercise.totalExercises}`;

        // Actualizar progreso de set
        const setProgressEl = document.getElementById('set-progress');
        if (setProgressEl) setProgressEl.innerHTML = `Set <strong>${exercise.setNumber}</strong> de ${exercise.totalSets}`;

        // Actualizar RIR target
        const rirEl = document.getElementById('target-rir');
        if (rirEl) rirEl.innerHTML = `RIR → <strong>${exercise.targetRIR !== undefined ? exercise.targetRIR : params.rir || 2}</strong>`;

        // Actualizar parámetros en stat boxes
        const paramSets = document.getElementById('param-sets');
        if (paramSets) paramSets.textContent = exercise.sets || params.sets || '3';

        const paramReps = document.getElementById('param-reps');
        if (paramReps) paramReps.textContent = exercise.targetReps || params.reps || '8-12';

        const paramRir = document.getElementById('param-rir');
        if (paramRir) paramRir.textContent = exercise.targetRIR !== undefined ? exercise.targetRIR : (params.rir || 2);

        const paramRest = document.getElementById('param-rest');
        if (paramRest) {
            const restValue = exercise.restSeconds || params.rest || 90;
            paramRest.textContent = `${restValue}s`;
        }

        // Actualizar tempo si existe (crear/actualizar elemento)
        updateProtocolDetail('tempo-display', '⏱️ Tempo:', params.tempo, 'Concéntrico-Pausa-Excéntrico');

        // Actualizar load si existe
        updateProtocolDetail('load-display', '🏋️ Carga:', params.load);

        // Actualizar failures/tipo de fallo si existe
        updateProtocolDetail('failures-display', '🎯 Fallo:', params.failures);

        // Actualizar intensificadores disponibles
        const intensifiersContainer = document.getElementById('intensifier-checkboxes');
        if (intensifiersContainer && (exercise.availableIntensifiers || params.intensifiers)) {
            intensifiersContainer.innerHTML = generateIntensifierCheckboxes(
                exercise.availableIntensifiers || params.intensifiers || []
            );
        }

        // Actualizar sugerencia
        const suggestionEl = document.getElementById('suggestion-text');
        if (suggestionEl && exercise.suggestion) {
            suggestionEl.textContent = exercise.suggestion.message;
        }

        // Actualizar placeholders
        const weightEl = document.getElementById('workout-weight');
        if (weightEl && exercise.suggestion?.weight) {
            weightEl.placeholder = exercise.suggestion.weight;
        }

        const repsEl = document.getElementById('workout-reps');
        if (repsEl) {
            const targetReps = typeof exercise.targetReps === 'string'
                ? exercise.targetReps.match(/\d+/)?.[0] || '10'
                : exercise.targetReps || 10;
            repsEl.placeholder = targetReps;
        }
    }

    /**
     * Actualiza o crea un elemento de detalle del protocolo
     */
    function updateProtocolDetail(elementId, label, value, suffix = '') {
        let container = document.getElementById(elementId);
        const parent = document.getElementById('active-workout-state')?.querySelector('.card--highlight');

        if (!value) {
            // Si no hay valor, ocultar el elemento si existe
            if (container) container.style.display = 'none';
            return;
        }

        if (!container && parent) {
            // Crear el elemento si no existe
            container = document.createElement('div');
            container.id = elementId;
            container.className = 'alert mb-2';
            container.style.padding = '8px';
            container.style.background = 'rgba(59, 130, 246, 0.1)';

            // Insertar después de los parámetros principales
            const moduleGrid = parent.querySelector('.module-grid');
            if (moduleGrid) {
                moduleGrid.parentNode.insertBefore(container, moduleGrid.nextSibling);
            }
        }

        if (container) {
            container.style.display = 'block';
            container.innerHTML = `<span><strong>${label}</strong> ${value}${suffix ? ` (${suffix})` : ''}</span>`;
        }
    }

    /**
     * Completa un set
     */
    function completeSet() {
        if (!window.ActiveWorkout) return;

        const setData = {
            weight: elements.workoutWeight?.value,
            reps: elements.workoutReps?.value,
            rpe: elements.workoutRpe?.value
        };

        const result = ActiveWorkout.completeSet(setData);

        if (result) {
            // Mostrar feedback
            showSetFeedback(result.feedback);

            // Añadir a lista de sets completados
            addCompletedSetToList(result.setRecord);

            // Limpiar inputs
            if (elements.workoutWeight) elements.workoutWeight.value = '';
            if (elements.workoutReps) elements.workoutReps.value = '';

            if (result.needsFeedback) {
                // Mostrar modal de feedback del ejercicio
                showExerciseFeedbackModal();
            } else {
                // Iniciar timer de descanso
                startRestTimer();
                // Actualizar display
                updateActiveWorkoutDisplay();
            }
        }
    }

    /**
     * Muestra feedback del set
     */
    function showSetFeedback(feedback) {
        if (!elements.setFeedback) return;

        elements.setFeedback.classList.remove('hidden', 'alert--success', 'alert--warning', 'alert--danger', 'alert--info');
        elements.setFeedback.classList.add(`alert--${feedback.type === 'optimal' ? 'success' : feedback.type}`);

        if (elements.feedbackIcon) elements.feedbackIcon.textContent = feedback.icon;
        if (elements.feedbackMessage) elements.feedbackMessage.textContent = feedback.message;
        if (elements.feedbackSuggestion) elements.feedbackSuggestion.textContent = feedback.suggestion;

        // Ocultar después de 3 segundos
        setTimeout(() => {
            elements.setFeedback.classList.add('hidden');
        }, 3000);
    }

    /**
     * Añade set completado a la lista
     */
    function addCompletedSetToList(setRecord) {
        if (!elements.completedSetsList) return;

        // Limpiar mensaje inicial si existe
        if (elements.completedSetsList.querySelector('.text-muted')) {
            elements.completedSetsList.innerHTML = '';
        }

        const setElement = document.createElement('div');
        setElement.className = 'flex-between mb-1 p-1';
        setElement.style.background = 'rgba(16, 185, 129, 0.1)';
        setElement.style.borderRadius = '8px';
        setElement.innerHTML = `
            <span>Set ${setRecord.setNumber}</span>
            <span><strong>${setRecord.weight}kg</strong> x ${setRecord.reps} @ RPE ${setRecord.rpe}</span>
        `;

        elements.completedSetsList.appendChild(setElement);
    }

    /**
     * Inicia timer de descanso
     */
    function startRestTimer() {
        if (!elements.workoutTimer) return;

        // Obtener tiempo de descanso dinámico desde MethodologyEngine
        const currentMethod = window.MethodologyEngine?.methodology;
        const params = window.MethodologyEngine?.getCurrentParameters();
        const exercise = window.ActiveWorkout?.getCurrentExercise();
        const setNumber = exercise?.setNumber || 1;

        // Usar RestTimerModule si está disponible para rest dinámico
        let restConfig;
        if (window.RestTimerModule?.getRestConfig) {
            restConfig = window.RestTimerModule.getRestConfig(currentMethod, setNumber);
        }

        let restSeconds = restConfig?.default || params?.rest || 90;
        let restTypeText = 'Descanso estándar';

        // Manejar rest arrays (SST-RIV variado por set)
        if (restConfig?.isVariableRest && restConfig.restArray) {
            const restIndex = Math.min(setNumber - 1, restConfig.restArray.length - 1);
            restSeconds = restConfig.restArray[restIndex];
            restTypeText = `Descanso progresivo: Set ${setNumber} = ${restSeconds}s`;
        } else if (restConfig?.note) {
            restTypeText = restConfig.note;
        }

        elements.workoutTimer.classList.remove('hidden');

        // Actualizar info del tipo de descanso
        const restTypeEl = document.getElementById('timer-rest-type');
        if (restTypeEl) {
            restTypeEl.textContent = restTypeText;
        }

        const updateTimer = () => {
            const mins = Math.floor(restSeconds / 60);
            const secs = restSeconds % 60;
            if (elements.timerCountdown) {
                elements.timerCountdown.textContent =
                    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }

            if (restSeconds <= 0) {
                elements.workoutTimer.classList.add('hidden');
                // Notificar que terminó el descanso
                showNotification('¡Tiempo de descanso terminado!', 'info');
            } else {
                restSeconds--;
                setTimeout(updateTimer, 1000);
            }
        };

        updateTimer();
    }

    /**
     * Salta el timer de descanso
     */
    function skipTimer() {
        if (elements.workoutTimer) {
            elements.workoutTimer.classList.add('hidden');
        }
    }

    /**
     * Muestra modal de feedback del ejercicio
     */
    function showExerciseFeedbackModal() {
        if (elements.exerciseFeedbackModal) {
            elements.exerciseFeedbackModal.classList.remove('hidden');
        }
    }

    /**
     * Envía feedback y avanza al siguiente ejercicio
     */
    function submitFeedbackAndNext() {
        if (!window.ActiveWorkout) return;

        const feedback = {
            pump: elements.feedbackPump?.value || 3,
            jointComfort: elements.feedbackJoints?.value || 4
        };

        ActiveWorkout.submitExerciseFeedback(feedback);

        // Ocultar modal
        if (elements.exerciseFeedbackModal) {
            elements.exerciseFeedbackModal.classList.add('hidden');
        }

        // Limpiar lista de sets
        if (elements.completedSetsList) {
            elements.completedSetsList.innerHTML = '<p class="text-muted">Aún no has completado sets</p>';
        }

        // Avanzar al siguiente ejercicio
        const nextExercise = ActiveWorkout.nextExercise();

        if (nextExercise) {
            updateActiveWorkoutDisplay();
            showNotification(`Siguiente: ${nextExercise.name}`, 'info');
        } else {
            // Entrenamiento terminado
            finishWorkout();
        }
    }

    /**
     * Finaliza el entrenamiento
     */
    function finishWorkout() {
        if (!window.ActiveWorkout) return;

        const summary = ActiveWorkout.finishWorkout();

        if (summary) {
            showWorkoutSummary(summary);
        }
    }

    /**
     * Muestra resumen del entrenamiento
     */
    function showWorkoutSummary(summary) {
        if (!elements.activeWorkoutState) return;

        elements.activeWorkoutState.innerHTML = `
            <div class="card card--highlight">
                <div class="card__header">
                    <h3 class="card__title">🎉 ¡Entrenamiento Completado!</h3>
                </div>
                <div class="dashboard-grid">
                    <div class="stat-box">
                        <div class="stat-box__value">${summary.stats.totalSets}</div>
                        <div class="stat-box__label">Sets Totales</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box__value">${summary.stats.totalVolume.toLocaleString()}</div>
                        <div class="stat-box__label">Volumen (kg)</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box__value">${summary.duration}</div>
                        <div class="stat-box__label">Minutos</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box__value">${summary.stats.avgRPE}</div>
                        <div class="stat-box__label">RPE Promedio</div>
                    </div>
                </div>
                <button id="btn-new-workout" class="btn btn--primary btn--block mt-2">
                    🔄 Nuevo Entrenamiento
                </button>
            </div>
        `;

        document.getElementById('btn-new-workout')?.addEventListener('click', () => {
            location.reload();
        });
    }

    /**
     * Muestra notificación
     */
    function showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `alert alert--${type}`;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.animation = 'fadeIn 0.3s ease';
        notification.innerHTML = `<span>${message}</span>`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Maneja cambio de metodología global
     */
    function handleMethodologyChange(event) {
        updateMethodologyPreview();
    }

    /**
     * Maneja cambio de protocolo global
     */
    function handleProtocolChange(event) {
        updateMethodologyPreview();
    }

    /**
     * Actualiza estado de la UI según datos existentes
     */
    function updateUIState() {
        // Verificar si hay rutina activa
        const routine = localStorage.getItem('rpCoach_active_routine');
        if (routine) {
            const parsedRoutine = JSON.parse(routine);
            showReadyToTrainState(parsedRoutine);
        }

        // Verificar si hay entrenamiento en progreso
        if (window.ActiveWorkout?.isWorkoutActive()) {
            showActiveWorkoutUI();
            updateActiveWorkoutDisplay();
        }
    }

    /**
     * Calcula iterativamente los valores paramétricos de los 5 microciclos S1-S5
     * para enviarlos a la gráfica dinámicamente según nivel y metodología (precisión real).
     */
    function getMesocycleRenderData(methodology, level) {
        const split = 'bro_split'; // Neutro para cálculo de parámetros
        let volData = [];
        let rirData = [];
        let loadData = [];

        for (let week = 1; week <= 5; week++) {
            const weekProtocolId = getProtocolForWeek(methodology, level, week);
            const protocol = weekProtocolId || (methodology === 'GVT' ? 'GVT-10x10' : 'Y3T-W1');

            let routine;
            if (window.RoutineGenerator && typeof RoutineGenerator.createRoutine === 'function') {
                routine = RoutineGenerator.createRoutine({ methodology, protocol, split, level });
            }
            if (!routine) {
                routine = createBasicRoutine(methodology, protocol, split, level);
            }

            if (routine.parameters) {
                routine.parameters = adaptParamsToMesocycle(routine.parameters, week);
            }

            // Extraer Volume base y modular según la fase
            let sets = parseInt(routine.parameters?.sets) || 3;
            // Simulamos lo mismo para la gráfica central
            if (week === 2) sets += 0.5;
            else if (week === 3) sets += 1;
            else if (week === 4) sets += 2; // Peak week MRV
            else if (week === 5) sets = Math.max(Math.floor(sets * 0.5), 1);

            // Extraer RIR 
            let rir = parseInt(routine.parameters?.rir) || 0;

            // Convertir RIR a Esfuerzo Visual (0 a 100) donde 4 = Min y 0 = Max
            let rirScore = 100;
            if (rir >= 4) rirScore = 15;
            else if (rir === 3) rirScore = 40;
            else if (rir === 2) rirScore = 65;
            else if (rir === 1) rirScore = 85;
            else if (rir === 0) rirScore = 100;

            // Si hay intensificadores (y no es deload) aumenta drásticamente el esfuerzo simulado
            if (routine.parameters?.intensifiers?.length > 0 && week !== 5) {
                rirScore = Math.min(rirScore + 15, 100);
            }

            // HIT effort base correction (siempre arrastran extremo RIR 0 fallos)
            const mLowerCase = (methodology || '').toLowerCase();
            if (mLowerCase.includes('heavy') || mLowerCase.includes('blood') || mLowerCase.includes('dc')) {
                if (week !== 5) { rirScore = Math.min(rirScore + 25, 100); }
            }

            // Cargas/Intensidad simulada para la gráfica (sobrecarga progresiva)
            let loadScore = 70; // score base
            if (week === 1) loadScore = 60;
            else if (week === 2) loadScore = 75;
            else if (week === 3) loadScore = 85;
            else if (week === 4) loadScore = 100;
            else if (week === 5) loadScore = 50;

            volData.push(sets);
            rirData.push(rirScore);
            loadData.push(loadScore);
        }

        // Normalizar volumen a Porcentajes base del Max Volume
        const maxVol = Math.max(...volData);
        let maxTheoreticalVol = maxVol;
        if (level === 'advanced' && methodology.toLowerCase().includes('gvt')) maxTheoreticalVol = 12; // GVT
        else if (level === 'advanced') maxTheoreticalVol = 6;
        else if (level === 'beginner') maxTheoreticalVol = 4;
        else maxTheoreticalVol = 5;

        maxTheoreticalVol = Math.max(maxTheoreticalVol, maxVol);
        const volDataPercent = volData.map(v => Math.round((v / maxTheoreticalVol) * 100));

        return { volData: volDataPercent, effData: rirData, intData: loadData, rawSets: volData };
    }

    // Inicializar cuando DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API Pública
    return {
        init,
        showCreateModal,
        hideCreateModal,
        generateRoutine,
        startWorkout,
        updateUIState,
        getMesocycleRenderData
    };
})();

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.WorkoutUIController = WorkoutUIController;
}
