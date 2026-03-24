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

        // Botón de Perfil en header
        const btnHeaderProfile = document.getElementById('btn-header-profile');
        if (btnHeaderProfile) {
            btnHeaderProfile.addEventListener('click', () => {
                switchModule('profile');
                // Resaltar botón activo
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            });
        }

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
            '<div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; display: flex; flex-direction: column;">' +
            '<div style="text-align: center; margin-bottom: 15px;">' +
            '<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">HISTORIAL DE READINESS</span>' +
            '</div>' +
            '<div style="display: flex; gap: 8px; align-items: flex-end; height: 65px; width: 100%; justify-content: space-between;">';

        lastEntries.forEach(entry => {
            const barHeight = Math.max(8, (entry.score / 5) * 40);
            const barColor = entry.score >= 4 ? '#10B981' : entry.score >= 3 ? '#F59E0B' : '#EF4444';
            const dayLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'short' }).substring(0, 2);
            html +=
                '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">' +
                '<div style="width: 18px; height: ' + barHeight + 'px; background: ' + barColor + '; border-radius: 4px; opacity: 0.85;" title="' + entry.date + ': ' + entry.score + '/5"></div>' +
                '<span style="font-size: 0.55rem; color: var(--text-muted); line-height: 1;">' + dayLabel + '</span>' +
                '</div>';
        });

        html += '</div>' +
            (trendText ? '<div style="text-align: center; margin-top: 8px;"><span style="font-size: 0.65rem; color: ' + trendColor + '; font-weight: 600;">' + trendText + ' (prom. ' + recentAvg.toFixed(1) + ')</span></div>' : '') +
            '</div>';
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

        // Actualizar botón de perfil en header
        const btnProfile = document.getElementById('btn-header-profile');
        if (btnProfile) {
            if (moduleName === 'profile') {
                btnProfile.style.background = 'linear-gradient(135deg, #E040FB, #7C3AED)';
                btnProfile.style.boxShadow = '0 0 12px rgba(139,92,246,0.4)';
            } else {
                btnProfile.style.background = 'linear-gradient(135deg, #6366F1, #8B5CF6)';
                btnProfile.style.boxShadow = 'none';
            }
        }

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
        // Widget de recordatorio de composición corporal en Inicio
        renderHomeCompReminder();
        // Widgets Premium
        renderPremiumInsights();
    }

    function renderPremiumInsights() {
        // 1. PR Tracker
        const prs = JSON.parse(localStorage.getItem('rpCoach_strength_prs') || '[]');
        if (prs.length > 0) {
            const lastPR = prs[prs.length - 1];
            const prExEl = document.getElementById('home-pr-exercise');
            const prDetEl = document.getElementById('home-pr-details');
            if(prExEl) prExEl.textContent = lastPR.exercise;
            if(prDetEl) prDetEl.innerHTML = `${lastPR.weight}kg × ${lastPR.reps} <br><span style="font-size:0.75rem; color:#10B981;">e1RM: ${parseFloat(lastPR.e1rm || 0).toFixed(1)}kg</span>`;
        }

        // 2. Weight Trend
        const bodyCompRaw = localStorage.getItem('rpCoach_body_composition');
        if (bodyCompRaw && bodyCompRaw !== '{}') {
            try {
                const bodyComp = JSON.parse(bodyCompRaw);
                const measures = Array.isArray(bodyComp) ? bodyComp : (bodyComp.measurements || []);
                if (measures.length > 0) {
                    const current = measures[measures.length - 1];
                    const wCur = document.getElementById('home-weight-current');
                    if(wCur) wCur.textContent = parseFloat(current.weight).toFixed(1) + ' kg';
                    
                    if (measures.length > 1) {
                        const prev = measures[measures.length - 2];
                        const diff = (current.weight - prev.weight).toFixed(1);
                        const trendEl = document.getElementById('home-weight-trend');
                        if(trendEl) {
                            if (diff > 0) {
                                trendEl.textContent = `+${diff}kg`;
                                trendEl.style.color = '#F59E0B'; // Ambar
                            } else if (diff < 0) {
                                trendEl.textContent = `${diff}kg`;
                                trendEl.style.color = '#10B981'; // Verde
                            } else {
                                trendEl.textContent = `=`;
                                trendEl.style.color = '#6b7280';
                            }
                        }
                    }
                }
            } catch(e) { console.warn("Error parsing body comp in home dashboard", e); }
        }

        // 3. Coach Tip
        const tipEl = document.getElementById('home-coach-tip');
        if(tipEl) {
            const tips = [
                "Concéntrate en la técnica hoy. La tensión mecánica es la clave del crecimiento.",
                "Deja 1-2 repeticiones en recámara si estás empezando el ciclo.",
                "Si el dolor articular sube, no dudes en reducir el volumen hoy.",
                "El descanso es donde ocurre la magia. Duerme tus 8 horas.",
                "Registra tus pesos reales. La sobrecarga no perdona la mala memoria."
            ];
            const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
            const dailyTip = tips[dayOfYear % tips.length];
            
            const routineRaw = localStorage.getItem('rpCoach_active_routine');
            if (routineRaw) {
                const routine = JSON.parse(routineRaw);
                if (routine.completedDays !== undefined && routine.days && routine.days.length > 0) {
                    const week = Math.floor(routine.completedDays / routine.days.length) + 1;
                    if (week === 1) tipEl.textContent = "Semana 1 (Introducción): Toca la rutina con calma. Deja unas 3 repeticiones en recámara (RIR 3) para no destrozarte el primer día.";
                    else if (week >= 4) tipEl.textContent = `Semana ${week} (Overreaching): Es el pico de fatiga. Empuja al límite (RIR 0-1) y gana tu descarga para la próxima semana.`;
                    else tipEl.textContent = `Semana ${week} (Acumulación): Intenta sacar 1 rep extra o sumar 2.5kg a la barra sin sacrificar técnica. RIR objetivo: 2-1.`;
                } else {
                    tipEl.textContent = dailyTip;
                }
            } else {
                tipEl.textContent = dailyTip;
            }
        }

        // 4. Routine Preview
        const previewList = document.getElementById('home-routine-preview-list');
        const previewMuscles = document.getElementById('home-preview-muscles');
        if(previewList && previewMuscles) {
            const routineRaw = localStorage.getItem('rpCoach_active_routine');
            if (routineRaw) {
                const routine = JSON.parse(routineRaw);
                if (routine.days && routine.days.length > 0) {
                    const currentDayIndex = (routine.completedDays || 0) % routine.days.length;
                    const todayWorkout = routine.days[currentDayIndex];
                    
                    previewMuscles.textContent = todayWorkout.focus || todayWorkout.name || 'Entrenamiento';
                    
                    if (todayWorkout.exercises && todayWorkout.exercises.length > 0) {
                        let html = todayWorkout.exercises.slice(0, 4).map(ex => {
                            return `<div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px; margin-bottom:4px;">
                                <span style="color:#E0E0E0; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70%; font-weight: 500;">
                                    <span style="color:#E040FB; margin-right:4px;">→</span>${ex.name}
                                </span>
                                <span style="color:var(--text-muted); font-size:0.8rem; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">
                                    ${ex.sets}x${ex.reps}
                                </span>
                            </div>`;
                        }).join('');
                        
                        if (todayWorkout.exercises.length > 4) {
                            html += `<div style="text-align:center; font-size:0.75rem; color:#A78BFA; margin-top:8px; font-weight:600;">
                                + ${todayWorkout.exercises.length - 4} ejercicios más
                            </div>`;
                        }
                        previewList.innerHTML = html;
                    } else {
                        previewList.innerHTML = '<div class="text-muted" style="font-size: 0.85rem; padding:10px 0;">Día de descanso activo.</div>';
                    }
                } else {
                    previewList.innerHTML = '<div class="text-muted" style="font-size: 0.85rem; padding:10px 0;">Rutina vacía.</div>';
                    previewMuscles.textContent = '';
                }
            } else {
                previewList.innerHTML = '<div class="text-muted" style="font-size: 0.85rem; padding:10px 0;">No tienes una rutina generada. Ve a Entrenamiento para crear una de élite.</div>';
                previewMuscles.textContent = '';
            }
        }
    }

    // Renderiza el widget de composición corporal en la sección de Inicio
    function renderHomeCompReminder() {
        const widget = document.getElementById('home-comp-reminder');
        if (!widget) return;

        const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '{"enabled":false,"measurements":[]}');
        const compFreq = localStorage.getItem('rpCoach_compFreq') || '';

        if (!data.enabled || !compFreq) {
            widget.classList.add('hidden');
            return;
        }
        widget.classList.remove('hidden');

        const freqDays = { weekly: 7, biweekly: 14, monthly: 30 };
        const toleranceDays = { weekly: 2, biweekly: 3, monthly: 5 };
        const freqSlots = { weekly: 20, biweekly: 10, monthly: 5 };
        const days = freqDays[compFreq] || 30;
        const tolerance = toleranceDays[compFreq] || 5;
        const requiredDays = days - tolerance;

        const measurements = (data.measurements || []).filter(m => !m.phase);
        const totalSlots = freqSlots[compFreq] || 5;
        const completed = Math.min(measurements.length, totalSlots);

        // Calcular próxima medición
        let lastDate = null;
        if (measurements.length > 0) {
            lastDate = new Date(measurements[measurements.length - 1].date);
        }
        const nextDate = lastDate ? new Date(lastDate.getTime() + days * 86400000) : new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((nextDate - today) / 86400000);
        const daysSinceLast = lastDate ? Math.floor((today - new Date(lastDate.getTime())) / 86400000) : 999;
        const isUnlocked = daysSinceLast >= requiredDays;

        // Fecha próxima
        const dateEl = document.getElementById('home-next-date');
        const daysEl = document.getElementById('home-days-left');
        const daysLabel = document.getElementById('home-days-label');

        const dateStr = nextDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        if (dateEl) dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

        if (daysLeft <= 0 || isUnlocked) {
            if (daysEl) { daysEl.textContent = '¡HOY!'; daysEl.style.color = '#10B981'; daysEl.style.fontSize = '1rem'; }
            if (daysLabel) daysLabel.textContent = 'disponible';
        } else if (daysLeft <= tolerance) {
            if (daysEl) { daysEl.textContent = daysLeft; daysEl.style.color = '#FBBF24'; }
            if (daysLabel) daysLabel.textContent = daysLeft === 1 ? 'día' : 'días';
        } else {
            if (daysEl) { daysEl.textContent = daysLeft; daysEl.style.color = '#A78BFA'; }
            if (daysLabel) daysLabel.textContent = daysLeft === 1 ? 'día' : 'días';
        }

        // Mini calendario compacto: últimas 3 + próxima
        const calDiv = document.getElementById('home-comp-calendar');
        if (calDiv) {
            const recentCount = Math.min(measurements.length, 3);
            let calHtml = '<div style="display:flex; gap:4px;">';
            for (let i = Math.max(0, measurements.length - recentCount); i < measurements.length; i++) {
                const m = measurements[i];
                const mDate = new Date(m.date);
                const dayNum = mDate.getDate();
                const monthName = mDate.toLocaleDateString('es-MX', { month: 'short' });
                calHtml += `<div style="flex:1; text-align:center; padding:4px 2px; border-radius:6px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3);">
                    <div style="font-size:0.9rem; font-weight:800; color:#10B981; line-height:1;">${dayNum}</div>
                    <div style="font-size:0.5rem; color:var(--text-muted);">${monthName}</div>
                    <div style="font-size:0.5rem; color:#10B981;">✓</div>
                </div>`;
            }
            const nNum = nextDate.getDate();
            const nMonth = nextDate.toLocaleDateString('es-MX', { month: 'short' });
            const uColor = isUnlocked || daysLeft <= 0 ? '#10B981' : '#A78BFA';
            const uBg = isUnlocked || daysLeft <= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.1)';
            const uBorder = isUnlocked || daysLeft <= 0 ? 'rgba(16,185,129,0.5)' : 'rgba(139,92,246,0.3)';
            calHtml += `<div style="flex:1; text-align:center; padding:4px 2px; border-radius:6px; background:${uBg}; border:2px dashed ${uBorder};">
                <div style="font-size:0.9rem; font-weight:800; color:${uColor}; line-height:1;">${nNum}</div>
                <div style="font-size:0.5rem; color:var(--text-muted);">${nMonth}</div>
                <div style="font-size:0.5rem; color:${uColor};">${isUnlocked || daysLeft <= 0 ? '→' : '🔒'}</div>
            </div>`;
            calHtml += '</div>';
            calDiv.innerHTML = calHtml;
        }

        // Barra de progreso
        const progressText = document.getElementById('home-comp-progress-text');
        const progressFill = document.getElementById('home-comp-progress-fill');
        if (progressText) progressText.textContent = `${completed} / ${totalSlots} mediciones`;
        if (progressFill) progressFill.style.width = `${(completed / totalSlots) * 100}%`;
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

        const saved = JSON.parse(localStorage.getItem('rpCoach_body_composition') || 'null');
        const compFreq = localStorage.getItem('rpCoach_compFreq') || '';

        if (saved && saved.enabled) {
            toggle.checked = true;
            fields.classList.remove('hidden');
            if (saved.measurements && saved.measurements.length > 0) {
                const last = saved.measurements[saved.measurements.length - 1];
                if (last.bodyFat) document.getElementById('bc-body-fat').value = last.bodyFat;
                if (last.muscleMass) document.getElementById('bc-muscle-mass').value = last.muscleMass;
                if (last.shoulder) document.getElementById('bc-shoulder').value = last.shoulder;
                if (last.chest) document.getElementById('bc-chest').value = last.chest;
                if (last.arm) document.getElementById('bc-arm').value = last.arm;
                if (last.waist) document.getElementById('bc-waist').value = last.waist;
                if (last.thigh) document.getElementById('bc-thigh').value = last.thigh;
                if (last.hip) document.getElementById('bc-hip').value = last.hip;
                if (last.calf) document.getElementById('bc-calf').value = last.calf;
            }

            const profileControls = document.getElementById('profile-wizard-controls');
            if (profileControls) profileControls.style.display = 'none';
        }

        // Inicializar botones de frecuencia en Perfil
        initProfileFreqButtons(compFreq);

        // Mostrar calendario de próxima medición si ya hay frecuencia configurada
        updateNextMeasurementCalendar();

        // Toggle listener — sincroniza con Métricas
        if (!toggle.hasListener) {
            toggle.hasListener = true;
            toggle.addEventListener('change', function () {
                fields.classList.toggle('hidden', !this.checked);
                const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '{"enabled":false,"frequency":"monthly","measurements":[]}');
                data.enabled = this.checked;
                localStorage.setItem('rpCoach_body_composition', JSON.stringify(data));

                const profileControls = document.getElementById('profile-wizard-controls');
                if (profileControls) profileControls.style.display = this.checked ? 'none' : 'flex';

                // Sincronizar: ocultar/mostrar composición en Métricas
                syncMetricasVisibility(this.checked);

                // Actualizar calendario
                updateNextMeasurementCalendar();
            });
        }

        // Save body comp and redirect
        if (saveBtn && !saveBtn.hasListener) {
            saveBtn.hasListener = true;
            saveBtn.addEventListener('click', () => {
                const success = saveBodyComposition();
                if (success) {
                    saveProfile();
                    // Actualizar calendario después de guardar
                    updateNextMeasurementCalendar();
                    // Sincronizar Métricas
                    syncMetricasVisibility(true);
                    try {
                        if (typeof switchModule === 'function') switchModule('workout');
                    } catch (e) { }
                }
            });
        }
    }

    // Inicializar botones de frecuencia en sección Perfil
    function initProfileFreqButtons(currentFreq) {
        document.querySelectorAll('.bc-profile-freq-btn').forEach(btn => {
            const f = btn.dataset.freq;
            // Resaltar el botón activo
            if (f === currentFreq) {
                btn.style.background = 'rgba(139,92,246,0.3)';
                btn.style.borderColor = '#8B5CF6';
                btn.style.color = '#fff';
            } else {
                btn.style.background = 'rgba(139,92,246,0.08)';
                btn.style.borderColor = 'rgba(139,92,246,0.3)';
                btn.style.color = '#A78BFA';
            }
            if (!btn.hasListener) {
                btn.hasListener = true;
                btn.addEventListener('click', () => {
                    localStorage.setItem('rpCoach_compFreq', f);
                    // Actualizar estilos de todos los botones
                    document.querySelectorAll('.bc-profile-freq-btn').forEach(b => {
                        if (b.dataset.freq === f) {
                            b.style.background = 'rgba(139,92,246,0.3)';
                            b.style.borderColor = '#8B5CF6';
                            b.style.color = '#fff';
                        } else {
                            b.style.background = 'rgba(139,92,246,0.08)';
                            b.style.borderColor = 'rgba(139,92,246,0.3)';
                            b.style.color = '#A78BFA';
                        }
                    });
                    // Actualizar calendario
                    updateNextMeasurementCalendar();
                    // Sincronizar Métricas (actualizar timeline allá)
                    if (typeof renderBodyCompositionFeedback === 'function') renderBodyCompositionFeedback();
                });
            }
        });
    }

    // Calendario de próxima medición en Perfil
    function updateNextMeasurementCalendar() {
        const container = document.getElementById('bc-next-measurement');
        if (!container) return;

        const compFreq = localStorage.getItem('rpCoach_compFreq') || '';
        const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '{"enabled":false,"measurements":[]}');

        if (!compFreq || !data.enabled) {
            container.classList.add('hidden');
            return;
        }

        const freqDays = { weekly: 7, biweekly: 14, monthly: 30 };
        const freqNames = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
        const days = freqDays[compFreq] || 30;

        // Buscar última medición (general o de fase)
        const measurements = data.measurements || [];
        let lastDate = null;
        if (measurements.length > 0) {
            lastDate = new Date(measurements[measurements.length - 1].date);
        }

        const nextDate = lastDate ? new Date(lastDate.getTime() + days * 86400000) : new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((nextDate - today) / 86400000);

        const dateStr = nextDate.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
        document.getElementById('bc-next-date').textContent = dateStr;

        const daysEl = document.getElementById('bc-days-left');
        if (daysLeft <= 0) {
            daysEl.textContent = '¡HOY!';
            daysEl.style.color = '#10B981';
            container.style.borderColor = 'rgba(16,185,129,0.5)';
            container.style.background = 'rgba(16,185,129,0.1)';
        } else if (daysLeft <= 2) {
            daysEl.textContent = daysLeft;
            daysEl.style.color = '#FBBF24';
            container.style.borderColor = 'rgba(251,191,36,0.3)';
            container.style.background = 'rgba(251,191,36,0.06)';
        } else {
            daysEl.textContent = daysLeft;
            daysEl.style.color = '#A78BFA';
            container.style.borderColor = 'rgba(16,185,129,0.2)';
            container.style.background = 'rgba(16,185,129,0.06)';
        }

        document.getElementById('bc-freq-label').textContent = `Frecuencia: ${freqNames[compFreq]} · ${lastDate ? 'Última: ' + lastDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Sin mediciones aún'}`;

        container.classList.remove('hidden');
    }

    // Sincronizar visibilidad de composición corporal en Métricas
    function syncMetricasVisibility(enabled) {
        const trackerCard = document.getElementById('comp-tracker-card');
        const globalSection = document.getElementById('body-composition-global');
        const phases = ['s1', 's3', 's5'];

        if (trackerCard) trackerCard.style.display = enabled ? 'block' : 'none';
        if (globalSection && !enabled) globalSection.style.display = 'none';

        phases.forEach(p => {
            const sec = document.getElementById(`body-composition-${p}`);
            if (sec) sec.style.display = enabled ? 'block' : 'none';
        });
    }

    function saveBodyComposition() {
        const measurement = {
            date: new Date().toISOString().split('T')[0],
            bodyFat: parseFloat(document.getElementById('bc-body-fat')?.value) || 0,
            muscleMass: parseFloat(document.getElementById('bc-muscle-mass')?.value) || 0,
            shoulder: parseFloat(document.getElementById('bc-shoulder')?.value) || 0,
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
        data.frequency = localStorage.getItem('rpCoach_compFreq') || 'monthly';
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
            shoulder: parseFloat(document.getElementById(`bc-shoulder-${phase}`)?.value) || 0,
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
        renderMeasurementOverlays();
        if (typeof ProgressAnalytics !== 'undefined' && typeof ProgressAnalytics.renderAll === 'function') {
            ProgressAnalytics.renderAll();
        }
    }

    function renderBodyCompositionFeedback() {
        const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '{"enabled":false,"measurements":[]}');
        const isEnabled = data.enabled !== false;

        const globalSection = document.getElementById('body-composition-global');

        // Sincronizar visibilidad según toggle de Perfil
        syncMetricasVisibility(isEnabled);
        if (!isEnabled) return;

        // Ocultar config de frecuencia en Métricas si ya está configurada en Perfil
        const compFreqConfig = document.getElementById('comp-freq-config');
        const savedFreq = localStorage.getItem('rpCoach_compFreq') || '';
        if (compFreqConfig && savedFreq) {
            compFreqConfig.style.display = 'none';
        } else if (compFreqConfig) {
            compFreqConfig.style.display = 'block';
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
                                document.getElementById(`bc-shoulder-${phase}`).value = latestPhase.shoulder || '';
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

        // ═══ Sistema de tracking de composición corporal con timeline ═══
        const genForm = document.getElementById('general-comp-form');
        const compFreq = localStorage.getItem('rpCoach_compFreq') || '';
        const freqConfig = { weekly: 20, biweekly: 10, monthly: 5 };
        const freqLabels = { weekly: 'Semana', biweekly: 'Quincena', monthly: 'Mes' };

        // Resaltar botón de frecuencia activo
        document.querySelectorAll('.comp-freq-btn').forEach(btn => {
            const f = btn.dataset.freq;
            if (f === compFreq) {
                btn.style.background = 'rgba(139,92,246,0.3)';
                btn.style.borderColor = '#8B5CF6';
                btn.style.color = '#fff';
            }
            if (!btn.hasListener) {
                btn.hasListener = true;
                btn.addEventListener('click', () => {
                    localStorage.setItem('rpCoach_compFreq', f);
                    renderBodyCompositionFeedback();
                });
            }
        });

        // Renderizar timeline si hay frecuencia configurada
        const timelineDiv = document.getElementById('comp-timeline');
        const progressBar = document.getElementById('comp-progress-bar');
        if (compFreq && timelineDiv) {
            const totalSlots = freqConfig[compFreq];
            const label = freqLabels[compFreq];
            const generalMeasurements = measurements.filter(m => !m.phase);
            const completedCount = Math.min(generalMeasurements.length, totalSlots);

            // Barra de progreso
            if (progressBar) {
                progressBar.style.display = 'block';
                document.getElementById('comp-progress-text').textContent = `${completedCount} / ${totalSlots}`;
                document.getElementById('comp-progress-fill').style.width = `${(completedCount / totalSlots) * 100}%`;
            }

            // Calcular si el próximo slot está desbloqueado por tiempo
            const freqDays = { weekly: 7, biweekly: 14, monthly: 30 };
            const toleranceDays = { weekly: 2, biweekly: 3, monthly: 5 };
            const requiredDays = freqDays[compFreq] - toleranceDays[compFreq];
            let nextSlotUnlocked = true;
            let daysUntilUnlock = 0;

            if (generalMeasurements.length > 0) {
                const lastMDate = new Date(generalMeasurements[generalMeasurements.length - 1].date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                lastMDate.setHours(0, 0, 0, 0);
                const daysSinceLast = Math.floor((today - lastMDate) / 86400000);
                nextSlotUnlocked = daysSinceLast >= requiredDays;
                daysUntilUnlock = Math.max(0, requiredDays - daysSinceLast);
            }

            // Timeline visual: grid de slots
            let html = '';
            // Mensaje de bloqueo si aplica
            if (!nextSlotUnlocked && generalMeasurements.length < totalSlots) {
                html += `<div style="text-align:center; padding:8px; margin-bottom:8px; background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.25); border-radius:8px;">
                    <span style="font-size:0.75rem; color:#FBBF24;">🔒 Próxima medición disponible en <strong>${daysUntilUnlock} día${daysUntilUnlock !== 1 ? 's' : ''}</strong></span>
                </div>`;
            }
            html += '<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px;">';
            for (let i = 0; i < totalSlots; i++) {
                const hasMeasurement = i < generalMeasurements.length;
                const m = hasMeasurement ? generalMeasurements[i] : null;
                const isNext = i === generalMeasurements.length;
                const isLocked = isNext && !nextSlotUnlocked;

                const bg = hasMeasurement
                    ? 'rgba(16,185,129,0.2)'
                    : isNext
                        ? (isLocked ? 'rgba(251,191,36,0.08)' : 'rgba(139,92,246,0.15)')
                        : 'rgba(255,255,255,0.03)';
                const border = hasMeasurement
                    ? 'rgba(16,185,129,0.4)'
                    : isNext
                        ? (isLocked ? 'rgba(251,191,36,0.3)' : 'rgba(139,92,246,0.4)')
                        : 'rgba(255,255,255,0.08)';
                const color = hasMeasurement ? '#10B981' : isNext ? (isLocked ? '#FBBF24' : '#A78BFA') : 'rgba(255,255,255,0.25)';
                const cursor = hasMeasurement ? 'pointer' : (isNext && !isLocked) ? 'pointer' : 'default';
                const icon = hasMeasurement ? '✓' : isNext ? (isLocked ? '🔒' : '+') : '';

                html += `<div class="comp-slot" data-slot="${i}" data-locked="${isLocked}"
                    style="padding:6px 4px; text-align:center; border-radius:6px; background:${bg}; border:1px solid ${border}; cursor:${cursor}; transition:all 0.2s;${isNext && !isLocked ? 'animation:pulse 2s infinite;' : ''}${isLocked ? 'opacity:0.7;' : ''}">
                    <div style="font-size:0.6rem; font-weight:700; color:${color};">${label} ${i + 1}</div>
                    <div style="font-size:0.75rem; font-weight:700; color:${color}; margin-top:2px;">${icon}</div>
                    ${m ? `<div style="font-size:0.5rem; color:var(--text-muted); margin-top:1px;">${m.date.slice(5)}</div>` : ''}
                </div>`;
            }
            html += '</div>';
            timelineDiv.innerHTML = html;

            // Click en slots
            timelineDiv.querySelectorAll('.comp-slot').forEach(slot => {
                slot.addEventListener('click', () => {
                    const idx = parseInt(slot.dataset.slot);
                    const isCompleted = idx < generalMeasurements.length;
                    const isNextSlot = idx === generalMeasurements.length;
                    const slotLocked = slot.dataset.locked === 'true';

                    if (slotLocked) {
                        showNotification(`🔒 Faltan ${daysUntilUnlock} día${daysUntilUnlock !== 1 ? 's' : ''} para tu próxima medición`);
                        return;
                    }
                    if (!isCompleted && !isNextSlot) return;

                    genForm.classList.remove('hidden');
                    const formTitle = document.getElementById('comp-form-title');
                    if (formTitle) formTitle.textContent = isCompleted
                        ? `${label} ${idx + 1} — Editar`
                        : `${label} ${idx + 1} — Nueva Medición`;

                    // Repoblar si existe
                    const m = isCompleted ? generalMeasurements[idx] : (generalMeasurements.length > 0 ? generalMeasurements[generalMeasurements.length - 1] : null);
                    if (m) {
                        ['shoulder','chest','arm','waist','hip','thigh','calf'].forEach(f => {
                            const el = document.getElementById(`bc-${f}-gen`);
                            if (el) el.value = m[f] || '';
                        });
                        document.getElementById('bc-fat-gen').value = m.bodyFat || '';
                        document.getElementById('bc-muscle-gen').value = m.muscleMass || '';
                    }
                    genForm.dataset.editIndex = isCompleted ? idx : '-1';
                });
            });
        } else if (timelineDiv) {
            timelineDiv.innerHTML = '';
            if (progressBar) progressBar.style.display = 'none';
        }

        // Botón cerrar formulario
        const closeBtn = document.getElementById('btn-close-comp-form');
        if (closeBtn && !closeBtn.hasListener) {
            closeBtn.hasListener = true;
            closeBtn.addEventListener('click', () => genForm.classList.add('hidden'));
        }

        // Guardar medición
        const saveGenBtn = document.getElementById('btn-save-general-comp');
        if (saveGenBtn && !saveGenBtn.hasListener) {
            saveGenBtn.hasListener = true;
            saveGenBtn.addEventListener('click', () => {
                const measurement = {
                    date: new Date().toISOString().split('T')[0],
                    bodyFat: parseFloat(document.getElementById('bc-fat-gen')?.value) || 0,
                    muscleMass: parseFloat(document.getElementById('bc-muscle-gen')?.value) || 0,
                    shoulder: parseFloat(document.getElementById('bc-shoulder-gen')?.value) || 0,
                    chest: parseFloat(document.getElementById('bc-chest-gen')?.value) || 0,
                    arm: parseFloat(document.getElementById('bc-arm-gen')?.value) || 0,
                    waist: parseFloat(document.getElementById('bc-waist-gen')?.value) || 0,
                    hip: parseFloat(document.getElementById('bc-hip-gen')?.value) || 0,
                    thigh: parseFloat(document.getElementById('bc-thigh-gen')?.value) || 0,
                    calf: parseFloat(document.getElementById('bc-calf-gen')?.value) || 0
                };
                if (measurement.bodyFat === 0 && measurement.muscleMass === 0 &&
                    measurement.chest === 0 && measurement.arm === 0) {
                    showNotification('⚠️ Ingresa al menos un dato de medición');
                    return;
                }
                const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '{"enabled":true,"measurements":[]}');
                data.enabled = true;
                const editIdx = parseInt(genForm.dataset.editIndex || '-1');
                const genMeasurements = data.measurements.filter(m => !m.phase);
                if (editIdx >= 0 && editIdx < genMeasurements.length) {
                    // Encontrar el índice real en el array completo
                    let realIdx = -1, genCount = -1;
                    for (let i = 0; i < data.measurements.length; i++) {
                        if (!data.measurements[i].phase) {
                            genCount++;
                            if (genCount === editIdx) { realIdx = i; break; }
                        }
                    }
                    if (realIdx >= 0) data.measurements[realIdx] = measurement;
                } else {
                    data.measurements.push(measurement);
                }
                localStorage.setItem('rpCoach_body_composition', JSON.stringify(data));
                showNotification('✅ Medición guardada correctamente');
                genForm.classList.add('hidden');
                renderBodyCompositionFeedback();
                renderMeasurementOverlays();
            });
        }

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
                    <td style="padding:4px 6px;">${m.shoulder || '-'}</td>
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
                        <th style="padding:4px 6px;">Músc</th>
                        <th style="padding:4px 6px;">Hombro</th>
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

        // Renderizar indicadores de medición sobre las siluetas
        renderMeasurementOverlays();
    }

    // ═══════ Indicadores de Medición sobre Siluetas ═══════

    // Estado global de unidad (cm o in)
    let measureUnit = localStorage.getItem('rpCoach_measureUnit') || 'cm';

    function renderMeasurementOverlays() {
        const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '{"measurements":[]}');
        const measurements = data.measurements || [];
        const phaseMap = { 'start': 's1', 'mid': 's3', 'end': 's5' };

        // ═══ Solo textos al lado del cuerpo ═══
        // top: altura anatómica (%), x: posición horizontal (%), side: 'r' o 'l'
        // Frontal: labels a la derecha | Posterior: labels a la izquierda
        // Lateral: labels a la derecha
        const frontLayout = [
            { key: 'shoulder', top: 19, label: 'Hombro',      x: 80, side: 'r' },
            { key: 'chest',    top: 26, label: 'Pecho',       x: 80, side: 'r' },
            { key: 'arm',      top: 32, label: 'Brazo',       x: 82, side: 'r' },
            { key: 'waist',    top: 39, label: 'Cintura',     x: 80, side: 'r' },
            { key: 'hip',      top: 47, label: 'Cadera',      x: 80, side: 'r' },
            { key: 'thigh',    top: 61, label: 'Muslo',       x: 80, side: 'r' },
            { key: 'calf',     top: 79, label: 'Pantorrilla', x: 80, side: 'r' }
        ];
        const sideLayout = [
            { key: 'shoulder', top: 19, label: 'Hombro',      x: 75, side: 'r' },
            { key: 'chest',    top: 26, label: 'Pecho',       x: 75, side: 'r' },
            { key: 'waist',    top: 39, label: 'Cintura',     x: 75, side: 'r' },
            { key: 'hip',      top: 47, label: 'Cadera',      x: 75, side: 'r' },
            { key: 'thigh',    top: 61, label: 'Muslo',       x: 75, side: 'r' },
            { key: 'calf',     top: 79, label: 'Pantorrilla', x: 75, side: 'r' }
        ];
        const backLayout = [
            { key: 'shoulder', top: 19, label: 'Hombro',      x: 20, side: 'l' },
            { key: 'chest',    top: 26, label: 'Espalda',     x: 20, side: 'l' },
            { key: 'arm',      top: 32, label: 'Brazo',       x: 18, side: 'l' },
            { key: 'waist',    top: 39, label: 'Cintura',     x: 20, side: 'l' },
            { key: 'hip',      top: 47, label: 'Cadera',      x: 20, side: 'l' },
            { key: 'thigh',    top: 58, label: 'Muslo',       x: 20, side: 'l' },
            { key: 'calf',     top: 76, label: 'Pantorrilla', x: 20, side: 'l' }
        ];
        const layouts = { front: frontLayout, side: sideLayout, back: backLayout };

        // Fallback: última medición general (sin fase)
        const generalMeasurements = measurements.filter(m => !m.phase);
        const latestGeneral = generalMeasurements.length > 0 ? generalMeasurements[generalMeasurements.length - 1] : null;

        ['start', 'mid', 'end'].forEach(phasePre => {
            const bcPhase = phaseMap[phasePre];
            const phaseMeasurements = measurements.filter(m => m.phase === bcPhase);
            const latest = phaseMeasurements.length > 0
                ? phaseMeasurements[phaseMeasurements.length - 1]
                : latestGeneral;

            ['front', 'side', 'back'].forEach(pose => {
                const slot = document.getElementById(`photo-slot-${phasePre}-${pose}`);
                if (!slot) return;

                // Limpiar overlays previos
                slot.querySelectorAll('.measure-overlay, .measure-comp-badge').forEach(el => el.remove());

                if (!latest) return;

                const layout = layouts[pose];
                if (!layout) return;

                const hasData = layout.some(item => latest[item.key] > 0);
                const hasComp = (latest.bodyFat > 0 || latest.muscleMass > 0);
                if (!hasData && !hasComp) return;

                // Badge de composición corporal (grasa/músculo) en esquina superior izquierda
                if (hasComp && pose === 'front') {
                    const badge = document.createElement('div');
                    badge.className = 'measure-comp-badge';
                    if (latest.bodyFat > 0) {
                        const fat = document.createElement('span');
                        fat.className = 'fat-badge';
                        fat.textContent = `% Grasa: ${latest.bodyFat}%`;
                        badge.appendChild(fat);
                    }
                    if (latest.muscleMass > 0) {
                        const muscle = document.createElement('span');
                        muscle.className = 'muscle-badge';
                        muscle.textContent = `Musc: ${latest.muscleMass} kg`;
                        badge.appendChild(muscle);
                    }
                    slot.appendChild(badge);
                }

                if (!hasData) return;

                const overlay = document.createElement('div');
                overlay.className = 'measure-overlay';

                // Toggle CM/IN (solo en la pose frontal para no repetir)
                if (pose === 'front') {
                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'measure-unit-toggle';
                    toggleBtn.textContent = measureUnit === 'cm' ? 'CM' : 'IN';
                    toggleBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        measureUnit = measureUnit === 'cm' ? 'in' : 'cm';
                        localStorage.setItem('rpCoach_measureUnit', measureUnit);
                        renderMeasurementOverlays();
                    });
                    overlay.appendChild(toggleBtn);
                }

                // Crear textos de medición al lado del cuerpo
                layout.forEach(item => {
                    const value = latest[item.key];
                    if (!value || value <= 0) return;

                    const displayValue = measureUnit === 'in'
                        ? (value / 2.54).toFixed(1) + '"'
                        : value + ' cm';

                    const label = document.createElement('span');
                    label.className = 'measure-label';
                    label.textContent = `${item.label}: ${displayValue}`;
                    label.style.top = item.top + '%';
                    if (item.side === 'r') {
                        label.style.left = item.x + '%';
                    } else {
                        label.style.right = (100 - item.x) + '%';
                    }

                    overlay.appendChild(label);
                });

                slot.appendChild(overlay);
            });
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

// ─── #7: Exportar Resumen del Mesociclo a PDF (PREMIUM) ───────────────────────────────
window.showExportOptions = function() {
    const modal = document.getElementById('export-options-modal');
    if(modal) {
        modal.style.display = 'flex';
        void modal.offsetWidth;
        modal.style.opacity = '1';
    }
};

window.closeExportOptions = function() {
    const modal = document.getElementById('export-options-modal');
    if(modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.style.display = 'none', 300);
    }
};

