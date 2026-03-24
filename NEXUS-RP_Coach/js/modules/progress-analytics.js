/**
 * NEXUS-RP Coach - Progress Analytics Module
 * Análisis de progresión: historial por ejercicio, volumen real vs MEV/MRV,
 * detección de estancamiento, 1RM estimado, comparación entre semanas.
 */
const ProgressAnalytics = (() => {
    const SESSION_HISTORY_KEY = 'rpCoach_session_history';
    const ROUTINE_KEY = 'rpCoach_active_routine';

    // Mapa de músculos español → inglés para VolumeMEVMRVModule
    const MUSCLE_MAP = {
        'Pecho': 'chest', 'Espalda': 'back', 'Hombros': 'shoulders',
        'Cuádriceps': 'quadriceps', 'Isquiotibiales': 'hamstrings', 'Glúteos': 'glutes',
        'Bíceps': 'biceps', 'Tríceps': 'triceps', 'Pantorrillas': 'calves',
        'Core': 'abs', 'Brazos': 'biceps', 'Piernas': 'quadriceps',
        'chest': 'chest', 'back': 'back', 'shoulders': 'shoulders',
        'quadriceps': 'quadriceps', 'quads': 'quadriceps', 'hamstrings': 'hamstrings',
        'glutes': 'glutes', 'biceps': 'biceps', 'triceps': 'triceps',
        'calves': 'calves', 'abs': 'abs'
    };

    function getHistory() {
        return JSON.parse(localStorage.getItem(SESSION_HISTORY_KEY) || '[]');
    }

    function getRoutine() {
        return JSON.parse(localStorage.getItem(ROUTINE_KEY) || 'null');
    }

    // ========== 1. PROGRESIÓN POR EJERCICIO ==========

    function getExerciseProgression() {
        const history = getHistory();
        if (history.length === 0) return {};

        const progression = {};

        // Recorrer del más antiguo al más reciente
        [...history].reverse().forEach(session => {
            if (!session.exercises) return;
            session.exercises.forEach(ex => {
                const name = ex.name;
                if (!progression[name]) {
                    progression[name] = {
                        entries: [],
                        muscleGroup: ex.muscleGroup || 'General'
                    };
                }
                progression[name].entries.push({
                    date: session.date,
                    weight: ex.weight,
                    reps: ex.reps,
                    rpe: ex.rpe,
                    rir: ex.rir,
                    volume: ex.volume || (ex.weight * ex.reps),
                    week: session.mesocycleWeek || 1
                });
            });
        });

        return progression;
    }

    // ========== 2. VOLUMEN REAL vs MEV/MRV ==========

    function getVolumeAnalysis() {
        const history = getHistory();
        const routine = getRoutine();
        if (!routine || !routine.days) return [];

        const muscleSetCount = {};

        // 1. Contar volumen PLANEADO de toda la rutina
        routine.days.forEach(day => {
            if (!day.exercises) return;
            day.exercises.forEach(ex => {
                const muscle = ex.muscleGroup || 'General';
                muscleSetCount[muscle] = (muscleSetCount[muscle] || 0) + (ex.sets || 3);
            });
        });

        // 2. Opcional: Podríamos restar lo completado si quisiéramos mostrar "restante",
        // pero la vista original mostraba el volumen REAL de 7 días.
        // Dado el feedback del usuario, mostraremos el volumen SEMANAL TOTAL PROGRAMADO
        // para que aparezcan todos los músculos que se tocan en el ciclo.

        const level = routine.level || 'intermediate';
        const analysis = [];

        Object.entries(muscleSetCount).forEach(([muscleName, plannedSets]) => {
            const muscleId = MUSCLE_MAP[muscleName] || 'chest';
            let landmarks = { MEV: 8, MAV: 14, MRV: 20 };

            if (typeof VolumeMEVMRVModule !== 'undefined') {
                const vData = VolumeMEVMRVModule.getVolumeLandmarks(muscleId, level);
                if (vData) {
                    landmarks = {
                        MEV: vData.MEV || 8,
                        MAV: vData.MAV?.high || vData.MAV || 14,
                        MRV: vData.MRV || 20
                    };
                }
            }

            let status, statusColor;
            if (plannedSets < landmarks.MEV) {
                status = 'Bajo MEV';
                statusColor = '#EF4444';
            } else if (plannedSets <= landmarks.MAV) {
                status = 'En MAV';
                statusColor = '#10B981';
            } else if (plannedSets <= landmarks.MRV) {
                status = 'Cerca MRV';
                statusColor = '#F59E0B';
            } else {
                status = 'Sobre MRV';
                statusColor = '#EF4444';
            }

            // Normalizar a que MAV sea el "100%" visual ideal, 
            // pero que cambie de color según si llega a MRV
            let pnv = (plannedSets / landmarks.MAV) * 100;
            if (pnv > 150) pnv = 150; // cap visual

            analysis.push({
                muscle: muscleName,
                actualSets: plannedSets, // ahora es plannedSets 
                mev: landmarks.MEV,
                mav: landmarks.MAV,
                mrv: landmarks.MRV,
                status,
                statusColor,
                percent: Math.round(pnv)
            });
        });

        return analysis.sort((a, b) => b.actualSets - a.actualSets);
    }

    // ========== 3. DETECCIÓN DE ESTANCAMIENTO ==========

    function detectPlateaus() {
        const progression = getExerciseProgression();
        const plateaus = [];

        Object.entries(progression).forEach(([exerciseName, data]) => {
            const entries = data.entries;
            if (entries.length < 3) return;

            // Revisar las últimas 3 entradas
            const last3 = entries.slice(-3);
            const sameWeight = last3.every(e => e.weight === last3[0].weight);
            const sameReps = last3.every(e => e.reps === last3[0].reps);

            if (sameWeight && sameReps && last3[0].weight > 0) {
                plateaus.push({
                    exercise: exerciseName,
                    weight: last3[0].weight,
                    reps: last3[0].reps,
                    sessions: entries.length,
                    muscleGroup: data.muscleGroup
                });
            }
        });

        return plateaus;
    }

    // ========== 4. 1RM ESTIMADO ==========

    function calculate1RM(weight, reps) {
        if (reps <= 0 || weight <= 0) return 0;
        if (reps === 1) return weight;
        // Fórmula Epley
        return Math.round(weight * (1 + reps / 30));
    }

    function getEstimated1RMs() {
        const progression = getExerciseProgression();
        const estimates = [];

        Object.entries(progression).forEach(([exerciseName, data]) => {
            const entries = data.entries;
            if (entries.length === 0) return;

            // Calcular 1RM de la última y primera entrada
            const latest = entries[entries.length - 1];
            const first = entries[0];
            const current1RM = calculate1RM(latest.weight, latest.reps);
            const initial1RM = calculate1RM(first.weight, first.reps);
            const change = current1RM - initial1RM;

            if (current1RM > 0) {
                estimates.push({
                    exercise: exerciseName,
                    current1RM,
                    initial1RM,
                    change,
                    changePercent: initial1RM > 0 ? Math.round((change / initial1RM) * 100) : 0,
                    latestWeight: latest.weight,
                    latestReps: latest.reps,
                    muscleGroup: data.muscleGroup,
                    totalSessions: entries.length
                });
            }
        });

        return estimates.sort((a, b) => b.current1RM - a.current1RM);
    }

    // ========== 5. COMPARACIÓN ENTRE SEMANAS ==========

    function getWeekComparison() {
        const history = getHistory();
        if (history.length === 0) return null;

        const weeks = {};
        history.forEach(session => {
            const w = session.mesocycleWeek || 1;
            if (!weeks[w]) {
                weeks[w] = {
                    sessions: 0,
                    totalVolume: 0,
                    totalSets: 0,
                    rpeSum: 0,
                    rpeCount: 0,
                    rirSum: 0,
                    rirCount: 0
                };
            }
            weeks[w].sessions++;
            weeks[w].totalVolume += session.stats?.totalVolume || 0;
            weeks[w].totalSets += session.stats?.totalSets || 0;
            const avgRPE = parseFloat(session.stats?.avgRPE);
            if (!isNaN(avgRPE)) { weeks[w].rpeSum += avgRPE; weeks[w].rpeCount++; }
            const avgRIR = parseFloat(session.stats?.avgRIR);
            if (!isNaN(avgRIR)) { weeks[w].rirSum += avgRIR; weeks[w].rirCount++; }
        });

        const result = {};
        Object.entries(weeks).forEach(([w, data]) => {
            result[w] = {
                sessions: data.sessions,
                totalVolume: data.totalVolume,
                totalSets: data.totalSets,
                avgRPE: data.rpeCount > 0 ? (data.rpeSum / data.rpeCount).toFixed(1) : '-',
                avgRIR: data.rirCount > 0 ? (data.rirSum / data.rirCount).toFixed(1) : '-',
                avgVolumePerSession: data.sessions > 0 ? Math.round(data.totalVolume / data.sessions) : 0
            };
        });

        return result;
    }

    // ========== RENDER PRINCIPAL ==========

    function renderAll() {
        const history = getHistory();
        if (history.length === 0) {
            hideAllSections();
            return;
        }

        renderDashboardExecutive();
        renderCoachInteligente();
        renderRIRComparison();
        renderWeightTracking();
        renderVolumeAnalysis();
        renderPlateaus();
        render1RMEstimates();
        renderWeekComparison();
        
        // --- Enforce Tabs Layout ---
        // Al terminar de renderizar todo (lo cual pone display: block), forzamos
        // la vista de pestañas para que solo quede visible la pestaña activa.
        if (typeof window.switchFeedbackTab === 'function') {
            const activeBtn = document.querySelector('.feedback-tab-btn.active');
            if (activeBtn) {
                // Get the section ID from the onclick attribute
                const match = activeBtn.getAttribute('onclick').match(/'([^']+)'/);
                if (match && match[1]) {
                    window.switchFeedbackTab(match[1]);
                }
            } else {
                // Fallback to the first one
                window.switchFeedbackTab('dashboard-executive-section');
            }
        }
    }

    function hideAllSections() {
        ['volume-analysis-section',
            'plateau-alerts-section', 'estimated-1rm-section',
            'week-comparison-section', 'dashboard-executive-section',
            'coach-inteligente-section', 'rir-comparison-section', 'weight-tracking-section'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
    }


    // ----- 2. Volumen real vs MEV/MRV -----
    function renderVolumeAnalysis() {
        const container = document.getElementById('volume-analysis-section');
        if (!container) return;

        const analysis = getVolumeAnalysis();
        if (analysis.length === 0) { container.style.display = 'none'; return; }
        container.style.display = 'block';

        const content = document.getElementById('volume-analysis-content');
        if (!content) return;

        let html = '';
        analysis.forEach(item => {
            const barWidth = Math.min(100, item.percent);
            html +=
                '<div style="margin-bottom:8px;">' +
                '<div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:2px;">' +
                '<span style="font-weight:600; color:#E0E0E0;">' + item.muscle + '</span>' +
                '<span style="color:' + item.statusColor + '; font-weight:600;">' + item.actualSets + ' sets · ' + item.status + '</span>' +
                '</div>' +
                '<div style="position:relative; height:14px; background:rgba(255,255,255,0.05); border-radius:7px; overflow:hidden;">' +
                // Barra de volumen actual
                '<div style="height:100%; width:' + barWidth + '%; background:' + item.statusColor + '; border-radius:7px; opacity:0.7;"></div>' +
                // Marcador MEV
                '<div style="position:absolute; top:0; bottom:0; left:' + Math.round((item.mev / item.mrv) * 100) + '%; width:1px; background:#3B82F6;" title="MEV ' + item.mev + '"></div>' +
                // Marcador MAV
                '<div style="position:absolute; top:0; bottom:0; left:' + Math.round((item.mav / item.mrv) * 100) + '%; width:1px; background:#F59E0B;" title="MAV ' + item.mav + '"></div>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between; font-size:0.6rem; color:var(--text-muted); margin-top:1px;">' +
                '<span>MEV ' + item.mev + '</span>' +
                '<span>MAV ' + item.mav + '</span>' +
                '<span>MRV ' + item.mrv + '</span>' +
                '</div>' +
                '</div>';
        });

        content.innerHTML = html;
    }

    // ----- 3. Alertas de estancamiento -----
    function renderPlateaus() {
        const container = document.getElementById('plateau-alerts-section');
        if (!container) return;

        const plateaus = detectPlateaus();
        if (plateaus.length === 0) { container.style.display = 'none'; return; }
        container.style.display = 'block';

        const content = document.getElementById('plateau-alerts-content');
        if (!content) return;

        let html = '';
        plateaus.forEach(p => {
            html +=
                '<div style="display:flex; align-items:center; gap:8px; padding:6px 8px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:6px; margin-bottom:6px;">' +
                '<span style="font-size:1.1rem;">⚠️</span>' +
                '<div style="flex:1;">' +
                '<div style="font-size:0.8rem; font-weight:600; color:#EF4444;">' + p.exercise + '</div>' +
                '<div style="font-size:0.7rem; color:var(--text-muted);">Mismo peso (' + p.weight + 'kg × ' + p.reps + ' reps) en las últimas 3 sesiones</div>' +
                '</div>' +
                '<div style="font-size:0.65rem; color:var(--text-muted); text-align:right;">' +
                '<div>Sugerencia:</div>' +
                '<div style="color:#F59E0B;">Cambiar variante o añadir reps</div>' +
                '</div>' +
                '</div>';
        });

        content.innerHTML = html;
    }

    // ----- 4. 1RM Estimado -----
    function render1RMEstimates() {
        const container = document.getElementById('estimated-1rm-section');
        if (!container) return;

        const estimates = getEstimated1RMs();
        if (estimates.length === 0) { container.style.display = 'none'; return; }
        container.style.display = 'block';

        const content = document.getElementById('estimated-1rm-content');
        if (!content) return;

        // Top ejercicios (máximo 8)
        const top = estimates.slice(0, 8);
        let html = '<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px;">';

        top.forEach(est => {
            const changeColor = est.change > 0 ? '#10B981' : est.change < 0 ? '#EF4444' : 'var(--text-muted)';
            const changeText = est.change !== 0 && est.totalSessions > 1
                ? '<span style="color:' + changeColor + '; font-size:0.65rem;">' + (est.change > 0 ? '+' : '') + est.change + 'kg (' + (est.changePercent > 0 ? '+' : '') + est.changePercent + '%)</span>'
                : '';

            html +=
                '<div style="padding:6px 8px; background:rgba(255,255,255,0.04); border-radius:6px;">' +
                '<div style="font-size:0.7rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + est.exercise + '</div>' +
                '<div style="display:flex; align-items:baseline; gap:4px;">' +
                '<span style="font-size:1rem; font-weight:700; color:#8B5CF6;">' + est.current1RM + 'kg</span>' +
                changeText +
                '</div>' +
                '<div style="font-size:0.6rem; color:var(--text-muted);">Base: ' + est.latestWeight + 'kg × ' + est.latestReps + ' reps</div>' +
                '</div>';
        });

        html += '</div>';
        content.innerHTML = html;
    }

    // ----- 5. Comparación entre semanas -----
    function renderWeekComparison() {
        const container = document.getElementById('week-comparison-section');
        if (!container) return;

        const comparison = getWeekComparison();
        if (!comparison || Object.keys(comparison).length < 2) { container.style.display = 'none'; return; }
        container.style.display = 'block';

        const content = document.getElementById('week-comparison-content');
        if (!content) return;

        const PHASE_NAMES = { 1: 'Acumulación', 2: 'Progresión', 3: 'Intensificación', 4: 'Peak', 5: 'Deload' };
        const PHASE_COLORS = { 1: '#3B82F6', 2: '#F59E0B', 3: '#EF4444', 4: '#DC2626', 5: '#10B981' };

        let html = '<table class="data-table" style="font-size:0.78rem;"><tr>' +
            '<th>Sem</th><th>Fase</th><th>Sesiones</th><th>Vol. Total</th><th>Vol/Sesión</th><th>RPE</th><th>RIR</th></tr>';

        const weeks = Object.keys(comparison).sort((a, b) => a - b);
        let prevVolPerSession = 0;

        weeks.forEach(w => {
            const data = comparison[w];
            const phase = PHASE_NAMES[w] || 'S' + w;
            const color = PHASE_COLORS[w] || '#E0E0E0';
            const volTrend = prevVolPerSession > 0 && data.avgVolumePerSession > prevVolPerSession ? '↑' : prevVolPerSession > 0 && data.avgVolumePerSession < prevVolPerSession ? '↓' : '';
            prevVolPerSession = data.avgVolumePerSession;

            html += '<tr>' +
                '<td style="font-weight:600;">S' + w + '</td>' +
                '<td><span style="color:' + color + '; font-weight:600;">' + phase + '</span></td>' +
                '<td>' + data.sessions + '</td>' +
                '<td style="font-weight:600;">' + data.totalVolume.toLocaleString() + ' kg</td>' +
                '<td>' + data.avgVolumePerSession.toLocaleString() + ' kg ' + (volTrend ? '<span style="color:' + (volTrend === '↑' ? '#10B981' : '#EF4444') + ';">' + volTrend + '</span>' : '') + '</td>' +
                '<td>' + data.avgRPE + '</td>' +
                '<td>' + data.avgRIR + '</td>' +
                '</tr>';
        });

        html += '</table>';
        content.innerHTML = html;
    }

    // ========== PUNTO 3: DASHBOARD RESUMEN EJECUTIVO ==========

    function renderDashboardExecutive() {
        const container = document.getElementById('dashboard-executive-section');
        if (!container) return;

        const history = getHistory();
        if (history.length === 0) { container.style.display = 'none'; return; }
        container.style.display = 'block';

        const content = document.getElementById('dashboard-executive-content');
        if (!content) return;

        // Datos del calendario
        let mesoPct = 0, completedSessions = 0, totalPlanned = 20, currentWeek = 1, currentPhase = 'Acumulación', phaseColor = '#3B82F6';
        try {
            const calData = typeof CalendarioTracker !== 'undefined' ? CalendarioTracker.getCalendarData() : null;
            if (calData) {
                mesoPct = calData.summary.compliancePercent;
                completedSessions = calData.summary.totalCompleted;
                totalPlanned = calData.summary.totalPlanned;
                const today = new Date().toISOString().split('T')[0];
                for (let w = 1; w <= 5; w++) {
                    const dates = calData.weeks[w].plannedDays.map(d => d.plannedDate);
                    if (dates.length > 0) {
                        const weekEnd = new Date(dates[0]);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                        if (today >= dates[0] && today <= weekEnd.toISOString().split('T')[0]) {
                            currentWeek = w;
                            currentPhase = calData.weeks[w].name;
                            phaseColor = calData.weeks[w].color;
                            break;
                        }
                    }
                }
            }
        } catch (e) { }

        // Cambio de fuerza promedio (1RM)
        const estimates = getEstimated1RMs();
        let avgStrengthChange = 0;
        const withChange = estimates.filter(e => e.totalSessions > 1 && e.change !== 0);
        if (withChange.length > 0) {
            avgStrengthChange = Math.round(withChange.reduce((sum, e) => sum + e.changePercent, 0) / withChange.length);
        }

        // Volumen análisis resumen
        const volAnalysis = getVolumeAnalysis();
        const belowMEV = volAnalysis.filter(v => v.status === 'Bajo MEV');
        const inMAV = volAnalysis.filter(v => v.status === 'En MAV');
        const nearMRV = volAnalysis.filter(v => v.status === 'Cerca MRV' || v.status === 'Sobre MRV');

        // Plateaus
        const plateaus = detectPlateaus();

        // Peso corporal
        const weightHistory = JSON.parse(localStorage.getItem('rpCoach_weight_history') || '[]');
        let weightText = '';
        if (weightHistory.length >= 2) {
            const first = weightHistory[0].weight;
            const last = weightHistory[weightHistory.length - 1].weight;
            const diff = (last - first).toFixed(1);
            weightText = last + 'kg (' + (diff > 0 ? '+' : '') + diff + 'kg)';
        } else if (weightHistory.length === 1) {
            weightText = weightHistory[0].weight + 'kg';
        }

        // Construir resumen
        let html =
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">' +
            // Progreso mesociclo
            '<div style="padding:8px; background:rgba(139,92,246,0.08); border-radius:6px; text-align:center;">' +
            '<div style="font-size:0.65rem; color:var(--text-muted);">MESOCICLO</div>' +
            '<div style="font-size:1.2rem; font-weight:700; color:' + phaseColor + ';">S' + currentWeek + '/5</div>' +
            '<div style="font-size:0.65rem; color:var(--text-muted);">' + completedSessions + '/' + totalPlanned + ' sesiones (' + mesoPct + '%)</div>' +
            '</div>' +
            // Fuerza
            '<div style="padding:8px; background:rgba(16,185,129,0.08); border-radius:6px; text-align:center;">' +
            '<div style="font-size:0.65rem; color:var(--text-muted);">FUERZA PROMEDIO</div>' +
            '<div style="font-size:1.2rem; font-weight:700; color:' + (avgStrengthChange > 0 ? '#10B981' : avgStrengthChange < 0 ? '#EF4444' : '#F59E0B') + ';">' + (avgStrengthChange > 0 ? '+' : '') + avgStrengthChange + '%</div>' +
            '<div style="font-size:0.65rem; color:var(--text-muted);">cambio en 1RM estimado</div>' +
            '</div>' +
            '</div>';

        // Líneas de insight
        html += '<div style="font-size:0.78rem; line-height:1.6; color:#E0E0E0;">';

        // Fase actual
        html += '<div style="margin-bottom:4px;">Estás en <span style="color:' + phaseColor + '; font-weight:600;">Semana ' + currentWeek + ' — ' + currentPhase + '</span>.</div>';

        // Volumen
        if (volAnalysis.length > 0) {
            if (inMAV.length > 0) {
                html += '<div style="margin-bottom:4px;"><span style="color:#10B981;">✓</span> ' + inMAV.map(v => v.muscle).join(', ') + ' en zona MAV (volumen óptimo).</div>';
            }
            if (belowMEV.length > 0) {
                html += '<div style="margin-bottom:4px;"><span style="color:#EF4444;">!</span> ' + belowMEV.map(v => v.muscle).join(', ') + ' bajo MEV — necesitan más series para crecer.</div>';
            }
            if (nearMRV.length > 0) {
                html += '<div style="margin-bottom:4px;"><span style="color:#F59E0B;">⚡</span> ' + nearMRV.map(v => v.muscle).join(', ') + ' cerca del MRV — vigila la recuperación.</div>';
            }
        }

        // Plateaus
        if (plateaus.length > 0) {
            html += '<div style="margin-bottom:4px;"><span style="color:#EF4444;">⚠</span> Estancamiento en: ' + plateaus.map(p => p.exercise).join(', ') + '. Considera cambiar variante.</div>';
        }

        // Peso corporal
        if (weightText) {
            html += '<div style="margin-bottom:4px;">Peso corporal: <span style="font-weight:600;">' + weightText + '</span></div>';
        }

        html += '</div>';
        content.innerHTML = html;
    }

    // ========== COACH INTELIGENTE ==========

    function getCoachSuggestions() {
        const history = getHistory();
        const routine = getRoutine();
        if (history.length === 0 || !routine) return [];

        const currentWeek = routine.mesocycleWeek || 1;
        const RIR_MAP = { 1: 3, 2: 2, 3: 1, 4: 0, 5: 4 };
        const targetRIR = RIR_MAP[currentWeek] !== undefined ? RIR_MAP[currentWeek] : 2;
        // Obtener la última sesión por cada día de la rutina
        const progression = getExerciseProgression();
        const plateaus = detectPlateaus();
        const plateauNames = new Set(plateaus.map(p => p.exercise));

        const suggestions = [];

        // Para cada ejercicio con historial
        Object.entries(progression).forEach(([exerciseName, data]) => {
            const entries = data.entries;
            if (entries.length === 0) return;

            const latest = entries[entries.length - 1];
            const realRIR = latest.rir !== undefined ? latest.rir : (10 - (latest.rpe || 8));
            const isPlateaued = plateauNames.has(exerciseName);

            let action, nextWeight, nextReps, priority, color, icon;

            if (isPlateaued) {
                // Estancamiento detectado
                action = 'Cambiar variante o técnica de intensificación';
                nextWeight = latest.weight;
                nextReps = latest.reps;
                priority = 'alta';
                color = '#EF4444';
                icon = '⚠';
            } else if (realRIR > targetRIR + 1) {
                // Muy fácil → subir peso
                const increment = latest.weight >= 40 ? 2.5 : 1.25;
                nextWeight = latest.weight + increment;
                nextReps = latest.reps;
                action = 'Subir peso a ' + nextWeight + 'kg';
                priority = 'media';
                color = '#10B981';
                icon = '↑';
            } else if (realRIR >= targetRIR && realRIR <= targetRIR + 1) {
                // En objetivo → mantener peso, buscar +1 rep o subir mínimo
                if (latest.reps < 12) {
                    nextWeight = latest.weight;
                    nextReps = latest.reps + 1;
                    action = 'Mantener ' + nextWeight + 'kg, buscar ' + nextReps + ' reps';
                    priority = 'baja';
                    color = '#10B981';
                    icon = '→';
                } else {
                    // Ya tiene muchas reps, subir peso y bajar reps
                    const increment = latest.weight >= 40 ? 2.5 : 1.25;
                    nextWeight = latest.weight + increment;
                    nextReps = Math.max(8, latest.reps - 2);
                    action = 'Subir a ' + nextWeight + 'kg × ' + nextReps + '-' + (nextReps + 2) + ' reps';
                    priority = 'media';
                    color = '#10B981';
                    icon = '↑';
                }
            } else if (realRIR < targetRIR - 0.5) {
                // Muy pesado → mantener o reducir ligeramente
                nextWeight = latest.weight;
                nextReps = latest.reps;
                action = 'Mantener peso, mejorar técnica';
                priority = 'baja';
                color = '#F59E0B';
                icon = '⏸';
                if (realRIR <= 0) {
                    action = 'Reducir ligeramente o mantener reps';
                    color = '#EF4444';
                    icon = '⚡';
                }
            } else {
                // Default: mantener progresión
                nextWeight = latest.weight;
                nextReps = latest.reps;
                action = 'Mantener progresión actual';
                priority = 'baja';
                color = '#8B5CF6';
                icon = '✓';
            }

            suggestions.push({
                exercise: exerciseName,
                muscleGroup: data.muscleGroup,
                lastWeight: latest.weight,
                lastReps: latest.reps,
                lastRIR: realRIR,
                lastRPE: latest.rpe || (10 - realRIR),
                targetRIR: targetRIR,
                nextWeight: nextWeight,
                nextReps: nextReps,
                action: action,
                priority: priority,
                color: color,
                icon: icon,
                isPlateaued: isPlateaued,
                sessions: entries.length,
                estimated1RM: calculate1RM(latest.weight, latest.reps),
                entries: entries,
                firstWeight: entries[0].weight
            });
        });

        // Ordenar: plateaus primero, luego por prioridad
        const priorityOrder = { alta: 0, media: 1, baja: 2 };
        suggestions.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

        return suggestions;
    }

    function renderCoachInteligente() {
        const container = document.getElementById('coach-inteligente-section');
        if (!container) return;

        const suggestions = getCoachSuggestions();
        if (suggestions.length === 0) { container.style.display = 'none'; return; }
        container.style.display = 'block';

        const content = document.getElementById('coach-inteligente-content');
        if (!content) return;

        const routine = getRoutine();
        const currentWeek = routine?.mesocycleWeek || 1;
        const PHASE_NAMES = { 1: 'Acumulación', 2: 'Progresión', 3: 'Intensificación', 4: 'Peak', 5: 'Deload' };

        // Resumen rápido
        const subirPeso = suggestions.filter(s => s.icon === '↑').length;
        const mantener = suggestions.filter(s => s.icon === '→' || s.icon === '✓').length;
        const alertas = suggestions.filter(s => s.isPlateaued || s.icon === '⚡').length;

        let html = '<div style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap;">';
        if (subirPeso > 0) html += '<span style="padding:3px 10px; background:rgba(16,185,129,0.12); border-radius:12px; font-size:0.72rem; color:#10B981; font-weight:600;">↑ ' + subirPeso + ' subir peso</span>';
        if (mantener > 0) html += '<span style="padding:3px 10px; background:rgba(139,92,246,0.12); border-radius:12px; font-size:0.72rem; color:#8B5CF6; font-weight:600;">→ ' + mantener + ' mantener</span>';
        if (alertas > 0) html += '<span style="padding:3px 10px; background:rgba(239,68,68,0.12); border-radius:12px; font-size:0.72rem; color:#EF4444; font-weight:600;">⚠ ' + alertas + ' alerta(s)</span>';
        html += '</div>';

        // === FILTRO Y AGRUPACIÓN POR GRUPO MUSCULAR ===
        // Obtener músculos activos de la rutina
        const activeMuscles = new Set();
        if (routine && routine.days) {
            routine.days.forEach(d => {
                if(d.exercises) {
                    d.exercises.forEach(ex => activeMuscles.add(ex.muscleGroup || 'General'));
                }
            });
        }
        
        // Filtrar sugerencias (solo músculos en la rutina actual) si hay una rutina
        const filteredSuggestions = activeMuscles.size > 0 
            ? suggestions.filter(s => activeMuscles.has(s.muscleGroup || 'General'))
            : suggestions;

        if (filteredSuggestions.length === 0) {
            html += '<div class="text-muted" style="font-size:0.8rem; padding:10px;">No hay sugerencias para los músculos de tu rutina actual. Registra entrenamientos para ver inteligencia aquí.</div>';
            content.innerHTML = html;
            return;
        }

        // Agrupar (Asegurando que todos los músculos activos tengan su pestaña)
        const grouped = {};
        if (activeMuscles.size > 0) {
            activeMuscles.forEach(mg => grouped[mg] = []);
        }
        filteredSuggestions.forEach(s => {
            const mg = s.muscleGroup || 'General';
            if(!grouped[mg]) grouped[mg] = [];
            grouped[mg].push(s);
        });

        // ======================= VIEW MODE TOGGLE =======================
        window.coachInteligenteViewMode = window.coachInteligenteViewMode || 'tabs';
        if (!window.toggleCoachViewMode) {
            window.toggleCoachViewMode = function(mode) {
                window.coachInteligenteViewMode = mode;
                // Re-render
                const container = document.getElementById('coach-inteligente-content');
                if (container) renderCoachInteligente();
            };
        }
        const isTabs = window.coachInteligenteViewMode === 'tabs';
        
        html += '<div style="display:flex; justify-content:flex-end; gap:6px; margin-bottom:12px;">';
        html += '<button onclick="window.toggleCoachViewMode(\'list\')" style="padding:4px 10px; font-size:0.75rem; border-radius:6px; border:1px solid ' + (!isTabs ? '#10B981' : 'rgba(255,255,255,0.1)') + '; background:' + (!isTabs ? 'rgba(16,185,129,0.15)' : 'transparent') + '; color:' + (!isTabs ? '#10B981' : 'var(--text-muted)') + '; cursor:pointer; font-weight:600; transition:all 0.2s;">📜 Lista</button>';
        html += '<button onclick="window.toggleCoachViewMode(\'tabs\')" style="padding:4px 10px; font-size:0.75rem; border-radius:6px; border:1px solid ' + (isTabs ? '#10B981' : 'rgba(255,255,255,0.1)') + '; background:' + (isTabs ? 'rgba(16,185,129,0.15)' : 'transparent') + '; color:' + (isTabs ? '#10B981' : 'var(--text-muted)') + '; cursor:pointer; font-weight:600; transition:all 0.2s;">🏷️ Pestañas</button>';
        html += '</div>';

        const mgKeys = Object.keys(grouped).sort();

        if (isTabs) {
            // Render Tab Buttons for Muscle Groups
            html += '<div style="display:flex; gap:6px; overflow-x:auto; margin-bottom:12px; padding-bottom:6px; scrollbar-width: none;">';
            mgKeys.forEach((mg, index) => {
                const bg = index === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)';
                const color = index === 0 ? '#10B981' : 'var(--text-muted)';
                const border = index === 0 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)';
                html += '<button class="muscle-mg-btn" onclick="window.switchCoachMuscleTab(this, \'' + mg.replace(/\s+/g, '-') + '\')" style="background:' + bg + '; color:' + color + '; border:1px solid ' + border + '; padding:6px 12px; border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; white-space:nowrap; transition:all 0.2s;">💪 ' + mg.toUpperCase() + '</button>';
            });
            html += '</div>';

            // JS para cambiar tabs internamente
            if (!window.switchCoachMuscleTab) {
                window.switchCoachMuscleTab = function(btn, mgID) {
                    const container = btn.parentElement;
                    container.querySelectorAll('.muscle-mg-btn').forEach(b => {
                        b.style.background = 'rgba(255,255,255,0.05)';
                        b.style.color = 'var(--text-muted)';
                        b.style.borderColor = 'rgba(255,255,255,0.1)';
                    });
                    btn.style.background = 'rgba(16,185,129,0.15)';
                    btn.style.color = '#10B981';
                    btn.style.borderColor = 'rgba(16,185,129,0.4)';
                    
                    document.querySelectorAll('.coach-mg-content').forEach(c => c.style.setProperty('display', 'none', 'important'));
                    const target = document.getElementById('coach-mg-' + mgID);
                    if(target) target.style.setProperty('display', 'block', 'important');
                };
            }
        }

        // Generar HTML agrupado
        mgKeys.forEach((mg, index) => {
            const mgID = mg.replace(/\s+/g, '-');
            
            // Si es Pestañas, abrimos un contenedor con ID
            if (isTabs) {
                const display = index === 0 ? 'block' : 'none';
                html += '<div id="coach-mg-' + mgID + '" class="coach-mg-content" style="display:' + display + ';">';
            } else {
                // Si es Lista, mostramos un encabezado visible en scroll
                html += '<div style="background:rgba(16,185,129,0.08); border-left:3px solid #10B981; padding:6px 12px; font-weight:700; color:#10B981; border-radius:0 6px 6px 0; margin: 16px 0 6px 0; display:flex; align-items:center; gap:8px;">';
                html += '<span style="font-size:1.1rem;">💪</span> <span style="text-transform:uppercase; letter-spacing:0.5px; font-size:0.85rem;">' + mg + '</span>';
                html += '</div>';
            }

            if (grouped[mg].length === 0) {
                html += '<div style="font-size:0.75rem; color:var(--text-muted); padding:20px 12px; text-align:center; font-style:italic; border-bottom:1px solid rgba(255,255,255,0.05);">';
                html += 'Aún no hay datos analizados para <strong>' + mg + '</strong>.<br>Completa más entrenamientos de este músculo para desbloquear las sugerencias inteligentes.';
                html += '</div>';
            } else {
                grouped[mg].forEach(s => {
                    const rirDiff = s.lastRIR - s.targetRIR;
                const rirLabel = rirDiff > 0.5 ? 'Fácil' : rirDiff < -0.5 ? 'Difícil' : 'Objetivo';
                const rirBadgeColor = rirDiff > 0.5 ? '#10B981' : rirDiff < -0.5 ? '#EF4444' : '#8B5CF6';

                // Gráfica Sparkline y delta histórico
                let historyHtml = '';
                if (s.sessions >= 2) {
                    const weightChange = s.lastWeight - s.firstWeight;
                    const changeColor = weightChange > 0 ? '#10B981' : weightChange < 0 ? '#EF4444' : 'var(--text-muted)';
                    const arrow = weightChange > 0 ? '↑' : weightChange < 0 ? '↓' : '';

                    const maxWeight = Math.max(...s.entries.map(e => e.weight));
                    const bars = s.entries.slice(-8).map(e => {
                        const h = maxWeight > 0 ? Math.max(4, (e.weight / maxWeight) * 16) : 4;
                        return '<div style="flex:1; max-width:8px; height:' + h + 'px; background:#8B5CF6; border-radius:2px; opacity:0.7;"></div>';
                    }).join('');

                    historyHtml =
                        '<div style="display:flex; align-items:flex-end; gap:6px; margin-top:4px;">' +
                        '<div style="display:flex; align-items:flex-end; gap:1px; height:18px;">' + bars + '</div>' +
                        '<span style="font-size:0.65rem; color:' + changeColor + '; font-weight:600;">' + arrow + ' ' + (weightChange > 0 ? '+' : '') + weightChange + 'kg (desde el inicio)</span>' +
                        '</div>';
                }

                html +=
                    '<div style="display:flex; align-items:flex-start; gap:8px; padding:10px 8px; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                    // Icono de acción
                    '<div style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border-radius:6px; font-size:0.9rem; flex-shrink:0; margin-top:2px;">' + s.icon + '</div>' +

                    // Info Central (Historial + Estado actual)
                    '<div style="flex:1; min-width:0;">' +
                    '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:2px;">' +
                    '<span style="font-size:0.85rem; font-weight:600; color:#E0E0E0;">' + s.exercise + '</span>' +
                    '<span style="font-size:0.6rem; padding:1px 6px; border-radius:8px; background:' + rirBadgeColor + '22; color:' + rirBadgeColor + ';">' + rirLabel + '</span>' +
                '</div>' +
                '<div style="font-size:0.7rem; color:var(--text-muted);">' +
                'Última: <strong>' + s.lastWeight + 'kg × ' + s.lastReps + ' reps</strong> (RIR ' + (typeof s.lastRIR === 'number' ? s.lastRIR.toFixed(1) : s.lastRIR) + ')' +
                '</div>' +
                historyHtml +
                '</div>' +

                // Recomendación (Futuro)
                '<div style="text-align:right; flex-shrink:0; width:130px; background:rgba(0,0,0,0.2); padding:6px; border-radius:6px; border-left: 2px solid ' + s.color + ';">' +
                '<div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:4px; font-weight:600; letter-spacing:0.5px;">PRÓXIMA SESIÓN</div>' +
                '<div style="font-size:0.75rem; font-weight:700; color:' + s.color + '; line-height:1.2;">' + s.action + '</div>' +
                (s.nextWeight !== s.lastWeight || s.nextReps !== s.lastReps ?
                    '<div style="font-size:0.7rem; color:#E0E0E0; margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.1);">🎯 ' + s.nextWeight + 'kg × ' + s.nextReps + ' reps</div>' : '') +
                '</div>' +
                '</div>';
                }); // Cierra forEach(s)
            } // Cierra el else (length > 0)

            if (isTabs) {
                html += '</div>'; // Cierra el contenedor del tab
            }
        }); // Cierra forEach(mgKeys)

        // Nota informativa al final
        html += '<div style="margin-top:8px; padding:6px 10px; background:rgba(255,255,255,0.03); border-radius:6px; font-size:0.68rem; color:var(--text-muted); line-height:1.4;">' +
            'Reglas: Si RIR real > objetivo+1 → sube peso | Si RIR en objetivo → busca +1 rep | Si RIR < objetivo → mantén | Semana actual: S' + currentWeek + ' (' + (PHASE_NAMES[currentWeek] || '-') + ')' +
            '</div>';

        content.innerHTML = html;
    }

    // ========== PUNTO 2: RIR REAL VS PLANEADO ==========

    function getRIRComparisonData() {
        const history = getHistory();
        if (history.length === 0) return [];

        const RIR_MAP = { 1: 3, 2: 2, 3: 1, 4: 0, 5: 4 };
        const comparison = [];

        history.forEach(session => {
            const targetRIR = session.targetRIR !== undefined ? session.targetRIR : (RIR_MAP[session.mesocycleWeek] || 2);
            const realRIR = parseFloat(session.stats?.avgRIR);
            if (isNaN(realRIR)) return;

            comparison.push({
                date: session.date,
                dayName: session.dayName,
                week: session.mesocycleWeek || 1,
                targetRIR: targetRIR,
                realRIR: realRIR,
                diff: realRIR - targetRIR,
                avgRPE: session.stats?.avgRPE || '-'
            });
        });

        return comparison.reverse(); // cronológico
    }

    function renderRIRComparison() {
        const container = document.getElementById('rir-comparison-section');
        if (!container) return;

        const data = getRIRComparisonData();
        if (data.length === 0) { container.style.display = 'none'; return; }
        container.style.display = 'block';

        const content = document.getElementById('rir-comparison-content');
        if (!content) return;

        // Agrupar por semana
        const byWeek = {};
        data.forEach(d => {
            if (!byWeek[d.week]) byWeek[d.week] = [];
            byWeek[d.week].push(d);
        });

        const PHASE_NAMES = { 1: 'Acumulación', 2: 'Progresión', 3: 'Intensificación', 4: 'Peak', 5: 'Deload' };
        const PHASE_COLORS = { 1: '#3B82F6', 2: '#F59E0B', 3: '#EF4444', 4: '#DC2626', 5: '#10B981' };

        let html = '<table class="data-table" style="font-size:0.78rem;"><tr>' +
            '<th>Sem</th><th>Fase</th><th>RIR Objetivo</th><th>RIR Real</th><th>Diferencia</th><th>Interpretación</th></tr>';

        Object.keys(byWeek).sort().forEach(w => {
            const sessions = byWeek[w];
            const targetRIR = sessions[0].targetRIR;
            const avgRealRIR = (sessions.reduce((s, d) => s + d.realRIR, 0) / sessions.length).toFixed(1);
            const diff = (parseFloat(avgRealRIR) - targetRIR).toFixed(1);
            const diffNum = parseFloat(diff);

            let interpretation, interpColor;
            if (Math.abs(diffNum) <= 0.5) {
                interpretation = '✓ En objetivo';
                interpColor = '#10B981';
            } else if (diffNum > 0.5) {
                interpretation = 'Muy conservador';
                interpColor = '#F59E0B';
            } else {
                interpretation = 'Más intenso de lo planeado';
                interpColor = '#EF4444';
            }

            html += '<tr>' +
                '<td style="font-weight:600;">S' + w + '</td>' +
                '<td><span style="color:' + (PHASE_COLORS[w] || '#E0E0E0') + '; font-weight:600;">' + (PHASE_NAMES[w] || '-') + '</span></td>' +
                '<td style="text-align:center; font-weight:600;">' + targetRIR + '</td>' +
                '<td style="text-align:center; font-weight:700; color:#8B5CF6;">' + avgRealRIR + '</td>' +
                '<td style="text-align:center; color:' + interpColor + '; font-weight:600;">' + (diffNum > 0 ? '+' : '') + diff + '</td>' +
                '<td style="color:' + interpColor + '; font-size:0.72rem;">' + interpretation + '</td>' +
                '</tr>';
        });

        html += '</table>';
        content.innerHTML = html;
    }

    // ========== PUNTO 4: TRACKING DE PESO CORPORAL ==========

    function renderWeightTracking() {
        const container = document.getElementById('weight-tracking-section');
        if (!container) return;
        container.style.display = 'block';

        const content = document.getElementById('weight-tracking-content');
        if (!content) return;

        const weightHistory = JSON.parse(localStorage.getItem('rpCoach_weight_history') || '[]');
        const profile = JSON.parse(localStorage.getItem('rpCoach_profile') || '{}');

        // Input para registrar peso
        const today = new Date().toISOString().split('T')[0];
        const todayEntry = weightHistory.find(e => e.date === today);

        let html =
            '<div style="display:flex; gap:8px; align-items:flex-end; margin-bottom:10px;">' +
            '<div style="flex:1;">' +
            '<label style="font-size:0.7rem; color:var(--text-muted);">Peso hoy (kg)</label>' +
            '<input type="number" id="weight-today-input" step="0.1" value="' + (todayEntry ? todayEntry.weight : (profile.weight || '')) + '" ' +
            'style="width:100%; padding:6px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); border-radius:4px; color:white; font-size:0.9rem;" placeholder="ej: 82.5">' +
            '</div>' +
            '<button id="btn-save-weight" style="padding:6px 16px; background:#8B5CF6; color:white; border:none; border-radius:4px; font-size:0.8rem; font-weight:600; cursor:pointer;">Guardar</button>' +
            '</div>';

        // Historial visual
        if (weightHistory.length > 0) {
            const first = weightHistory[0];
            const last = weightHistory[weightHistory.length - 1];
            const diff = (last.weight - first.weight).toFixed(1);
            const diffColor = diff > 0 ? '#10B981' : diff < 0 ? '#EF4444' : '#F59E0B';
            const maxW = Math.max(...weightHistory.map(e => e.weight));
            const minW = Math.min(...weightHistory.map(e => e.weight));
            const range = maxW - minW || 1;

            html += '<div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:6px;">' +
                '<span style="color:var(--text-muted);">Inicio: <strong>' + first.weight + 'kg</strong> (' + first.date + ')</span>' +
                '<span style="color:' + diffColor + '; font-weight:600;">' + (diff > 0 ? '+' : '') + diff + 'kg</span>' +
                '<span style="color:var(--text-muted);">Actual: <strong>' + last.weight + 'kg</strong></span>' +
                '</div>';

            // Gráfica de línea simple con barras
            const entries = weightHistory.slice(-14); // últimas 14 entradas
            html += '<div style="display:flex; align-items:flex-end; gap:3px; height:50px; margin-bottom:4px;">';
            entries.forEach(e => {
                const h = Math.max(6, ((e.weight - minW) / range) * 44);
                const isToday = e.date === today;
                html += '<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:1px;">' +
                    '<div style="font-size:0.55rem; color:var(--text-muted);">' + e.weight + '</div>' +
                    '<div style="width:100%; max-width:20px; height:' + h + 'px; background:' + (isToday ? '#8B5CF6' : 'rgba(139,92,246,0.4)') + '; border-radius:3px;"></div>' +
                    '</div>';
            });
            html += '</div>';

            // Estadísticas rápidas
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const lastWeekEntries = weightHistory.filter(e => new Date(e.date) >= weekAgo);
            const weekAvg = lastWeekEntries.length > 0 ? (lastWeekEntries.reduce((s, e) => s + e.weight, 0) / lastWeekEntries.length).toFixed(1) : '-';

            html += '<div style="display:flex; gap:12px; font-size:0.7rem; color:var(--text-muted); margin-top:4px;">' +
                '<span>Prom. 7d: <strong style="color:#E0E0E0;">' + weekAvg + 'kg</strong></span>' +
                '<span>Min: <strong style="color:#E0E0E0;">' + minW + 'kg</strong></span>' +
                '<span>Max: <strong style="color:#E0E0E0;">' + maxW + 'kg</strong></span>' +
                '<span>Registros: <strong style="color:#E0E0E0;">' + weightHistory.length + '</strong></span>' +
                '</div>';
        } else {
            html += '<p style="font-size:0.75rem; color:var(--text-muted);">Registra tu peso para ver la tendencia a lo largo del mesociclo.</p>';
        }

        content.innerHTML = html;

        // Listener para guardar peso
        const btnSave = document.getElementById('btn-save-weight');
        if (btnSave) {
            btnSave.addEventListener('click', function () {
                const input = document.getElementById('weight-today-input');
                const weight = parseFloat(input?.value);
                if (!weight || weight < 30 || weight > 300) return;

                const history = JSON.parse(localStorage.getItem('rpCoach_weight_history') || '[]');
                const todayStr = new Date().toISOString().split('T')[0];
                const idx = history.findIndex(e => e.date === todayStr);
                if (idx >= 0) {
                    history[idx].weight = weight;
                } else {
                    history.push({ date: todayStr, weight: weight });
                }
                history.sort((a, b) => a.date.localeCompare(b.date));
                if (history.length > 60) history.splice(0, history.length - 60);
                localStorage.setItem('rpCoach_weight_history', JSON.stringify(history));

                // Actualizar perfil también
                const profile = JSON.parse(localStorage.getItem('rpCoach_profile') || '{}');
                profile.weight = weight;
                localStorage.setItem('rpCoach_profile', JSON.stringify(profile));

                renderWeightTracking();
                renderDashboardExecutive();
                this.textContent = '✓ Guardado';
                setTimeout(() => { this.textContent = 'Guardar'; }, 1500);
            });
        }
    }

    // API pública
    return {
        renderAll,
        getExerciseProgression,
        getVolumeAnalysis,
        detectPlateaus,
        getEstimated1RMs,
        getWeekComparison,
        getRIRComparisonData,
        getCoachSuggestions,
        renderCoachInteligente,
        renderWeightTracking,
        calculate1RM
    };
})();
