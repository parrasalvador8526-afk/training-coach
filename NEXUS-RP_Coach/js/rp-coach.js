/**
 * NEXUS-RP Coach - Controlador Principal
 * 
 * Orquesta todos los módulos y maneja la interfaz de usuario
 */

const RPCoachApp = (() => {
    // Estado de la app (Singleton)
    let state = {
        currentModule: 'home', // Comenzar siempre en INICIO
        methodology: 'Y3T',
        version: '1.0.0'
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
     * Gamificación: Confeti y Logros
     */
    function triggerConfetti() {
        if (typeof confetti === 'function') {
            const duration = 3000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#E040FB', '#00BFA5', '#7C4DFF']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#E040FB', '#00BFA5', '#7C4DFF']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    }

    function showAchievement(title, subtitle) {
        triggerConfetti();
        const badge = document.createElement('div');
        badge.innerHTML = `
            <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; background: linear-gradient(135deg, #1A1A2E, #0D0D1A); border: 2px solid #E040FB; border-radius: 16px; padding: 15px 25px; box-shadow: 0 0 30px rgba(224, 64, 251, 0.4); display: flex; align-items: center; gap: 15px; animation: slideDown 0.5s ease-out, fadeOut 0.5s ease-in 4.5s forwards;">
                <div style="font-size: 2rem;">🏆</div>
                <div>
                    <div style="color: #E040FB; font-weight: 800; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px;">${title}</div>
                    <div style="color: #A0A0C8; font-size: 0.85rem;">${subtitle}</div>
                </div>
            </div>
            <style>
                @keyframes slideDown { from { top: -100px; opacity: 0; } to { top: 20px; opacity: 1; } }
                @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; visibility: hidden; } }
            </style>
        `;
        document.body.appendChild(badge);
        setTimeout(() => badge.remove(), 5000);
    }

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
     * Punto 2: Ajuste automático de volumen/intensidad
     * Punto 3: Historial de readiness con tendencias
     * Punto 4: Semáforo visual claro
     */
    function evaluateReadiness() {
        const sleep = parseInt(document.getElementById('readiness-sleep').value) || 3;
        const stress = parseInt(document.getElementById('readiness-stress').value) || 3;
        const doms = parseInt(document.getElementById('readiness-doms').value) || 3;
        const badge = document.getElementById('readiness-score-badge');
        const feedback = document.getElementById('readiness-feedback');

        const avgScore = ((sleep + stress + doms) / 3).toFixed(1);
        const scoreNum = parseFloat(avgScore);

        // Obtener RIR actual del mesociclo
        let currentRIR = 3;
        let currentPhase = 'Acumulación';
        try {
            const calData = typeof CalendarioTracker !== 'undefined' ? CalendarioTracker.getCalendarData() : null;
            if (calData) {
                const today = new Date().toISOString().split('T')[0];
                for (let w = 1; w <= 5; w++) {
                    const week = calData.weeks[w];
                    const dates = week.plannedDays.map(d => d.plannedDate);
                    if (dates.length > 0) {
                        const weekEnd = new Date(dates[0]);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                        if (today >= dates[0] && today <= weekEnd.toISOString().split('T')[0]) {
                            currentRIR = week.rir;
                            currentPhase = week.name;
                            break;
                        }
                    }
                }
            }
        } catch (e) { }

        // ===== Punto 4: Semáforo visual =====
        let level, color, icon, badgeText;
        let rirAdjust = 0;
        let setsAdjust = '';
        let recommendation = '';

        if (scoreNum >= 4) {
            level = 'green';
            color = '#10B981';
            icon = '🟢';
            badgeText = 'LISTO';
            rirAdjust = 0;
            setsAdjust = 'Mantén todas las series';
            recommendation = 'Entrena al 100%. Mantén tu RIR ' + currentRIR + ' y todas las series planificadas.';
            if (scoreNum >= 4.7) recommendation = 'Condiciones óptimas. Puedes intentar un PR o empujar más allá del plan.';
        } else if (scoreNum >= 3) {
            level = 'yellow';
            color = '#F59E0B';
            icon = '🟡';
            badgeText = 'MODERADO';
            rirAdjust = 1;
            setsAdjust = 'Reduce 1 serie por ejercicio';
            recommendation = 'Fatiga moderada. Sube a RIR ' + (currentRIR + 1) + ' y reduce 1 serie por ejercicio.';
        } else {
            level = 'red';
            color = '#EF4444';
            icon = '🔴';
            badgeText = 'FATIGADO';
            rirAdjust = 2;
            setsAdjust = 'Reduce 2 series por ejercicio';
            if (scoreNum <= 1.5) {
                recommendation = 'Alta fatiga. Considera descanso activo o sesión muy ligera (movilidad, cardio suave).';
            } else {
                recommendation = 'Fatiga alta. Sube a RIR ' + (currentRIR + 2) + ' y reduce 2 series por ejercicio.';
            }
        }

        // Badge
        badge.textContent = icon + ' ' + badgeText;
        badge.style.background = color;

        // ===== Punto 2: Feedback con ajuste concreto =====
        const adjustedRIR = currentRIR + rirAdjust;
        feedback.innerHTML =
            '<div style="background: rgba(' + (level === 'green' ? '16,185,129' : level === 'yellow' ? '245,158,11' : '239,68,68') + ', 0.08); border: 1px solid ' + color + '; border-radius: 8px; padding: 10px; margin-top: 6px;">' +
            '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">' +
            '<span style="font-size: 1.5rem;">' + icon + '</span>' +
            '<div>' +
            '<div style="font-weight: 700; color: ' + color + '; font-size: 0.95rem;">Score: ' + avgScore + '/5 — ' + badgeText + '</div>' +
            '<div style="font-size: 0.75rem; color: var(--text-muted);">Fase: ' + currentPhase + ' · RIR base: ' + currentRIR + '</div>' +
            '</div>' +
            '</div>' +
            '<div style="font-size: 0.82rem; color: #E0E0E0; margin-bottom: 4px;">' + recommendation + '</div>' +
            (rirAdjust > 0 ?
                '<div style="display: flex; gap: 10px; margin-top: 6px; font-size: 0.75rem;">' +
                '<span style="padding: 2px 8px; background: rgba(255,255,255,0.06); border-radius: 10px; color: ' + color + ';">RIR hoy: ' + adjustedRIR + '</span>' +
                '<span style="padding: 2px 8px; background: rgba(255,255,255,0.06); border-radius: 10px; color: ' + color + ';">' + setsAdjust + '</span>' +
                '</div>'
                : '') +
            '</div>';

        // ===== Punto 3: Guardar en historial =====
        const historyKey = 'rpCoach_readiness_history';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const todayStr = new Date().toISOString().split('T')[0];

        // Reemplazar si ya evaluó hoy, si no agregar
        const todayIdx = history.findIndex(h => h.date === todayStr);
        const entry = { date: todayStr, score: scoreNum, sleep, stress, doms, level };
        if (todayIdx >= 0) {
            history[todayIdx] = entry;
        } else {
            history.push(entry);
        }
        // Mantener solo últimas 35 entradas (5 semanas)
        if (history.length > 35) history.splice(0, history.length - 35);
        localStorage.setItem(historyKey, JSON.stringify(history));

        renderReadinessHistory(history);

        // ===== GAMIFICACIÓN: Check de fin de mesociclo =====
        if (currentPhase === 'Deload' || currentPhase === 'Peak') {
            // Solo mostrar si no se ha mostrado hoy (evitar spam)
            const achievementKey = 'rpCoach_achievement_meso_' + todayStr;
            if (!localStorage.getItem(achievementKey)) {
                localStorage.setItem(achievementKey, 'true');
                showAchievement('¡Mesociclo Completado!', 'Has llegado a la Cima de la Montaña. ¡Felicidades!');

                // Mostrar Modal de Fin de Ciclo (Reporte Visual)
                const eocModal = document.getElementById('modal-end-of-cycle');
                if (eocModal) {
                    setTimeout(() => { eocModal.style.display = 'block'; }, 3000); // 3 segundos de retraso para el confeti

                    // Cargar fotos de Semana 1 y Semana 5
                    try {
                        const photosS1 = JSON.parse(localStorage.getItem('rpCoach_photos_s1'));
                        const photosS5 = JSON.parse(localStorage.getItem('rpCoach_photos_s5'));

                        if (photosS1 && photosS1.front) {
                            document.getElementById('eoc-img-s1').src = photosS1.front;
                            document.getElementById('eoc-img-s1').style.display = 'block';
                            document.getElementById('eoc-noimg-s1').style.display = 'none';
                        }
                        if (photosS5 && photosS5.front) {
                            document.getElementById('eoc-img-s5').src = photosS5.front;
                            document.getElementById('eoc-img-s5').style.display = 'block';
                            document.getElementById('eoc-noimg-s5').style.display = 'none';
                        }
                    } catch (e) { console.warn("Error cargando fotos End-Of-Cycle", e); }
                }
            }
        }
    }

    /**
     * Renderiza el historial de readiness con tendencia
     */
    function renderReadinessHistory(history) {
        const container = document.getElementById('readiness-history');
        if (!container || history.length < 2) {
            if (container) container.style.display = 'none';
            return;
        }
        container.style.display = 'block';

        // Calcular tendencia (últimas 5 vs anteriores 5)
        const recent = history.slice(-5);
        const recentAvg = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
        let trendText = '';
        let trendColor = '#E0E0E0';
        if (history.length >= 6) {
            const previous = history.slice(-10, -5);
            if (previous.length > 0) {
                const prevAvg = previous.reduce((sum, h) => sum + h.score, 0) / previous.length;
                const diff = recentAvg - prevAvg;
                if (diff > 0.3) { trendText = '↑ Mejorando'; trendColor = '#10B981'; }
                else if (diff < -0.3) { trendText = '↓ Acumulando fatiga'; trendColor = '#EF4444'; }
                else { trendText = '→ Estable'; trendColor = '#F59E0B'; }
            }
        }

        // Últimas entradas (max 7)
        const lastEntries = history.slice(-7);

        let html =
            '<div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
            '<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">HISTORIAL DE READINESS</span>' +
            (trendText ? '<span style="font-size: 0.75rem; color: ' + trendColor + '; font-weight: 600;">' + trendText + ' (prom. ' + recentAvg.toFixed(1) + ')</span>' : '') +
            '</div>' +
            '<div style="display: flex; gap: 4px; align-items: flex-end; height: 40px;">';

        lastEntries.forEach(entry => {
            const barHeight = Math.max(6, (entry.score / 5) * 36);
            const barColor = entry.score >= 4 ? '#10B981' : entry.score >= 3 ? '#F59E0B' : '#EF4444';
            const dayLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'short' }).substring(0, 2);
            html +=
                '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;">' +
                '<div style="width: 100%; max-width: 30px; height: ' + barHeight + 'px; background: ' + barColor + '; border-radius: 3px; opacity: 0.85;" title="' + entry.date + ': ' + entry.score + '/5"></div>' +
                '<span style="font-size: 0.55rem; color: var(--text-muted);">' + dayLabel + '</span>' +
                '</div>';
        });

        html += '</div></div>';
        container.innerHTML = html;
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
            case 'home':
                renderHome();
                break;
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
            case 'strength':
                if (typeof StrengthTests !== 'undefined') StrengthTests.init();
                if (window.RMCalculatorModule) RMCalculatorModule.initAll();
                break;
            case 'visual':
                initProgressPhotos();
                // Renderizar métricas que fueron movidas a esta pestaña
                renderBodyCompositionFeedback();
                if (typeof ProgressAnalytics !== 'undefined' && typeof ProgressAnalytics.renderAll === 'function') {
                    ProgressAnalytics.renderAll();
                }
                break;
        }
    }

    /**
     * Renderiza el módulo de INICIO (Dashboard)
     */
    function renderHome() {
        const savedProfile = localStorage.getItem('rpCoach_profile');
        if (savedProfile) {
            try {
                const profile = JSON.parse(savedProfile);
                if (profile.name) {
                    const nameSpan = document.getElementById('home-greeting-name');
                    if (nameSpan) nameSpan.textContent = profile.name.split(' ')[0]; // Primer nombre
                }
            } catch (e) {
                console.error("Error parsing profile for home dashboard", e);
            }
        }
        // Stats can be expanded further as more context is available
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

        // Renderizar el peso corporal que vive en la nueva pestaña
        if (typeof ProgressAnalytics !== 'undefined' && typeof ProgressAnalytics.renderWeightTracking === 'function') {
            ProgressAnalytics.renderWeightTracking();
        }

        // Feature 4: Alerta de Fatiga Alta (Recuperación)
        const container = document.getElementById('module-nutrition');
        if (container && localStorage.getItem('rpCoach_fatigue_carb_boost') === 'true') {
            // Check si ya agregamos la alerta para evitar duplicados
            if (!document.getElementById('fatigue-carb-alert')) {
                const alertDiv = document.createElement('div');
                alertDiv.id = 'fatigue-carb-alert';
                alertDiv.style.background = 'rgba(239, 68, 68, 0.1)';
                alertDiv.style.border = '1px solid #EF4444';
                alertDiv.style.borderRadius = '8px';
                alertDiv.style.padding = '12px';
                alertDiv.style.marginTop = '15px';
                alertDiv.style.marginBottom = '15px';

                alertDiv.innerHTML = `
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span style="font-size: 1.5rem;">⚠️</span>
                        <div>
                            <h4 style="color: #EF4444; margin-bottom: 4px; font-size: 0.95rem;">Aviso del Motor Metabólico</h4>
                            <p style="color: #E0E0E0; font-size: 0.85rem; margin-bottom: 8px;">Hemos detectado niveles muy altos de fatiga (SNC/Muscular) en tu última sesión. Para facilitar tu recuperación sistémica, se sugiere un <strong>aumento táctico de +30g de carbohidratos</strong> intra o post-entrenamiento.</p>
                            <button id="btn-apply-fatigue-carbs" class="btn btn--sm" style="background: #10B981; color: white;">Aplicar +30g Carbos Ahora</button>
                        </div>
                    </div>
                `;

                // Insertarlo antes de las tarjetas de nutrición o al inicio
                const cardsContainer = container.querySelector('.dashboard-grid') || container.querySelector('.card');
                if (cardsContainer && cardsContainer.parentNode) {
                    cardsContainer.parentNode.insertBefore(alertDiv, cardsContainer);
                } else {
                    container.appendChild(alertDiv);
                }

                document.getElementById('btn-apply-fatigue-carbs').addEventListener('click', (e) => {
                    const carbDisplay = document.getElementById('macro-carbs');
                    if (carbDisplay) {
                        let currentCarbs = parseInt(carbDisplay.innerText);
                        if (!isNaN(currentCarbs)) {
                            carbDisplay.innerText = (currentCarbs + 30) + 'g';
                            showNotification('⚡ +30g de carbohidratos de recuperación aplicados exitosamente.');
                            e.target.parentElement.innerHTML = '<p style="color: #10B981; font-weight: bold; font-size: 0.85rem;">✅ Protocolo de recuperación activado.</p>';
                            localStorage.removeItem('rpCoach_fatigue_carb_boost');
                        }
                    }
                });
            }
        }

        // Configurar interacción básica del Motor Metabólico (Demo Auto-Ajuste)
        const btnAdjust = document.getElementById('btn-auto-adjust-macros');
        if (btnAdjust && !btnAdjust.hasListener) {
            btnAdjust.hasListener = true;
            btnAdjust.addEventListener('click', () => {
                const carbDisplay = document.getElementById('macro-carbs');
                if (carbDisplay) {
                    let currentCarbs = parseInt(carbDisplay.innerText);
                    if (!isNaN(currentCarbs)) {
                        carbDisplay.innerText = (currentCarbs + 25) + 'g';
                        showNotification('✅ +25g de carbohidratos añadidos a tus macros diarios y guardados en tu perfil.');

                        // Actualizar UI del motor
                        btnAdjust.style.background = 'var(--surface-color)';
                        btnAdjust.style.color = 'var(--text-muted)';
                        btnAdjust.innerHTML = '✔️ Ajuste Aplicado para esta semana';
                        btnAdjust.disabled = true;
                    }
                }
            });
        }
    }

    // renderDashboard() y updateAutoregulationStatus() eliminados — lógica integrada en renderProgress()

    /**
     * Renderiza el módulo de PERFIL
     */
    /**
     * Renderiza el módulo de PERFIL con Wizard
     */
    function renderProfile() {
        // Cargar datos guardados
        const savedProfile = localStorage.getItem('rpCoach_profile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);

            // Llenar formulario con datos guardados
            if (profile.name) {
                const nameEl = document.getElementById('profile-name');
                if (nameEl) nameEl.value = profile.name;
            }
            if (profile.weight) {
                const weightEl = document.getElementById('profile-weight');
                if (weightEl) weightEl.value = profile.weight;
            }
            if (profile.height) {
                const heightEl = document.getElementById('profile-height');
                if (heightEl) heightEl.value = profile.height;
            }
            if (profile.age) {
                const ageEl = document.getElementById('profile-age');
                if (ageEl) ageEl.value = profile.age;
            }
            if (profile.gender) {
                const genderEl = document.getElementById('profile-gender');
                if (genderEl) genderEl.value = profile.gender;
            }

            // Mostrar resumen
            showProfileSummary(profile);
        }

        const btnSave = document.getElementById('btn-save-profile');

        // Configurar evento de guardar y saltar a entrenamiento
        if (btnSave && !btnSave.hasListenerSave) {
            btnSave.hasListenerSave = true;
            btnSave.addEventListener('click', () => {
                saveProfile();
                // Simular el tab click para mover la clase active visualmente
                const workoutTab = document.querySelector('.nav-tab[data-module="workout"]');
                if (workoutTab) workoutTab.click();
            });
        }

        // Composición corporal — toggle y carga
        initBodyComposition();
    }

    /**
     * Guarda el perfil del usuario
     */
    function saveProfile() {
        const profile = {
            name: document.getElementById('profile-name')?.value || '',
            gender: document.getElementById('profile-gender')?.value || 'male',
            weight: parseFloat(document.getElementById('profile-weight')?.value) || 0,
            height: parseInt(document.getElementById('profile-height')?.value) || 0,
            age: parseInt(document.getElementById('profile-age')?.value) || 0,
            level: document.getElementById('profile-level')?.value || 'intermediate',
            goal: 'hypertrophy',
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

        // Actualizar siluetas de progreso visual según género seleccionado
        initProgressPhotos();

        showNotification('✅ Perfil guardado correctamente');
    }

    // ═══════ Composición Corporal ═══════

    function initBodyComposition() {
        const toggle = document.getElementById('toggle-body-comp');
        const fields = document.getElementById('body-comp-fields');
        const saveBtn = document.getElementById('btn-save-body-comp');
        if (!toggle || !fields) return;

        // Cargar estado guardado
        const saved = JSON.parse(localStorage.getItem('rpCoach_body_composition') || 'null');
        if (saved && saved.enabled) {
            toggle.checked = true;
            fields.classList.remove('hidden');
            // Llenar con última medición
            if (saved.measurements && saved.measurements.length > 0) {
                const last = saved.measurements[saved.measurements.length - 1];
                if (last.bodyFat) document.getElementById('bc-body-fat').value = last.bodyFat;
                if (last.muscleMass) document.getElementById('bc-muscle-mass').value = last.muscleMass;
                if (last.chest) document.getElementById('bc-chest').value = last.chest;
                if (last.arm) document.getElementById('bc-arm').value = last.arm;
                if (last.waist) document.getElementById('bc-waist').value = last.waist;
                if (last.thigh) document.getElementById('bc-thigh').value = last.thigh;
                if (last.hip) document.getElementById('bc-hip').value = last.hip;
                if (last.calf) document.getElementById('bc-calf').value = last.calf;
            }
            if (saved.frequency) {
                const freqSel = document.getElementById('bc-frequency');
                if (freqSel) freqSel.value = saved.frequency;
            }

            // Ocultar el botón anterior (Siguiente base) si la composición está activa al inicio
            const profileControls = document.getElementById('profile-wizard-controls');
            if (profileControls) {
                profileControls.style.display = 'none';
            }
        }

        // Toggle listener
        if (!toggle.hasListener) {
            toggle.hasListener = true;
            toggle.addEventListener('change', function () {
                fields.classList.toggle('hidden', !this.checked);
                const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '{"enabled":false,"frequency":"monthly","measurements":[]}');
                data.enabled = this.checked;
                localStorage.setItem('rpCoach_body_composition', JSON.stringify(data));

                // Mostrar/Ocultar el botón "Siguiente" principal según el estado
                const profileControls = document.getElementById('profile-wizard-controls');
                if (profileControls) {
                    profileControls.style.display = this.checked ? 'none' : 'flex';
                }
            });
        }

        // Save body comp and redirect (ahora funciona como un botón "Siguiente" integral)
        if (saveBtn && !saveBtn.hasListener) {
            saveBtn.hasListener = true;
            saveBtn.addEventListener('click', () => {
                const success = saveBodyComposition();
                if (success) {
                    saveProfile();
                    try {
                        if (typeof switchModule === 'function') {
                            switchModule('workout');
                        }
                    } catch (e) { }
                }
            });
        }
    }

    function saveBodyComposition() {
        const measurement = {
            date: new Date().toISOString().split('T')[0],
            bodyFat: parseFloat(document.getElementById('bc-body-fat')?.value) || 0,
            muscleMass: parseFloat(document.getElementById('bc-muscle-mass')?.value) || 0,
            chest: parseFloat(document.getElementById('bc-chest')?.value) || 0,
            arm: parseFloat(document.getElementById('bc-arm')?.value) || 0,
            waist: parseFloat(document.getElementById('bc-waist')?.value) || 0,
            thigh: parseFloat(document.getElementById('bc-thigh')?.value) || 0,
            hip: parseFloat(document.getElementById('bc-hip')?.value) || 0,
            calf: parseFloat(document.getElementById('bc-calf')?.value) || 0
        };

        if (measurement.bodyFat === 0 && measurement.muscleMass === 0) {
            showNotification('⚠️ Ingresa al menos % grasa o masa muscular');
            return false;
        }

        const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '{"enabled":true,"frequency":"monthly","measurements":[]}');
        data.enabled = true;
        data.frequency = document.getElementById('bc-frequency')?.value || 'monthly';
        data.measurements.push(measurement);
        localStorage.setItem('rpCoach_body_composition', JSON.stringify(data));
        showNotification('✅ Mediciones de composición corporal guardadas');

        return true;
    }

    function saveBodyCompPhase(phase) {
        const measurement = {
            date: new Date().toISOString().split('T')[0],
            phase: phase,
            bodyFat: parseFloat(document.getElementById(`bc-fat-${phase}`)?.value) || 0,
            muscleMass: parseFloat(document.getElementById(`bc-muscle-${phase}`)?.value) || 0,
            chest: parseFloat(document.getElementById(`bc-chest-${phase}`)?.value) || 0,
            arm: parseFloat(document.getElementById(`bc-arm-${phase}`)?.value) || 0,
            waist: parseFloat(document.getElementById(`bc-waist-${phase}`)?.value) || 0,
            thigh: parseFloat(document.getElementById(`bc-thigh-${phase}`)?.value) || 0,
            hip: parseFloat(document.getElementById(`bc-hip-${phase}`)?.value) || 0,
            calf: parseFloat(document.getElementById(`bc-calf-${phase}`)?.value) || 0
        };

        if (measurement.bodyFat === 0 && measurement.muscleMass === 0) {
            showNotification('⚠️ Ingresa al menos % grasa o masa muscular');
            return;
        }

        const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '{"enabled":true,"frequency":"monthly","measurements":[]}');
        data.measurements.push(measurement);
        localStorage.setItem('rpCoach_body_composition', JSON.stringify(data));
        showNotification(`✅ Nueva medición registrada para ${(phase || '').toUpperCase()}`);

        const form = document.getElementById(`body-comp-form-${phase}`);
        if (form) form.classList.add('hidden');

        renderBodyCompositionFeedback();
        if (typeof ProgressAnalytics !== 'undefined' && typeof ProgressAnalytics.renderAll === 'function') {
            ProgressAnalytics.renderAll();
        }
    }

    function renderBodyCompositionFeedback() {
        const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || 'null');

        const globalSection = document.getElementById('body-composition-global');

        if (!data || !data.enabled) {
            if (globalSection) globalSection.style.display = 'none';
            ['s1', 's3', 's5'].forEach(p => {
                const sec = document.getElementById(`body-composition-${p}`);
                if (sec) sec.style.display = 'none';
            });
            return;
        }

        const measurements = data.measurements || [];

        ['s1', 's3', 's5'].forEach(phase => {
            const section = document.getElementById(`body-composition-${phase}`);
            if (!section) return;
            section.style.display = 'block';

            const phaseMeasurements = measurements.filter(m => m.phase === phase);
            const latest = phaseMeasurements.length > 0 ? phaseMeasurements[phaseMeasurements.length - 1] : null;

            const currentDiv = document.getElementById(`body-comp-current-${phase}`);
            if (currentDiv) {
                if (latest) {
                    const first = measurements.length > 0 ? measurements[0] : latest;
                    const fatChange = (latest.bodyFat - first.bodyFat).toFixed(1);
                    const muscleChange = (latest.muscleMass - first.muscleMass).toFixed(1);
                    const fatColor = fatChange < 0 ? '#10B981' : fatChange > 0 ? '#EF4444' : '#888';
                    const muscleColor = muscleChange > 0 ? '#10B981' : muscleChange < 0 ? '#EF4444' : '#888';
                    const fatArrow = fatChange < 0 ? '↓' : fatChange > 0 ? '↑' : '→';
                    const muscleArrow = muscleChange > 0 ? '↑' : muscleChange < 0 ? '↓' : '→';

                    currentDiv.innerHTML = `
                        <div class="module-grid" style="gap:8px;">
                            <div class="stat-box" style="padding:10px;">
                                <div class="stat-box__value" style="font-size:1.3rem;">${latest.bodyFat}%</div>
                                <div class="stat-box__label">Grasa Corporal</div>
                                ${latest !== first ? `<div style="font-size:0.7rem; color:${fatColor}; margin-top:2px;">${fatArrow} ${fatChange > 0 ? '+' : ''}${fatChange}%</div>` : ''}
                            </div>
                            <div class="stat-box" style="padding:10px;">
                                <div class="stat-box__value" style="font-size:1.3rem;">${latest.muscleMass}kg</div>
                                <div class="stat-box__label">Masa Muscular</div>
                                ${latest !== first ? `<div style="font-size:0.7rem; color:${muscleColor}; margin-top:2px;">${muscleArrow} ${muscleChange > 0 ? '+' : ''}${muscleChange}kg</div>` : ''}
                            </div>
                        </div>
                        ${latest.chest || latest.arm || latest.waist || latest.thigh ? `
                        <div class="module-grid mt-2" style="gap:6px;">
                            ${latest.chest ? `<div class="stat-box" style="padding:6px;"><div class="stat-box__value" style="font-size:1rem;">${latest.chest}cm</div><div class="stat-box__label" style="font-size:0.65rem;">Pecho</div></div>` : ''}
                            ${latest.arm ? `<div class="stat-box" style="padding:6px;"><div class="stat-box__value" style="font-size:1rem;">${latest.arm}cm</div><div class="stat-box__label" style="font-size:0.65rem;">Brazo</div></div>` : ''}
                            ${latest.waist ? `<div class="stat-box" style="padding:6px;"><div class="stat-box__value" style="font-size:1rem;">${latest.waist}cm</div><div class="stat-box__label" style="font-size:0.65rem;">Cintura</div></div>` : ''}
                            ${latest.thigh ? `<div class="stat-box" style="padding:6px;"><div class="stat-box__value" style="font-size:1rem;">${latest.thigh}cm</div><div class="stat-box__label" style="font-size:0.65rem;">Muslo</div></div>` : ''}
                            ${latest.hip ? `<div class="stat-box" style="padding:6px;"><div class="stat-box__value" style="font-size:1rem;">${latest.hip}cm</div><div class="stat-box__label" style="font-size:0.65rem;">Cadera</div></div>` : ''}
                            ${latest.calf ? `<div class="stat-box" style="padding:6px;"><div class="stat-box__value" style="font-size:1rem;">${latest.calf}cm</div><div class="stat-box__label" style="font-size:0.65rem;">Pantorrilla</div></div>` : ''}
                        </div>` : ''}
                    `;
                } else {
                    currentDiv.innerHTML = `<p style="font-size:0.75rem; color:var(--text-muted); font-style:italic; margin-top:8px;">No hay mediciones registradas para esta fase aún.</p>`;
                }
            }
        });

        document.querySelectorAll('.btn-toggle-body-comp').forEach(btn => {
            if (!btn.hasListener) {
                btn.hasListener = true;
                btn.addEventListener('click', (e) => {
                    const phase = e.currentTarget.dataset.phase;
                    const form = document.getElementById(`body-comp-form-${phase}`);

                    if (form) {
                        form.classList.toggle('hidden');

                        // Si se abre, repoblar con la info existente de esa fase
                        if (!form.classList.contains('hidden')) {
                            const phaseMeasurements = measurements.filter(m => m.phase === phase);
                            const latestPhase = phaseMeasurements.length > 0 ? phaseMeasurements[phaseMeasurements.length - 1] : null;
                            if (latestPhase) {
                                document.getElementById(`bc-fat-${phase}`).value = latestPhase.bodyFat || '';
                                document.getElementById(`bc-muscle-${phase}`).value = latestPhase.muscleMass || '';
                                document.getElementById(`bc-chest-${phase}`).value = latestPhase.chest || '';
                                document.getElementById(`bc-arm-${phase}`).value = latestPhase.arm || '';
                                document.getElementById(`bc-waist-${phase}`).value = latestPhase.waist || '';
                                document.getElementById(`bc-thigh-${phase}`).value = latestPhase.thigh || '';
                                document.getElementById(`bc-hip-${phase}`).value = latestPhase.hip || '';
                                document.getElementById(`bc-calf-${phase}`).value = latestPhase.calf || '';
                            }
                        }
                    }
                });
            }
        });

        document.querySelectorAll('.btn-save-body-comp').forEach(btn => {
            if (!btn.hasListener) {
                btn.hasListener = true;
                btn.addEventListener('click', (e) => {
                    const phase = e.currentTarget.dataset.phase;
                    saveBodyCompPhase(phase);
                });
            }
        });

        if (!globalSection || measurements.length === 0) {
            if (globalSection) globalSection.style.display = 'none';
            return;
        }
        globalSection.style.display = 'block';

        const historyDiv = document.getElementById('body-comp-history');
        if (historyDiv) {
            let rows = measurements.slice().reverse().map(m => `
                <tr style="font-size:0.72rem;">
                    <td style="padding:4px 6px;">${m.date} <span style="font-size:0.55rem; background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:4px; margin-left:4px;">${(m.phase || '').toUpperCase()}</span></td>
                    <td style="padding:4px 6px;">${Number(m.bodyFat).toFixed(1)}%</td>
                    <td style="padding:4px 6px;">${Number(m.muscleMass).toFixed(1)}kg</td>
                    <td style="padding:4px 6px;">${m.chest || '-'}</td>
                    <td style="padding:4px 6px;">${m.arm || '-'}</td>
                    <td style="padding:4px 6px;">${m.waist || '-'}</td>
                    <td style="padding:4px 6px;">${m.thigh || '-'}</td>
                    <td style="padding:4px 6px;">${m.hip || '-'}</td>
                    <td style="padding:4px 6px;">${m.calf || '-'}</td>
                </tr>
            `).join('');

            historyDiv.innerHTML = `
                <h5 style="font-size:0.8rem; color:var(--text-muted); margin-bottom:6px;">Historial Completo</h5>
                <div style="overflow-x:auto;">
                <table class="data-table" style="font-size:0.72rem; width:100%;">
                    <thead><tr>
                        <th style="padding:4px 6px;">Fecha</th>
                        <th style="padding:4px 6px;">% Grasa</th>
                        <th style="padding:4px 6px;">Músc</td>
                        <th style="padding:4px 6px;">Pecho</th>
                        <th style="padding:4px 6px;">Brazo</th>
                        <th style="padding:4px 6px;">Cint</th>
                        <th style="padding:4px 6px;">Muslo</th>
                        <th style="padding:4px 6px;">Cadera</th>
                        <th style="padding:4px 6px;">Panto</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                </div>
            `;
        }

        if (typeof ProgressChartsModule !== 'undefined' && ProgressChartsModule.drawBodyCompositionChart) {
            setTimeout(() => ProgressChartsModule.drawBodyCompositionChart('chart-body-composition'), 100);
        }
    }

    // ═══════ Fotos de Progreso ═══════

    function initProgressPhotos() {
        const photos = JSON.parse(localStorage.getItem('rpCoach_progress_photos') || '{}');

        // Swap siluetas según género del perfil (imágenes recortadas de referencia 3D)
        const profile = JSON.parse(localStorage.getItem('rpCoach_profile') || '{}');
        const gender = profile.gender || 'male';
        const prefix = gender === 'female' ? 'img/sil-f-' : 'img/sil-m-';
        document.querySelectorAll('img[data-pose]').forEach(img => {
            const pose = img.dataset.pose;
            img.src = prefix + pose + '.png';
        });

        const phases = [
            'start-front', 'start-side', 'start-back',
            'mid-front', 'mid-side', 'mid-back',
            'end-front', 'end-side', 'end-back'
        ];
        phases.forEach(phase => {
            const slot = document.getElementById('photo-slot-' + phase);
            if (!slot) return;

            const input = slot.querySelector('.photo-input');
            const preview = slot.querySelector('.photo-preview');
            const deleteBtn = slot.querySelector('.photo-delete');
            const placeholder = slot.querySelector('.photo-placeholder');

            // Load saved photo
            if (photos[phase] && photos[phase].dataUrl) {
                preview.src = photos[phase].dataUrl;
                preview.classList.remove('hidden');
                deleteBtn.classList.remove('hidden');
                if (placeholder) placeholder.style.display = 'none';
            }

            // File input listener
            if (input && !input.hasListener) {
                input.hasListener = true;
                input.addEventListener('change', function (e) {
                    const file = e.target.files[0];
                    if (!file) return;
                    resizeAndSavePhoto(file, phase, preview, deleteBtn, placeholder);
                });
            }

            // Delete listener
            if (deleteBtn && !deleteBtn.hasListener) {
                deleteBtn.hasListener = true;
                deleteBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const saved = JSON.parse(localStorage.getItem('rpCoach_progress_photos') || '{}');
                    delete saved[phase];
                    localStorage.setItem('rpCoach_progress_photos', JSON.stringify(saved));
                    preview.classList.add('hidden');
                    preview.src = '';
                    deleteBtn.classList.add('hidden');
                    if (placeholder) placeholder.style.display = '';
                    if (input) input.value = '';
                    showNotification('🗑️ Foto eliminada');
                });
            }
        });
    }

    function resizeAndSavePhoto(file, phase, preview, deleteBtn, placeholder) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                // Resize to max 800px
                const maxSize = 800;
                let w = img.width, h = img.height;
                if (w > maxSize || h > maxSize) {
                    if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                    else { w = Math.round(w * maxSize / h); h = maxSize; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                // Save
                const saved = JSON.parse(localStorage.getItem('rpCoach_progress_photos') || '{}');
                saved[phase] = { dataUrl: dataUrl, date: new Date().toISOString().split('T')[0] };
                localStorage.setItem('rpCoach_progress_photos', JSON.stringify(saved));

                // Show preview
                preview.src = dataUrl;
                preview.classList.remove('hidden');
                deleteBtn.classList.remove('hidden');
                if (placeholder) placeholder.style.display = 'none';
                showNotification('📸 Foto guardada');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
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
        document.getElementById('detail-priority').textContent = routine.priority || '-';
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
                const methId = routine.methodologyName || routine.methodology;
                ProgressChartsModule.drawComplianceProgressionChart('compliance-progression-chart', methId, level);
            }

            // === Calendario de Asistencia del Mesociclo ===
            if (typeof CalendarioTracker !== 'undefined') {
                CalendarioTracker.initCalendar();
            }

            // === Cargar historial de Readiness si existe ===
            const readinessHistory = JSON.parse(localStorage.getItem('rpCoach_readiness_history') || '[]');
            if (readinessHistory.length >= 2) {
                renderReadinessHistory(readinessHistory);
            }

            // === Analíticas de Progresión ===
            if (typeof ProgressAnalytics !== 'undefined') {
                ProgressAnalytics.renderAll();
            }

            // === Composición Corporal (si activada) ===
            renderBodyCompositionFeedback();
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

        // === 4. Control de Volumen (MEV → MRV) desde rutina activa ===
        renderProgressVolumeControl();
    }

    function renderProgressVolumeControl() {
        const container = document.getElementById('progress-volume-control-container');
        if (!container) return;

        try {
            const routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || 'null');
            if (!routine || !routine.days || routine.days.length === 0) return;

            // Recopilar todos los músculos únicos de todos los días
            const allMuscles = [];
            routine.days.forEach(day => {
                if (day.muscles) {
                    day.muscles.forEach(m => {
                        if (!allMuscles.includes(m)) allMuscles.push(m);
                    });
                }
            });

            if (allMuscles.length === 0) return;

            if (typeof WorkoutUIController !== 'undefined' && WorkoutUIController.renderVolumeControl) {
                container.innerHTML = WorkoutUIController.renderVolumeControl(allMuscles, routine.level || 'intermediate', routine.methodology);
            }
        } catch (e) {
            // Silenciar errores
        }
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
        updateProgressRIR,
        renderRoutineDisplay
    };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    RPCoachApp.init();
});