window.exportMesocyclePDF = function (period = 'all') {
    window.closeExportOptions();
    try {
        // Datos del LocalStorage
        const profile = JSON.parse(localStorage.getItem('rpCoach_profile') || '{}');
        let sessions = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]');
        let routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || '{}');
        let prs = JSON.parse(localStorage.getItem('rpCoach_strength_prs') || '[]');
        let bodyComp = JSON.parse(localStorage.getItem('rpCoach_body_composition') || '[]');
        let readinessData = JSON.parse(localStorage.getItem('rpCoach_readiness_history') || '[]');

        if (!Array.isArray(sessions)) sessions = [];
        if (!Array.isArray(prs)) prs = [];
        if (!Array.isArray(bodyComp)) bodyComp = [];
        if (!Array.isArray(readinessData)) readinessData = [];

        // Filtrado por periodo
        let periodLabel = 'MESOCICLO COMPLETO';
        if (period === 'week' || period === 'month') {
            const cutoffDate = new Date();
            if (period === 'week') {
                cutoffDate.setDate(cutoffDate.getDate() - 7);
                periodLabel = 'ÚLTIMOS 7 DÍAS';
            } else if (period === 'month') {
                cutoffDate.setDate(cutoffDate.getDate() - 30);
                periodLabel = 'ÚLTIMOS 30 DÍAS';
            }
            
            cutoffDate.setHours(0,0,0,0);
            
            sessions = sessions.filter(s => new Date(s.date || s.dateFormatted || s.timestamp) >= cutoffDate);
            prs = prs.filter(p => new Date(p.date) >= cutoffDate);
            bodyComp = bodyComp.filter(b => b.date && new Date(b.date) >= cutoffDate);
            readinessData = readinessData.filter(r => r.date && new Date(r.date) >= cutoffDate);
        }

        // 1. INFO DEL ATLETA Y GENERALIDADES
        const name = profile.name || 'Atleta VIP';
        const weight = profile.weight ? profile.weight + ' kg' : '—';
        const methodology = routine.methodology || 'Sin asignar';
        const split = routine.split ? routine.split.replace(/_/g, ' ').toUpperCase() : 'General';
        const level = profile.level ? profile.level.toUpperCase() : 'INTERMEDIO';
        const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        
        // 2. MÉTRICAS DE ENTRENAMIENTO
        const totalSessions = sessions.length;
        let totalVolume = 0;
        let avgPump = 0, avgDisruption = 0, avgFatigue = 0, sfrSessions = 0;
        
        const exerciseMap = {};
        
        sessions.forEach(s => {
            totalVolume += (s.totalVolume || 0);
            
            // SFR Promedio
            if (s.sfr) {
                avgPump += (s.sfr.pump || 3);
                avgDisruption += (s.sfr.disruption || 3);
                avgFatigue += (s.sfr.fatigue || 3);
                sfrSessions++;
            }

            // Mapeo de ejercicios para progresión
            (s.exercises || s.sets ? [s] : []).forEach(ex => {
                const exName = ex.exercise || ex.name || 'Ejercicio';
                if (!exerciseMap[exName]) exerciseMap[exName] = [];
                // Determinar el peso y reps de la serie más pesada o la primera
                let maxWeight = 0;
                let repsForMax = 0;
                if (ex.sets && Array.isArray(ex.sets)) {
                    ex.sets.forEach(set => {
                        if (set.weight > maxWeight) {
                            maxWeight = set.weight;
                            repsForMax = set.reps;
                        }
                    });
                } else if (ex.weight) {
                    maxWeight = ex.weight;
                    repsForMax = ex.reps;
                }
                
                if (maxWeight > 0) {
                    exerciseMap[exName].push({ weight: maxWeight, reps: repsForMax, date: s.date || s.dateFormatted });
                }
            });
        });

        if (sfrSessions > 0) {
            avgPump = (avgPump / sfrSessions).toFixed(1);
            avgDisruption = (avgDisruption / sfrSessions).toFixed(1);
            avgFatigue = (avgFatigue / sfrSessions).toFixed(1);
        } else {
            avgPump = '—'; avgDisruption = '—'; avgFatigue = '—';
        }

        // 3. RECUPERACIÓN (READINESS)
        let avgReadiness = '—';
        let latestReadiness = '—';
        if (readinessData.length > 0) {
            latestReadiness = readinessData[readinessData.length - 1].score + '/10';
            const sumR = readinessData.reduce((acc, curr) => acc + curr.score, 0);
            avgReadiness = (sumR / readinessData.length).toFixed(1) + '/10';
        }

        // 4. TABLAS GENERADAS (HTML)
        // Progresión de Sobrecarga (TOP 10 Ejercicios más frecuentes)
        let exerciseTableRows = '';
        const sortedExercises = Object.keys(exerciseMap).sort((a,b) => exerciseMap[b].length - exerciseMap[a].length).slice(0, 10);
        
        sortedExercises.forEach(exName => {
            const records = exerciseMap[exName];
            if (records.length >= 2) {
                const first = records[0];
                const last = records[records.length - 1];
                const gain = ((last.weight - first.weight) / (first.weight || 1) * 100).toFixed(1);
                const trendColor = parseFloat(gain) >= 0 ? '#10B981' : '#EF4444';
                const trendIcon = parseFloat(gain) >= 0 ? '↗' : '↘';
                
                exerciseTableRows += `<tr>
                    <td><strong>${exName}</strong><br><span style="font-size:0.7rem;color:#666;">${records.length} registros</span></td>
                    <td>${first.weight}kg × ${first.reps}<br><span style="font-size:0.7rem;color:#888;">${first.date}</span></td>
                    <td>${last.weight}kg × ${last.reps}<br><span style="font-size:0.7rem;color:#888;">${last.date}</span></td>
                    <td style="color:${trendColor};font-weight:800;font-size:1.1rem;">${parseFloat(gain) > 0 ? '+' : ''}${gain}% ${parseFloat(gain) !== 0 ? trendIcon:''}</td>
                </tr>`;
            }
        });

        // PRs y Tests
        let prRows = prs.slice(-6).reverse().map(p => `<tr>
            <td><strong>${p.exercise}</strong></td>
            <td style="color:#E040FB;font-weight:700;">${p.weight}kg × ${p.reps}</td>
            <td><strong>${p.e1rm ? parseFloat(p.e1rm).toFixed(1) + 'kg' : '—'}</strong></td>
            <td>${p.date || '—'}</td>
        </tr>`).join('');

        // Composición Corporal
        let compRows = bodyComp.slice(-5).reverse().map(b => `<tr>
            <td>${b.date || '—'}</td>
            <td><strong>${b.weight ? b.weight + 'kg' : '—'}</strong></td>
            <td style="color:#F59E0B;">${b.bodyFat ? parseFloat(b.bodyFat).toFixed(1) + '%' : '—'}</td>
            <td style="color:#10B981;">${b.muscleMass ? parseFloat(b.muscleMass).toFixed(1) + 'kg' : '—'}</td>
        </tr>`).join('');

        // 5. CONSTRUCCIÓN DEL HTML PREMIUM
        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte Élite — ${name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #1f2937; background: #ffffff; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 4px solid #10B981; padding-bottom: 15px; margin-bottom: 30px; }
        .logo-title { font-size: 2.2rem; font-weight: 800; color: #111827; margin: 0; }
        .logo-title span { color: #E040FB; }
        .date-badge { background: #f3f4f6; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: #4b5563; }
        
        .grid-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 35px; }
        .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .card.premium { border-color: #E040FB; background: #fdfaef; }
        .card__val { font-size: 1.8rem; font-weight: 800; color: #111827; }
        .card__val.accent { color: #10B981; }
        .card__lbl { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 5px; font-weight: 600; }
        
        .section-title { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 40px 0 15px 0; display: flex; align-items: center; gap: 8px; }
        .section-title::before { content: ''; display: inline-block; width: 6px; height: 24px; background: #E040FB; border-radius: 3px; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.95rem; }
        th { background: #111827; color: white; padding: 12px 15px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }
        td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
        tr:nth-child(even) td { background: #f9fafb; }
        
        .sfr-bar { display: flex; gap: 15px; background: #111827; color: white; padding: 20px; border-radius: 12px; margin-top: 20px; justify-content: space-around; }
        .sfr-item { text-align: center; }
        .sfr-item-val { font-size: 1.5rem; font-weight: 800; color: #10B981; }
        .sfr-item-lbl { font-size: 0.75rem; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px; margin-top: 4px; }
        
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 0.8rem; color: #9ca3af; font-weight: 600; }
        
        /* Ocultar elementos en impresión para que sea limpio */
        @media print { body { padding: 10px; } }
    </style>
</head>
<body>

    <div class="header">
        <div>
            <h1 class="logo-title">RP <span>COACH</span></h1>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-weight: 600; font-size: 0.9rem;">REPORTE DE RENDIMIENTO ÉLITE <span style="color:#E040FB;">• ${periodLabel}</span></p>
        </div>
        <div class="date-badge">🗓️ Emitido: ${today}</div>
    </div>

    <!-- CARDS PRINCIPALES -->
    <div class="grid-cards">
        <div class="card">
            <div class="card__val">${name}</div>
            <div class="card__lbl">Atleta / ${level}</div>
        </div>
        <div class="card">
            <div class="card__val">${methodology}</div>
            <div class="card__lbl">Metodología (${split})</div>
        </div>
        <div class="card">
            <div class="card__val">${totalSessions}</div>
            <div class="card__lbl">Sesiones Totales</div>
        </div>
        <div class="card premium">
            <div class="card__val accent">${totalVolume >= 1000 ? (totalVolume/1000).toFixed(1) + 'k' : totalVolume} <span style="font-size:1rem;color:#111;">kg</span></div>
            <div class="card__lbl">Volumen Total Alzado</div>
        </div>
    </div>

    <!-- ESTADO DE RECUPERACIÓN / SFR -->
    <h2 class="section-title">Análisis de Percepción y Fatiga (SFR)</h2>
    <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 10px;">Promedios calculados a lo largo del mesociclo a partir de los datos registrados al final de cada sesión. Un Pump y Disrupción altos con Fatiga controlada representan hipertrofia óptima.</p>
    <div class="sfr-bar">
        <div class="sfr-item">
            <div class="sfr-item-val">${avgPump}/5</div>
            <div class="sfr-item-lbl">Pump Promedio</div>
        </div>
        <div class="sfr-item">
            <div class="sfr-item-val">${avgDisruption}/5</div>
            <div class="sfr-item-lbl">Disrupción Muscular</div>
        </div>
        <div class="sfr-item">
            <div class="sfr-item-val" style="color: #F59E0B;">${avgFatigue}/5</div>
            <div class="sfr-item-lbl">Fatiga Articular/SNC</div>
        </div>
        <div class="sfr-item">
            <div class="sfr-item-val" style="color: #E040FB;">${avgReadiness}</div>
            <div class="sfr-item-lbl">Readiness Histórico</div>
        </div>
    </div>

    <!-- PROGRESIÓN DE SOBRECARGA -->
    <h2 class="section-title">Sobrecarga Progresiva (Progreso Efectivo)</h2>
    <table>
        <thead>
            <tr>
                <th>Ejercicio Frecuente</th>
                <th>Marca Inicial</th>
                <th>Marca Actual</th>
                <th>Variación %</th>
            </tr>
        </thead>
        <tbody>
            ${exerciseTableRows || '<tr><td colspan="4" style="text-align:center;color:#6b7280;">No hay suficientes datos de entrenamiento guardados para comparar la progresión.</td></tr>'}
        </tbody>
    </table>

    <!-- RÉCORDS DE FUERZA (TESTS 1RM / PRS) -->
    <h2 class="section-title">Mejores Marcas Absolutas (PRs y Tests)</h2>
    <table>
        <thead>
            <tr>
                <th>Levantamiento</th>
                <th>Récord Alcanzado (Peso x Reps)</th>
                <th>e1RM Calculado</th>
                <th>Fecha Alcanzado</th>
            </tr>
        </thead>
        <tbody>
            ${prRows || '<tr><td colspan="4" style="text-align:center;color:#6b7280;">No hay récords de fuerza (PRs) registrados en el módulo de Tests.</td></tr>'}
        </tbody>
    </table>

    <!-- COMPOSICIÓN CORPORAL -->
    <h2 class="section-title">Evolución de Composición Corporal</h2>
    <table>
        <thead>
            <tr>
                <th>Fecha de Medición</th>
                <th>Peso Corporal Total</th>
                <th>% Grasa Corporal</th>
                <th>Masa Muscular Magra</th>
            </tr>
        </thead>
        <tbody>
            ${compRows || '<tr><td colspan="4" style="text-align:center;color:#6b7280;">No existen mediciones físicas registradas en el módulo de Métricas.</td></tr>'}
        </tbody>
    </table>

    <!-- FIRMA/FOOTER -->
    <div class="footer">
        GENERADO INTELIGENTEMENTE POR NEXUS RP-COACH SYSTEM<br>
        <span style="font-weight: 400; opacity: 0.7;">Optimización de Volumen, Recuperación & Sobrecarga Guiada por IA</span>
    </div>

    <script>
        // Imprimir automáticamente cuando cargue
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;

        // Generación y apertura del reporte
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();

    } catch (e) {
        alert('Error Crítico al construir el Reporte VIP: ' + e.message);
        console.error(e);
    }
};

// ─── #8: Resumen Diario (Modal) ───────────────────────────────
window.showDailySummary = function() {
    try {
        const modal = document.getElementById('daily-summary-modal');
        if (!modal) return;
        
        // 1. Fecha
        const dateEl = document.getElementById('daily-summary-date');
        if (dateEl) {
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = today.toLocaleDateString('es-ES', options).replace(/^./, str => str.toUpperCase());
        }

        // 2. Readiness
        const readinessData = JSON.parse(localStorage.getItem('rpCoach_readiness_history') || '[]');
        const readinessEl = document.getElementById('ds-readiness');
        if (readinessEl) {
            if (readinessData.length > 0) {
                const latest = readinessData[readinessData.length - 1];
                readinessEl.textContent = `${latest.score}/10`;
                readinessEl.style.color = latest.score >= 8 ? '#10B981' : (latest.score >= 5 ? '#F59E0B' : '#EF4444');
            } else {
                readinessEl.textContent = 'N/A';
                readinessEl.style.color = '#A78BFA';
            }
        }

        // 3. Volumen Total
        const sessionHistory = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]');
        const volumeEl = document.getElementById('ds-volume');
        if (volumeEl) {
            let totalVol = 0;
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);
            
            sessionHistory.filter(s => new Date(s.date) >= weekStart).forEach(s => {
                totalVol += (s.totalVolume || 0);
            });
            volumeEl.textContent = totalVol > 0 ? (totalVol / 1000).toFixed(1) + 'k' : '0';
        }

        // 4. Enfoque / Rutina Actual
        const routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || '{}');
        const focusEl = document.getElementById('ds-focus');
        const methEl = document.getElementById('ds-methodology');
        
        if (focusEl) {
            if (routine.split && routine.days && routine.days.length > 0) {
                // Tratando de encontrar el día actual (simplificado)
                const currentDayIndex = (routine.completedDays || 0) % routine.days.length;
                focusEl.textContent = routine.days[currentDayIndex]?.name || 'Descanso / Pendiente';
            } else {
                focusEl.textContent = 'Sin rutina activa';
            }
        }
        if (methEl) {
            methEl.textContent = `Metodología: ${routine.methodology || 'Ninguna'}`;
        }

        // 5. Nutrición
        const profile = JSON.parse(localStorage.getItem('rpCoach_profile') || '{}');
        const calEl = document.getElementById('ds-cals');
        const protEl = document.getElementById('ds-prot');
        const carbEl = document.getElementById('ds-carbs');
        
        if (calEl && protEl && carbEl) {
            const weight = parseFloat(profile.weight) || 80;
            // Cálculos súper básicos y fijos para la demostración
            const calories = Math.round(weight * 33); // Aprox mantenimiento/ligero superavit
            const protein = Math.round(weight * 2.2); // 2.2g por kg
            const carbs = Math.round(weight * 4); // 4g por kg
            
            calEl.textContent = `${calories} kcal`;
            protEl.textContent = `${protein}g`;
            carbEl.textContent = `${carbs}g`;
        }
        
        // Show modal
        modal.style.display = 'flex';
        // Trigger reflow
        void modal.offsetWidth;
        modal.style.opacity = '1';
        
    } catch (e) {
        console.error('Error al abrir el resumen diario:', e);
    }
};

window.closeDailySummary = function() {
    const modal = document.getElementById('daily-summary-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
};

window.switchFeedbackTab = function(sectionId) {
    const contents = document.querySelectorAll('.feedback-tab-content');
    contents.forEach(c => {
        c.classList.remove('active-tab');
        c.style.display = 'none';
        c.style.setProperty('display', 'none', 'important');
    });

    const target = document.getElementById(sectionId);
    if(target) {
        target.classList.add('active-tab');
        target.style.display = 'block';
        target.style.setProperty('display', 'block', 'important');
    }

    const btns = document.querySelectorAll('.feedback-tab-btn');
    btns.forEach(b => {
        b.classList.remove('active');
        if(b.getAttribute('onclick') && b.getAttribute('onclick').includes(sectionId)) {
            b.classList.add('active');
        }
    });
};
