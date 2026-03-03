/**
 * NEXUS-RP Coach - Controlador Principal
 * 
 * Orquesta todos los módulos y maneja la interfaz de usuario
 */

const RPCoachApp = (() => {
    // Estado de la aplicación
    let state = {
        currentModule: 'profile',
        selectedMethodology: 'Y3T',
        currentWeek: 1,
        experienceLevel: 'intermediate'
    };

    /**
     * Diccionario de Tips Específicos por Metodología (Radar de Adaptación)
     */
    const METHODOLOGY_RADAR_TIPS = {
        'Y3T': 'Fase Y3T activa. Recuerda: Semana 1 (Fuerza, Tipo IIb), Semana 2 (Hipertrofia, Tipo IIa), Semana 3 (Aniquilación, Tipo I). Ajusta tu hidratación en la semana 3.',
        'Heavy Duty': 'Heavy Duty: Solo 1 o 2 series de trabajo reales al fallo absoluto. Si puedes hacer otra serie, la primera no fue lo suficientemente dura. Prioriza la recuperación neuronal.',
        'FST7': 'FST-7: En las 7 series finales, el objetivo principal es el estiramiento de la fascia y el máximo bombeo (Pump). Bebe agua intra-entreno y estira entre series.',
        'PHAT': 'PHAT: Combina días de Potencia pura con días de Hipertrofia de alto volumen. No intentes mezclar las intenciones: sé explosivo en potencia, controla el tempo en hipertrofia.',
        'PHUL': 'PHUL: Separa claramente tus días Upper/Lower enfocados en fuerza y tus días enfocados en hipertrofia. Registra tus marcas de fuerza para asegurar progresión.',
        'PushPullLegs': 'PPL: Volumen sostenido. Si te sientes muy cansado al repetir el 4to día, añade un día de descanso (PPL-Descanso-PPL).',
        'UpperLower': 'Upper/Lower: Excelente para alta frecuencia. Asegúrate de que el MRV (Volumen Máximo Recuperable) no se sobrepase en los días Upper.',
        'BroSplit': 'Bro Split: Como entrenas el músculo 1 vez por semana, necesitas alcanzar el MRV en esa única sesión. El nivel de disrupción (SFR) debe ser máximo.',
        'DC': 'Doggcrapp: Calentamiento, un working set con rest-pauses hasta 11-15 reps, y estiramiento extremo. Si no vences tu libreta hoy, el ejercicio se rota.',
        'GVT': 'GVT (10x10): El peso no cambia, el descanso es estricto (60-90s). El objetivo es la hipertrofia sarcoplasmática extrema. Si completas 10x10, sube 5% el peso.',
        'DUP': 'DUP: Hoy la intensidad y reps cambian respecto a tu sesión anterior. Revisa bien tu objetivo del día (Fuerza, Hipertrofia o Potencia) antes de calentar.',
        '531': '5/3/1: Progresión lenta y segura a largo plazo. No quemes el sistema nervioso en tus series AMRAP. Deja siempre 1-2 repeticiones en el tanque a menos que estés probando PRs.'
    };

    /**
     * Inicializa la aplicación
     */
    async function init() {
        console.log('🚀 Iniciando NEXUS-RP Coach...');

        // Cargar estado guardado
        loadState();

        // Inicializar módulos
        await initializeModules();

        // Configurar event listeners
        setupEventListeners();

        // Renderizar vista inicial
        renderCurrentModule();

        console.log('✅ NEXUS-RP Coach inicializado');
    }

    /**
     * Carga el estado guardado del localStorage
     */
    function loadState() {
        const saved = localStorage.getItem('rpCoach_appState');
        if (saved) {
            state = { ...state, ...JSON.parse(saved) };
        }
    }

    /**
     * Guarda el estado actual
     */
    function saveState() {
        localStorage.setItem('rpCoach_appState', JSON.stringify(state));
    }

    /**
     * Inicializa todos los módulos
     */
    async function initializeModules() {
        // Cargar metodologías
        if (window.MethodologiesSyncModule) {
            await MethodologiesSyncModule.loadMethodologies();
            await populateMethodologySelector();
        }

        // Inicializar Calculadora de RM
        if (window.RMCalculatorModule) {
            RMCalculatorModule.initAll();
        }
    }

    /**
     * Llena el selector de metodologías
     */
    async function populateMethodologySelector() {
        const selector = document.getElementById('methodology-selector');
        if (!selector) return;

        const methodologies = await MethodologiesSyncModule.getMethodologyList();

        selector.innerHTML = methodologies.map(m =>
            `<option value="${m.id}" ${m.id === state.selectedMethodology ? 'selected' : ''}>
                ${m.name}
            </option>`
        ).join('');
    }

    /**
     * Configura los event listeners
     */
    function setupEventListeners() {
        // Navegación por tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const module = e.currentTarget.dataset.module;
                switchModule(module);
            });
        });

        // Selector de metodología
        const methodSelector = document.getElementById('methodology-selector');
        if (methodSelector) {
            methodSelector.addEventListener('change', (e) => {
                state.selectedMethodology = e.target.value;
                saveState();
                updateModuleWithMethodology();
            });
        }

        // Selector de semana
        const weekSelector = document.getElementById('week-selector');
        if (weekSelector) {
            weekSelector.addEventListener('change', (e) => {
                state.currentWeek = parseInt(e.target.value);
                saveState();
                updateRIRDisplay();
            });
        }

        // Formulario de session logger
        setupSessionLoggerListeners();

        // Formulario de sobrecarga progresiva
        setupProgressiveOverloadListeners();

        // Botón Evaluar Readiness
        const btnEvalReadiness = document.getElementById('btn-eval-readiness');
        if (btnEvalReadiness) {
            btnEvalReadiness.addEventListener('click', evaluateReadiness);
        }
    }

    /**
     * Evalúa el estado actual de Readiness (Pre-entrenamiento)
     */
    function evaluateReadiness() {
        const sleep = parseInt(document.getElementById('readiness-sleep').value) || 3;
        const stress = parseInt(document.getElementById('readiness-stress').value) || 3;
        const doms = parseInt(document.getElementById('readiness-doms').value) || 3;
        const badge = document.getElementById('readiness-score-badge');
        const feedback = document.getElementById('readiness-feedback');

        const totalScore = sleep + stress + doms;

        if (totalScore >= 13) {
            badge.textContent = '🚀 Óptimo';
            badge.style.background = '#10B981'; // Green
            feedback.innerHTML = '<span style="color:#10B981">Condiciones perfectas. Empuja la progresión planificada o intenta un PR.</span>';
        } else if (totalScore >= 9) {
            badge.textContent = '🟡 Normal';
            badge.style.background = '#F59E0B'; // Yellow
            feedback.innerHTML = '<span style="color:#F59E0B">Estado estándar. Sigue el RIR prescrito por tu mesociclo.</span>';
        } else {
            badge.textContent = '⚠️ Fatiga Alta';
            badge.style.background = '#EF4444'; // Red
            feedback.innerHTML = '<span style="color:#EF4444">Advertencia: Considera reducir 1 RIR o quitar 1 serie por ejercicio hoy para evitar lesiones o sobreentrenamiento.</span>';
        }
    }

    /**
     * Cambia el módulo activo
     */
    function switchModule(moduleName) {
        state.currentModule = moduleName;
        saveState();

        // Actualizar tabs activas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.module === moduleName);
        });

        // Mostrar/ocultar secciones
        document.querySelectorAll('.module-section').forEach(section => {
            section.classList.toggle('hidden', section.id !== `module-${moduleName}`);
        });

        renderCurrentModule();
    }

    /**
     * Renderiza el módulo actual
     */
    function renderCurrentModule() {
        switch (state.currentModule) {
            case 'profile':
                renderProfile();
                break;
            case 'biodata':
                renderBiodata();
                break;
            case 'nutrition':
                renderNutrition();
                break;
            case 'workout':
                // El wizard ya está visible en el HTML
                break;
            case 'routine-display':
                renderRoutineDisplay();
                break;
            case 'progress':
                renderProgress();
                break;
            case 'rir':
                renderRIR();
                break;
            case 'logger':
                renderSessionLogger();
                break;
            case 'overload':
                renderProgressiveOverload();
                break;
        }
    }

    /**
     * Renderiza el módulo de DATOS (Bioimpedancia)
     */
    function renderBiodata() {
        if (typeof BioimpedanciaRP !== 'undefined') {
            BioimpedanciaRP.init();
        }
    }

    /**
     * Renderiza el módulo de NUTRICIÓN
     */
    function renderNutrition() {
        if (typeof NutricionRP !== 'undefined') {
            NutricionRP.init();
        }
    }

    // renderDashboard() y updateAutoregulationStatus() eliminados — lógica integrada en renderProgress()

    /**
     * Renderiza el módulo de PERFIL
     */
    function renderProfile() {
        // Cargar datos guardados
        const savedProfile = localStorage.getItem('rpCoach_profile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);

            // Llenar formulario con datos guardados
            if (profile.name) document.getElementById('profile-name').value = profile.name;
            if (profile.weight) document.getElementById('profile-weight').value = profile.weight;
            if (profile.height) document.getElementById('profile-height').value = profile.height;
            if (profile.age) document.getElementById('profile-age').value = profile.age;
            if (profile.level) document.getElementById('profile-level').value = profile.level;
            if (profile.days) document.getElementById('profile-days').value = profile.days;

            // Mostrar resumen
            showProfileSummary(profile);
        }

        // Configurar evento de guardar
        const saveBtn = document.getElementById('btn-save-profile');
        if (saveBtn && !saveBtn.hasListener) {
            saveBtn.hasListener = true;
            saveBtn.addEventListener('click', saveProfile);
        }
    }

    /**
     * Guarda el perfil del usuario
     */
    function saveProfile() {
        const profile = {
            name: document.getElementById('profile-name')?.value || '',
            weight: parseFloat(document.getElementById('profile-weight')?.value) || 0,
            height: parseInt(document.getElementById('profile-height')?.value) || 0,
            age: parseInt(document.getElementById('profile-age')?.value) || 0,
            level: document.getElementById('profile-level')?.value || 'intermediate',
            goal: 'hypertrophy', // Objetivo por defecto ahora que se ocultó la selección
            days: parseInt(document.getElementById('profile-days')?.value) || 4
        };

        localStorage.setItem('rpCoach_profile', JSON.stringify(profile));

        // Actualizar nivel en el estado
        state.experienceLevel = profile.level;
        saveState();

        // Sincronizar nivel con el wizard de rutina
        const routineLevel = document.getElementById('routine-level');
        if (routineLevel) {
            routineLevel.value = profile.level;
        }

        showProfileSummary(profile);
        showNotification('✅ Perfil guardado correctamente');
    }

    /**
     * Muestra el resumen del perfil guardado
     */
    function showProfileSummary(profile) {
        const summary = document.getElementById('profile-summary');
        const content = document.getElementById('profile-summary-content');

        if (summary && content && profile.name) {
            summary.classList.remove('hidden');

            const levelLabels = {
                beginner: '🌱 Principiante',
                intermediate: '💪 Intermedio',
                advanced: '🔥 Avanzado'
            };

            const goalLabels = {
                hypertrophy: '💪 Hipertrofia',
                strength: '🏋️ Fuerza',
                recomposition: '⚖️ Recomposición',
                cutting: '🔥 Definición'
            };

            content.innerHTML = `
                <div class="module-grid mt-2" style="gap: 10px;">
                    <div class="stat-box" style="padding: 10px;">
                        <div class="stat-box__value" style="font-size: 1.2rem;">${profile.name}</div>
                        <div class="stat-box__label">Nombre</div>
                    </div>
                    <div class="stat-box" style="padding: 10px;">
                        <div class="stat-box__value" style="font-size: 1.2rem;">${profile.weight}kg</div>
                        <div class="stat-box__label">Peso</div>
                    </div>
                    <div class="stat-box" style="padding: 10px;">
                        <div class="stat-box__value" style="font-size: 1.2rem;">${levelLabels[profile.level] || profile.level}</div>
                        <div class="stat-box__label">Nivel</div>
                    </div>
                    <div class="stat-box" style="padding: 10px;">
                        <div class="stat-box__value" style="font-size: 1.2rem;">${profile.days} días</div>
                        <div class="stat-box__label">Frecuencia</div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Renderiza el módulo de RUTINA (parámetros de la rutina generada)
     */
    function renderRoutineDisplay() {
        const savedRoutine = localStorage.getItem('rpCoach_currentRoutine');
        const noRoutineMsg = document.getElementById('no-routine-message');
        const routineContent = document.getElementById('routine-display-content');

        if (!savedRoutine) {
            if (noRoutineMsg) noRoutineMsg.classList.remove('hidden');
            if (routineContent) routineContent.classList.add('hidden');
            return;
        }

        const routine = JSON.parse(savedRoutine);

        if (noRoutineMsg) noRoutineMsg.classList.add('hidden');
        if (routineContent) routineContent.classList.remove('hidden');

        // Actualizar badge con metodología
        const badge = document.getElementById('routine-methodology-badge');
        if (badge) badge.textContent = routine.methodology || 'Sin rutina';

        // Actualizar parámetros principales
        document.getElementById('param-sets').textContent = routine.sets || '3-4';
        document.getElementById('param-reps').textContent = routine.reps || '6-10';
        document.getElementById('param-rir').textContent = routine.rir || '2';
        document.getElementById('param-rest').textContent = routine.rest || '150s';

        // Actualizar detalles del ciclo
        document.getElementById('detail-methodology').textContent = routine.methodology || '-';
        document.getElementById('detail-protocol').textContent = routine.protocol || '-';
        document.getElementById('detail-split').textContent = routine.split || '-';
        document.getElementById('detail-level').textContent = routine.level || '-';
        document.getElementById('detail-intensifiers').textContent = routine.intensifiers || '-';
        document.getElementById('detail-tempo').textContent = routine.tempo || '-';

        // === Renderizar Radar de Metodología ===
        const radarName = document.getElementById('radar-methodology-name');
        const radarTip = document.getElementById('radar-methodology-tip');
        if (radarName && radarTip) {
            const rawMethodology = routine.methodology || '';
            const keyMethodology = Object.keys(METHODOLOGY_RADAR_TIPS).find(k => rawMethodology.includes(k)) || 'Y3T';
            radarName.textContent = `🎯 Focus ${rawMethodology}`;
            radarTip.textContent = METHODOLOGY_RADAR_TIPS[keyMethodology] || 'Sigue las orientaciones de tu protocolo seleccionado.';
        }

        // === Renderizar estadísticas del dashboard (ahora en Feedback) ===
        renderDashboardStats();

        // === Cargar última sesión (desde historial nuevo o SessionLoggerModule) ===
        const lastSessionContainer = document.getElementById('last-session-summary');
        if (lastSessionContainer) {
            // Intentar primero el historial nuevo de ENTRENAR
            const savedSession = JSON.parse(localStorage.getItem('rpCoach_last_session') || 'null');
            if (savedSession) {
                const date = new Date(savedSession.date);
                const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

                // Mostrar SFR en lugar de rating 1-10
                let sfrStr = '';
                if (savedSession.sfr) {
                    sfrStr = `<span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.2); color: #10B981; padding: 2px 6px; border-radius: 4px;">P:${savedSession.sfr.pump} D:${savedSession.sfr.disruption} F:${savedSession.sfr.fatigue}</span>`;
                }

                lastSessionContainer.innerHTML = `
                    <div class="flex-between">
                        <span style="display:flex; align-items:center; gap:8px;"><strong>${savedSession.dayName}</strong> ${sfrStr}</span>
                        <span class="text-muted">${dateStr}</span>
                    </div>
                    <p class="mt-1" style="font-size: 0.85rem;">
                        ${savedSession.stats?.exerciseCount || 0} ejercicios · ${savedSession.stats?.totalSets || 0} sets ·
                        ${(savedSession.stats?.totalVolume || 0).toLocaleString()} kg vol.
                    </p>
                    <p class="mt-1" style="font-size: 0.8rem; color: var(--text-muted);">
                        RPE prom: ${savedSession.stats?.avgRPE || '-'} · RIR prom: ${savedSession.stats?.avgRIR || '-'} ·
                        Semana: ${savedSession.mesocycleName || '-'}
                    </p>
                `;
            } else {
                // Fallback al SessionLoggerModule
                const lastSession = SessionLoggerModule?.getLogsFromLastDays?.(7)?.[0];
                if (lastSession) {

                    let sfrStrFallback = '';
                    if (lastSession.sfr) {
                        sfrStrFallback = `<br><span style="color: #10B981; font-weight: 500;">SFR:</span> P:${lastSession.sfr.pump} | D:${lastSession.sfr.disruption} | F:${lastSession.sfr.fatigue}`;
                    }

                    lastSessionContainer.innerHTML = `
                        <div class="flex-between">
                            <span><strong>${lastSession.exercise}</strong></span>
                            <span class="text-muted">${lastSession.dateFormatted}</span>
                        </div>
                        <p class="mt-1" style="font-size: 0.8rem;">
                            ${lastSession.sets?.length || 0} sets ·
                            Mejor: ${lastSession.sets?.[0]?.weight || 0}kg x ${lastSession.sets?.[0]?.reps || 0}
                            ${sfrStrFallback}
                        </p>
                    `;
                }
            }

            // === Renderizar Evolución Cíclica (Compliance Real en Feedback) ===
            if (typeof ProgressChartsModule !== 'undefined' && typeof ProgressChartsModule.drawComplianceProgressionChart === 'function') {
                const level = document.getElementById('progress-experience-selector')?.value || 'intermediate';
                ProgressChartsModule.drawComplianceProgressionChart('compliance-progression-chart', routine.methodology, level);
            }

            // === Calendario de Asistencia del Mesociclo ===
            if (typeof CalendarioTracker !== 'undefined') {
                CalendarioTracker.initCalendar();
            }
        }
    }

    /**
         * Renderiza el módulo de PROGRESO (próxima sesión)
         */
    function renderProgress() {


        // === 2. Sincronizar Volumen MEV→MRV dentro de Progreso ===
        updateProgressVolume();

        // === 3. Sincronizar RIR Dinámico dentro de Progreso ===
        populateProgressMethodologySelector();
        updateProgressRIR();
    }

    /**
     * Renderiza las estadísticas del dashboard dentro de Progreso
     */
    function renderDashboardStats() {
        const container = document.getElementById('dashboard-stats');
        if (!container) return;

        try {
            const stats = SessionLoggerModule?.getStats?.() || { totalSessions: 0, last30Days: 0, totalSets: 0, totalVolume: 0 };
            const trend = AutoregulationModule?.getRecoveryTrend?.(7);

            container.innerHTML = `
                <div class="stat-box">
                    <div class="stat-box__value">${stats.totalSessions || 0}</div>
                    <div class="stat-box__label">Sesiones Totales</div>
                </div>
                <div class="stat-box">
                    <div class="stat-box__value">${stats.last30Days || 0}</div>
                    <div class="stat-box__label">Últimos 30 días</div>
                </div>
                <div class="stat-box">
                    <div class="stat-box__value">${stats.totalSets || 0}</div>
                    <div class="stat-box__label">Series Totales</div>
                </div>
                <div class="stat-box">
                    <div class="stat-box__value">${formatVolume(stats.totalVolume || 0)}</div>
                    <div class="stat-box__label">Volumen Total (kg)</div>
                </div>
            `;

            // Tendencia de recuperación
            const trendContainer = document.getElementById('recovery-trend');
            if (trendContainer && trend) {
                const trendClass = trend.trend === 'EXCELLENT' ? 'success' :
                    trend.trend === 'STABLE' ? 'optimal' :
                        trend.trend === 'DECLINING' ? 'warning' : '';

                trendContainer.innerHTML = `
                    <div class="status-indicator status-indicator--${trendClass}">
                        ${getTrendIcon(trend.trend)} ${trend.message}
                    </div>
                `;
            }

            // Gráficas de progreso
            if (typeof ProgressChartsModule !== 'undefined') {
                ProgressChartsModule.renderDashboardCharts('dashboard-charts');

                // Extraer el nombre de la metodología actual para pasarlo a la gráfica
                let methodName = state.selectedMethodology;
                const methodSelector = document.getElementById('methodology-selector');
                if (methodSelector && methodSelector.options[methodSelector.selectedIndex]) {
                    methodName = methodSelector.options[methodSelector.selectedIndex].text;
                }

                ProgressChartsModule.drawMesocycleProgressionChart(
                    'mesocycle-progression-chart',
                    methodName,
                    state.experienceLevel || 'intermediate'
                );
            }

            // Cronómetro de descanso
            if (typeof RestTimerModule !== 'undefined') {
                RestTimerModule.renderTimerUI('timer-section', state.selectedMethodology);
            }
        } catch (e) {
            console.log('Dashboard stats: módulos aún no disponibles', e);
        }
    }



    /**
     * Sincroniza la sección Volumen MEV→MRV dentro del módulo Progreso
     */
    function updateProgressVolume() {
        const muscleSelector = document.getElementById('progress-muscle-selector');
        const expSelector = document.getElementById('progress-experience-selector');
        if (!muscleSelector || typeof VolumeMEVMRVModule === 'undefined') return;

        const selectedMuscle = muscleSelector.value || 'chest';
        const expLevel = expSelector?.value || state.experienceLevel || 'intermediate';

        const landmarks = VolumeMEVMRVModule.getVolumeLandmarks(
            selectedMuscle,
            expLevel,
            state.selectedMethodology
        );

        if (!landmarks) return;

        // Actualizar barra de volumen en Progreso
        const bar = document.getElementById('progress-volume-bar');
        if (bar) {
            const total = landmarks.MRV;
            const mevWidth = (landmarks.MEV / total * 100);
            const mavWidth = ((landmarks.MAV.high - landmarks.MEV) / total * 100);
            const mrvWidth = ((landmarks.MRV - landmarks.MAV.high) / total * 100);

            bar.innerHTML = `
                <div class="volume-bar__zone volume-bar__mev" style="width: ${mevWidth}%; left: 0;">
                    MEV: ${landmarks.MEV}
                </div>
                <div class="volume-bar__zone volume-bar__mav" style="width: ${mavWidth}%; left: ${mevWidth}%;">
                    MAV: ${landmarks.MAV.low}-${landmarks.MAV.high}
                </div>
                <div class="volume-bar__zone volume-bar__mrv" style="width: ${mrvWidth}%; left: ${mevWidth + mavWidth}%;">
                    MRV: ${landmarks.MRV}
                </div>
            `;
        }

        // Actualizar tabla de volumen en Progreso
        const table = document.getElementById('progress-volume-table');
        if (table) {
            table.innerHTML = `
                <tr>
                    <th>Zona</th>
                    <th>Series/Semana</th>
                    <th>Descripción</th>
                </tr>
                <tr>
                    <td class="text-warning">MEV</td>
                    <td>${landmarks.MEV}</td>
                    <td>Mínimo para mantener</td>
                </tr>
                <tr>
                    <td class="text-success">MAV</td>
                    <td>${landmarks.MAV.low} - ${landmarks.MAV.high}</td>
                    <td>Rango óptimo</td>
                </tr>
                <tr>
                    <td class="text-danger">MRV</td>
                    <td>${landmarks.MRV}</td>
                    <td>Máximo recuperable</td>
                </tr>
            `;
        }
    }

    /**
     * Llena el selector de metodologías en la sección Progreso
     */
    async function populateProgressMethodologySelector() {
        const selector = document.getElementById('progress-methodology-selector');
        if (!selector || selector.dataset.populated) return;

        if (window.MethodologiesSyncModule) {
            const methodologies = await MethodologiesSyncModule.getMethodologyList();
            selector.innerHTML = methodologies.map(m =>
                `<option value="${m.id}" ${m.id === state.selectedMethodology ? 'selected' : ''}>
                    ${m.name}
                </option>`
            ).join('');
        }
        selector.dataset.populated = 'true';
    }

    /**
     * Actualiza el RIR Dinámico dentro de Progreso
     */
    function updateProgressRIR() {
        const methodSelector = document.getElementById('progress-methodology-selector');
        const weekSelector = document.getElementById('progress-week-selector');
        if (!methodSelector || !weekSelector) return;

        const methodology = methodSelector.value || state.selectedMethodology;
        const week = parseInt(weekSelector.value) || 1;

        if (typeof RIRDynamicModule === 'undefined') return;

        const config = RIRDynamicModule.getRIRForWeek(methodology, week);

        const rirValue = document.getElementById('progress-rir-value');
        const rirDesc = document.getElementById('progress-rir-description');
        const methodNote = document.getElementById('progress-methodology-note');

        if (rirValue) {
            rirValue.textContent = config.rir;
            rirValue.className = `stat-box__value text-${RIRDynamicModule.getRIRColor(config.rir)}`;
        }
        if (rirDesc) rirDesc.textContent = config.description;
        if (methodNote) methodNote.textContent = config.note;

        // Actualizar indicadores de semana
        const progression = RIRDynamicModule.getFullProgression(methodology);
        const container = document.getElementById('progress-week-indicators');
        if (container && progression) {
            container.innerHTML = progression.weeks.map(w => `
                <div class="rir-dot ${w.week === week ? 'active' : ''}">
                    ${w.rir}
                </div>
            `).join('');
        }

        // 🔄 [NUEVO] Actualizar gráfica de mesociclo si el usuario cambia el selector de metodología en esta misma sección
        if (typeof ProgressChartsModule !== 'undefined' && typeof ProgressChartsModule.drawMesocycleProgressionChart === 'function') {
            let methodName = methodology;
            if (methodSelector && methodSelector.options[methodSelector.selectedIndex]) {
                methodName = methodSelector.options[methodSelector.selectedIndex].text;
            }
            ProgressChartsModule.drawMesocycleProgressionChart('mesocycle-progression-chart', methodName, state.experienceLevel || 'intermediate');
        }
    }

    /**
     * Renderiza el módulo de RIR dinámico
     */
    function renderRIR() {
        updateRIRDisplay();
    }

    /**
     * Actualiza la visualización de RIR
     */
    function updateRIRDisplay() {
        const config = RIRDynamicModule.getRIRForWeek(state.selectedMethodology, state.currentWeek);

        const rirValue = document.getElementById('rir-value');
        const rirDesc = document.getElementById('rir-description');
        const methodNote = document.getElementById('methodology-note');

        if (rirValue) {
            rirValue.textContent = config.rir;
            rirValue.className = `stat-box__value text-${RIRDynamicModule.getRIRColor(config.rir)}`;
        }

        if (rirDesc) {
            rirDesc.textContent = config.description;
        }

        if (methodNote) {
            methodNote.textContent = config.note;
        }

        // Actualizar indicadores de semana
        updateWeekIndicators();
    }

    /**
     * Actualiza los indicadores visuales de semanas
     */
    function updateWeekIndicators() {
        const progression = RIRDynamicModule.getFullProgression(state.selectedMethodology);
        const container = document.getElementById('week-indicators');

        if (container) {
            container.innerHTML = progression.weeks.map(week => `
                <div class="rir-dot ${week.week === state.currentWeek ? 'active' : ''}">
                    ${week.rir}
                </div>
            `).join('');
        }
    }

    // renderVolume(), updateVolumeBar() eliminados — lógica integrada en updateProgressVolume()

    /**
     * Actualiza la tabla de volumen (legacy - mantener por si algún módulo externo la usa)
     */
    function updateVolumeTable(landmarks) {
        const table = document.getElementById('volume-table');
        if (!table) return;

        table.innerHTML = `
            <tr>
                <th>Zona</th>
                <th>Series/Semana</th>
                <th>Descripción</th>
            </tr>
            <tr>
                <td class="text-warning">MEV</td>
                <td>${landmarks.MEV}</td>
                <td>Mínimo para mantener</td>
            </tr>
            <tr>
                <td class="text-success">MAV</td>
                <td>${landmarks.MAV.low} - ${landmarks.MAV.high}</td>
                <td>Rango óptimo</td>
            </tr>
            <tr>
                <td class="text-danger">MRV</td>
                <td>${landmarks.MRV}</td>
                <td>Máximo recuperable</td>
            </tr>
        `;
    }

    /**
     * Renderiza el session logger
     */
    function renderSessionLogger() {
        const recentLogs = SessionLoggerModule.getLogsFromLastDays(7);
        const container = document.getElementById('recent-logs');

        if (container) {
            if (recentLogs.length === 0) {
                container.innerHTML = '<p class="text-muted">No hay registros recientes</p>';
            } else {
                container.innerHTML = recentLogs.slice(-10).reverse().map(log => `
                    <div class="log-entry">
                        <span class="log-entry__date">${log.dateFormatted}</span>
                        <span class="log-entry__exercise">${log.exercise}</span>
                        <span class="log-entry__data" style="font-size: 0.8rem;">
                            ${log.sets.length} series · ${formatVolume(log.totalVolume)} kg<br>
                            <span style="color: #10B981; font-weight: 500;">SFR:</span> Pump ${log.sfr?.pump || '-'}/5 | Disrup. ${log.sfr?.disruption || '-'}/5 | Fatiga ${log.sfr?.fatigue || '-'}/5
                        </span>
                    </div>
                `).join('');
            }
        }
    }

    /**
     * Configura listeners del session logger
     */
    function setupSessionLoggerListeners() {
        const form = document.getElementById('session-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                saveNewSession();
            });
        }
    }

    /**
     * Guarda una nueva sesión
     */
    function saveNewSession() {
        const exercise = document.getElementById('log-exercise')?.value;
        const weight = parseFloat(document.getElementById('log-weight')?.value);
        const reps = parseInt(document.getElementById('log-reps')?.value);
        const rpe = parseFloat(document.getElementById('log-rpe')?.value);

        const pump = parseInt(document.getElementById('log-sfr-pump')?.value) || 3;
        const disruption = parseInt(document.getElementById('log-sfr-disruption')?.value) || 3;
        const fatigue = parseInt(document.getElementById('log-sfr-fatigue')?.value) || 3;

        if (!exercise || !weight || !reps) {
            alert('Por favor completa los campos requeridos');
            return;
        }

        const log = SessionLoggerModule.saveLog({
            exercise,
            sets: [SessionLoggerModule.createSet(weight, reps, rpe)],
            sfr: { pump, disruption, fatigue },
            methodology: state.selectedMethodology,
            weekNumber: state.currentWeek
        });

        // Limpiar formulario
        document.getElementById('session-form')?.reset();

        // Actualizar vista
        renderSessionLogger();

        // Mostrar confirmación
        showNotification('✅ Sesión guardada correctamente');
    }

    /**
     * Renderiza el módulo de sobrecarga progresiva
     */
    function renderProgressiveOverload() {
        // El formulario está en el HTML
    }

    /**
     * Configura listeners de sobrecarga progresiva
     */
    function setupProgressiveOverloadListeners() {
        const calcBtn = document.getElementById('btn-calculate-overload');
        if (calcBtn) {
            calcBtn.addEventListener('click', calculateOverload);
        }
    }

    /**
     * Calcula la sobrecarga progresiva
     */
    function calculateOverload() {
        const exercise = document.getElementById('overload-exercise')?.value;
        const weight = parseFloat(document.getElementById('overload-weight')?.value);
        const reps = parseInt(document.getElementById('overload-reps')?.value);
        const rpe = parseFloat(document.getElementById('overload-rpe')?.value);
        const targetReps = parseInt(document.getElementById('overload-target-reps')?.value) || reps;
        const targetRIR = parseInt(document.getElementById('overload-target-rir')?.value) || 2;

        if (!exercise || !weight || !reps) {
            alert('Por favor completa los campos requeridos');
            return;
        }

        const result = ProgressiveOverloadModule.calculateNextSession(
            exercise,
            { weight, reps, rpe },
            targetReps,
            targetRIR
        );

        const resultContainer = document.getElementById('overload-result');
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="card card--highlight animate-fadeIn">
                    <div class="card__header">
                        <h3 class="card__title">Próxima Sesión</h3>
                        <div class="status-indicator status-indicator--${result.action === 'INCREASE_WEIGHT' ? 'success' : 'optimal'}">
                            ${result.action.replace('_', ' ')}
                        </div>
                    </div>
                    <p class="mb-2">${result.message}</p>
                    <div class="flex gap-2 mt-2">
                        <div class="stat-box">
                            <div class="stat-box__value">${result.recommendation.weight} kg</div>
                            <div class="stat-box__label">Peso Recomendado</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box__value">${result.recommendation.reps}</div>
                            <div class="stat-box__label">Reps Objetivo</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box__value">${result.recommendation.targetRIR}</div>
                            <div class="stat-box__label">RIR Target</div>
                        </div>
                    </div>
                    ${result.recommendation.increment !== 0 ? `
                        <p class="mt-2 text-primary">
                            <strong>Incremento:</strong> ${result.recommendation.increment > 0 ? '+' : ''}${result.recommendation.increment} kg
                        </p>
                    ` : ''}
                </div>
            `;
        }
    }

    /**
     * Actualiza módulos cuando cambia la metodología
     */
    function updateModuleWithMethodology() {
        renderCurrentModule();
        updateRIRDisplay();
    }

    // Utilidades auxiliares
    function formatVolume(volume) {
        if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'K';
        }
        return Math.round(volume);
    }

    function generateStars(rating) {
        const fullStars = Math.floor(rating / 2);
        const halfStar = rating % 2;
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '⭐';
        if (halfStar) stars += '✨';
        return stars || '—';
    }

    function getTrendIcon(trend) {
        const icons = {
            'EXCELLENT': '🟢',
            'STABLE': '🔵',
            'DECLINING': '🟡',
            'UNKNOWN': '⚪'
        };
        return icons[trend] || '⚪';
    }

    // updateSliderDisplays() y updateSliderLabel() eliminados — autorregulación removida

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'alert alert--success animate-fadeIn';
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000;';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // API Pública
    return {
        init,
        state,
        switchModule,
        calculateOverload,
        updateProgressVolume,
        updateProgressRIR
    };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    RPCoachApp.init();
});