// ─── #7: Exportar Resumen del Mesociclo a PDF ───────────────────────────────
window.exportMesocyclePDF = function () {
    try {
        const profile = JSON.parse(localStorage.getItem('rpCoach_profile') || '{}');
        const sessions = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]');
        const routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || '{}');
        const prs = JSON.parse(localStorage.getItem('rpCoach_strength_prs') || '[]');
        const bodyComp = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '[]');

        const name = profile.name || 'Atleta';
        const methodology = routine.methodology || '—';
        const totalSessions = sessions.length;
        const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

        // Calcular progresión por ejercicio
        const exerciseMap = {};
        sessions.forEach(s => {
            (s.exercises || []).forEach(ex => {
                if (!exerciseMap[ex.name]) exerciseMap[ex.name] = [];
                exerciseMap[ex.name].push({ weight: ex.weight, reps: ex.reps, date: s.date });
            });
        });

        let exerciseTableRows = '';
        Object.keys(exerciseMap).sort().forEach(exName => {
            const records = exerciseMap[exName];
            const first = records[0];
            const last = records[records.length - 1];
            const gain = last.weight && first.weight ? ((last.weight - first.weight) / first.weight * 100).toFixed(1) : '—';
            const trendColor = parseFloat(gain) >= 0 ? '#10B981' : '#EF4444';
            exerciseTableRows += `<tr>
                <td>${exName}</td>
                <td>${first?.weight || '—'}kg × ${first?.reps || '—'}</td>
                <td>${last?.weight || '—'}kg × ${last?.reps || '—'}</td>
                <td style="color:${trendColor};font-weight:700;">${parseFloat(gain) >= 0 ? '+' : ''}${gain}%</td>
            </tr>`;
        });

        let prRows = prs.slice(-10).map(p => `<tr><td>${p.exercise}</td><td>${p.weight}kg × ${p.reps}</td><td>${p.date}</td></tr>`).join('');
        let compRows = bodyComp.slice(-3).map(b => `<tr><td>${b.date || '—'}</td><td>${b.bodyFat ? b.bodyFat.toFixed(1) + '%' : '—'}</td><td>${b.muscleMass ? b.muscleMass + 'kg' : '—'}</td></tr>`).join('');

        const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Resumen de Mesociclo — ${name}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#111;}
  h1{color:#6B21A8;border-bottom:2px solid #6B21A8;padding-bottom:8px;}
  h2{color:#1D4ED8;margin-top:24px;font-size:1rem;}
  table{width:100%;border-collapse:collapse;margin-top:8px;font-size:0.85rem;}
  th{background:#6B21A8;color:#fff;padding:6px 10px;text-align:left;}
  td{padding:5px 10px;border-bottom:1px solid #ddd;}
  tr:nth-child(even){background:#f5f5ff;}
  .badge{display:inline-block;background:#E9D5FF;color:#6B21A8;padding:2px 8px;border-radius:4px;font-weight:700;font-size:0.8rem;}
  .footer{margin-top:32px;font-size:0.75rem;color:#666;text-align:center;}
</style>
</head>
<body>
<h1>🏋️ Resumen del Mesociclo — ${name}</h1>
<p><strong>Metodología:</strong> <span class="badge">${methodology}</span> &nbsp; <strong>Sesiones completadas:</strong> ${totalSessions} &nbsp; <strong>Generado:</strong> ${today}</p>

<h2>📈 Progresión por Ejercicio</h2>
<table><thead><tr><th>Ejercicio</th><th>Inicio</th><th>Final</th><th>Cambio</th></tr></thead>
<tbody>${exerciseTableRows || '<tr><td colspan="4">Sin datos de sesiones registrados.</td></tr>'}</tbody></table>

<h2>🏆 Últimos PRs Registrados</h2>
<table><thead><tr><th>Ejercicio</th><th>Marca</th><th>Fecha</th></tr></thead>
<tbody>${prRows || '<tr><td colspan="3">Sin PRs registrados.</td></tr>'}</tbody></table>

<h2>📐 Composición Corporal</h2>
<table><thead><tr><th>Fecha</th><th>% Grasa</th><th>Masa Muscular</th></tr></thead>
<tbody>${compRows || '<tr><td colspan="3">Sin mediciones registradas.</td></tr>'}</tbody></table>

<div class="footer">Generado por NEXUS-RP Coach v1.0 — Entrenamiento Inteligente Autorregulado</div>
</body></html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);

    } catch (e) {
        alert('Error al generar el PDF: ' + e.message);
    }
};
