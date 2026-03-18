/**
 * StrengthTests — Módulo de Tests de Fuerza
 * Registro de PRs, Test guiado de 1RM, Visualización de fuerza actual
 */
const StrengthTests = (function () {
    'use strict';

    const STORAGE_KEY = 'rpCoach_strength_prs';

    const DEFAULT_EXERCISES = [
        'Press Banca', 'Press Banca Inclinado', 'Sentadilla', 'Peso Muerto',
        'Peso Muerto Rumano', 'Press Militar', 'Remo con Barra',
        'Dominadas', 'Hip Thrust', 'Fondos en Paralelas'
    ];

    // ── Helpers ──

    function calcE1RM(weight, reps) {
        if (reps <= 0 || weight <= 0) return 0;
        if (reps === 1) return weight;
        return Math.round(weight * (1 + reps / 30) * 10) / 10;
    }

    function loadPRs() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    }

    function savePRs(prs) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prs));
    }

    function getExerciseList() {
        const set = new Set(DEFAULT_EXERCISES);
        try {
            const routine = JSON.parse(localStorage.getItem('rpCoach_active_routine') || 'null');
            if (routine && routine.days) {
                routine.days.forEach(d => {
                    (d.exercises || []).forEach(e => { if (e.name) set.add(e.name); });
                });
            }
        } catch { }
        try {
            const sessions = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]');
            sessions.forEach(s => {
                (s.exercises || []).forEach(e => { if (e.name) set.add(e.name); });
            });
        } catch { }
        return [...set].sort();
    }

    /**
     * Obtiene e1RMs de ProgressAnalytics (retorna array) y lo convierte a mapa {ejercicio: data}
     */
    function getEstimated1RMsMap() {
        if (typeof ProgressAnalytics !== 'undefined' && ProgressAnalytics.getEstimated1RMs) {
            const arr = ProgressAnalytics.getEstimated1RMs(); // [{exercise, current1RM, latestWeight, latestReps, change, changePercent, ...}]
            const map = {};
            if (Array.isArray(arr)) {
                arr.forEach(item => {
                    map[item.exercise] = {
                        e1rm: item.current1RM,
                        lastWeight: item.latestWeight,
                        lastReps: item.latestReps,
                        initial1RM: item.initial1RM,
                        change: item.change,
                        changePercent: item.changePercent,
                        totalSessions: item.totalSessions,
                        muscleGroup: item.muscleGroup
                    };
                });
            }
            return map;
        }
        return {};
    }

    function getBestPR(exercise) {
        const prs = loadPRs().filter(p => p.exercise === exercise);
        if (!prs.length) return null;
        return prs.reduce((best, p) => {
            const e1rm = calcE1RM(p.weight, p.reps);
            return e1rm > (best._e1rm || 0) ? { ...p, _e1rm: e1rm } : best;
        }, { _e1rm: 0 });
    }

    // ── Render principal ──

    function init() {
        const overviewSlot = document.getElementById('strength-overview-slot');
        const prsSlot = document.getElementById('strength-prs-slot');
        const testSlot = document.getElementById('strength-test-slot');

        if (overviewSlot) overviewSlot.innerHTML = renderOverviewCard();
        if (prsSlot) prsSlot.innerHTML = renderPRCard();
        if (testSlot) testSlot.innerHTML = renderTestCard();

        bindEvents();
        refreshPRList();
        refreshOverview();
    }

    // ── Card: Fuerza Actual (Visión General) ──

    function renderOverviewCard() {
        return `
        <div class="card" style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); margin-bottom:12px;">
            <h4 style="color:#10B981; margin-bottom:8px; font-size:0.95rem;">📊 Fuerza Actual — Visión General</h4>
            <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:10px;">
                Estimaciones basadas en tus sesiones de entrenamiento y PRs registrados.
            </p>
            <div id="strength-overview-table"></div>
        </div>`;
    }

    function refreshOverview() {
        const container = document.getElementById('strength-overview-table');
        if (!container) return;

        const estimated1RMs = getEstimated1RMsMap();
        const prs = loadPRs();

        const allExercises = new Set([
            ...Object.keys(estimated1RMs),
            ...prs.map(p => p.exercise)
        ]);

        if (!allExercises.size) {
            container.innerHTML = '<p style="font-size:0.75rem; color:var(--text-muted); text-align:center;">No hay datos de fuerza disponibles. Completa sesiones o registra PRs.</p>';
            return;
        }

        let html = `
        <div style="overflow-x:auto;">
            <table style="width:100%; font-size:0.73rem; border-collapse:collapse;">
                <thead>
                    <tr style="color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.15); font-size:0.68rem;">
                        <th style="text-align:left; padding:5px;">Ejercicio</th>
                        <th style="text-align:center; padding:5px;">Último Peso</th>
                        <th style="text-align:center; padding:5px;">
                            e1RM Estimado
                            <span title="e1RM = 1 Rep Máx ESTIMADO — calculado con la fórmula de Epley a partir de tus sets de entrenamiento. Tu PR Real puede diferir (en positivo o negativo) dependiendo de si has testeado al límite." style="display:inline-block; width:14px; height:14px; background:rgba(139,92,246,0.4); border-radius:50%; font-size:0.65rem; font-weight:700; color:#E0D7FF; cursor:help; line-height:14px; text-align:center; margin-left:4px; vertical-align:middle; border:1px solid rgba(139,92,246,0.6);">?</span>
                        </th>
                        <th style="text-align:center; padding:5px;">PR Real</th>
                        <th style="text-align:center; padding:5px;">Diferencia</th>
                        <th style="text-align:center; padding:5px;">Tendencia</th>
                    </tr>
                </thead>
                <tbody>`;

        [...allExercises].sort().forEach(exercise => {
            const estData = estimated1RMs[exercise];
            const exercisePRs = prs.filter(p => p.exercise === exercise);
            const bestPR = exercisePRs.length ? Math.max(...exercisePRs.map(p => calcE1RM(p.weight, p.reps))) : null;

            const lastWeight = estData ? `${estData.lastWeight}kg × ${estData.lastReps}` : '—';
            const e1rm = estData ? `${estData.e1rm}kg` : '—';
            const prDisplay = bestPR ? `${bestPR}kg` : '—';

            let diffDisplay = '—';
            let diffColor = 'var(--text-muted)';
            if (bestPR && estData) {
                const diff = bestPR - estData.e1rm;
                const pct = ((diff / estData.e1rm) * 100).toFixed(1);
                diffColor = diff >= 0 ? '#10B981' : '#EF4444';
                diffDisplay = `${diff >= 0 ? '+' : ''}${pct}%`;
            }

            // Tendencia: comparar e1RM inicial vs actual
            let trend = '—';
            if (estData && estData.totalSessions >= 2) {
                trend = estData.change > 0 ? '↑' : estData.change < 0 ? '↓' : '→';
            }
            const trendColor = trend === '↑' ? '#10B981' : trend === '↓' ? '#EF4444' : '#F59E0B';

            html += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:5px; font-weight:500;">${exercise}</td>
                    <td style="padding:5px; text-align:center;">${lastWeight}</td>
                    <td style="padding:5px; text-align:center; font-weight:600; color:#8B5CF6;">${e1rm}</td>
                    <td style="padding:5px; text-align:center; font-weight:600; color:#F59E0B;">${prDisplay}</td>
                    <td style="padding:5px; text-align:center; color:${diffColor}; font-weight:600;">${diffDisplay}</td>
                    <td style="padding:5px; text-align:center; font-size:1rem; color:${trendColor};">${trend}</td>
                </tr>`;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    // ── Card: Registro de PRs ──

    function renderPRCard() {
        const exercises = getExerciseList();
        const options = exercises.map(e => `<option value="${e}">${e}</option>`).join('');

        return `
        <div class="card" style="background:rgba(139,92,246,0.06); border:1px solid rgba(139,92,246,0.2); margin-bottom:12px;">
            <h4 style="color:#8B5CF6; margin-bottom:8px; font-size:0.95rem;">🏆 Registro de PRs (Récords Personales)</h4>
            <div style="display:grid; grid-template-columns:1fr 80px 60px 120px auto; gap:8px; align-items:end; margin-bottom:10px;">
                <div>
                    <label style="font-size:0.7rem; color:var(--text-muted);">Ejercicio</label>
                    <select id="pr-exercise" class="form-select" style="font-size:0.8rem;">${options}</select>
                </div>
                <div>
                    <label style="font-size:0.7rem; color:var(--text-muted);">Peso (kg)</label>
                    <input id="pr-weight" type="number" class="form-input" style="font-size:0.8rem;" min="1" step="0.5" placeholder="100">
                </div>
                <div>
                    <label style="font-size:0.7rem; color:var(--text-muted);">Reps</label>
                    <input id="pr-reps" type="number" class="form-input" style="font-size:0.8rem;" min="1" max="20" value="1" placeholder="1">
                </div>
                <div>
                    <label style="font-size:0.7rem; color:var(--text-muted);">Fecha</label>
                    <input id="pr-date" type="date" class="form-input" style="font-size:0.8rem;" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <button id="btn-save-pr" class="btn btn--primary btn--sm" style="height:36px; white-space:nowrap;">💾 Guardar PR</button>
            </div>
            <div id="pr-list-container"></div>
        </div>`;
    }

    function refreshPRList() {
        const container = document.getElementById('pr-list-container');
        if (!container) return;

        const prs = loadPRs();
        if (!prs.length) {
            container.innerHTML = '<p style="font-size:0.75rem; color:var(--text-muted); text-align:center;">No hay PRs registrados aún.</p>';
            return;
        }

        const grouped = {};
        prs.forEach(p => {
            if (!grouped[p.exercise]) grouped[p.exercise] = [];
            grouped[p.exercise].push(p);
        });

        const estimated1RMs = getEstimated1RMsMap();

        let html = '<div style="max-height:300px; overflow-y:auto;">';
        Object.keys(grouped).sort().forEach(exercise => {
            const records = grouped[exercise].sort((a, b) => new Date(b.date) - new Date(a.date));
            const bestE1RM = Math.max(...records.map(r => calcE1RM(r.weight, r.reps)));
            const estData = estimated1RMs[exercise];
            const est1RM = estData ? estData.e1rm : null;

            let comparison = '';
            if (est1RM) {
                const diff = bestE1RM - est1RM;
                const pct = ((diff / est1RM) * 100).toFixed(1);
                const color = diff >= 0 ? '#10B981' : '#EF4444';
                comparison = `<span style="color:${color}; font-size:0.7rem; margin-left:6px;">(${diff >= 0 ? '+' : ''}${pct}% vs e1RM)</span>`;
            }

            html += `<div style="margin-bottom:8px;">
                <div style="font-weight:600; font-size:0.8rem; color:var(--text-primary); margin-bottom:3px;">
                    ${exercise} — Mejor e1RM: ${bestE1RM}kg ${comparison}
                </div>`;

            records.forEach((r, idx) => {
                const e1rm = calcE1RM(r.weight, r.reps);
                html += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:var(--text-muted); padding:2px 8px; background:rgba(255,255,255,0.03); border-radius:4px; margin-bottom:2px;">
                    <span>${r.date} — ${r.weight}kg × ${r.reps}rep${r.reps > 1 ? 's' : ''} (e1RM: ${e1rm}kg)</span>
                    <button class="btn-delete-pr" data-exercise="${r.exercise}" data-idx="${idx}" style="background:none; border:none; color:#EF4444; cursor:pointer; font-size:0.7rem;">✕</button>
                </div>`;
            });
            html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.btn-delete-pr').forEach(btn => {
            btn.addEventListener('click', () => {
                const exercise = btn.dataset.exercise;
                const idx = parseInt(btn.dataset.idx);
                const allPRs = loadPRs();
                const exercisePRs = allPRs.filter(p => p.exercise === exercise)
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                const toDelete = exercisePRs[idx];
                if (toDelete) {
                    const globalIdx = allPRs.findIndex(p =>
                        p.exercise === toDelete.exercise && p.date === toDelete.date &&
                        p.weight === toDelete.weight && p.reps === toDelete.reps
                    );
                    if (globalIdx !== -1) {
                        allPRs.splice(globalIdx, 1);
                        savePRs(allPRs);
                        refreshPRList();
                        refreshOverview();
                    }
                }
            });
        });
    }

    // ── Card: Test Guiado de 1RM ──

    function renderTestCard() {
        const exercises = getExerciseList();
        const options = exercises.map(e => `<option value="${e}">${e}</option>`).join('');

        return `
        <div class="card" style="background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2); margin-bottom:12px;">
            <h4 style="color:#F59E0B; margin-bottom:8px; font-size:0.95rem;">🎯 Test Guiado de 1RM</h4>
            <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:10px;">
                Protocolo de calentamiento progresivo para testear tu 1RM real de forma segura.
            </p>
            <div style="display:grid; grid-template-columns:1fr 100px auto; gap:8px; align-items:end; margin-bottom:10px;">
                <div>
                    <label style="font-size:0.7rem; color:var(--text-muted);">Ejercicio</label>
                    <select id="test-exercise" class="form-select" style="font-size:0.8rem;">${options}</select>
                </div>
                <div>
                    <label style="font-size:0.7rem; color:var(--text-muted);">e1RM estimado (kg)</label>
                    <input id="test-e1rm" type="number" class="form-input" style="font-size:0.8rem;" min="10" step="0.5" placeholder="100">
                </div>
                <button id="btn-generate-protocol" class="btn btn--sm" style="height:36px; background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; white-space:nowrap;">⚡ Generar Protocolo</button>
            </div>
            <div id="test-protocol-container"></div>
        </div>`;
    }

    function generateTestProtocol(exercise, estimated1RM) {
        const container = document.getElementById('test-protocol-container');
        if (!container || !estimated1RM || estimated1RM <= 0) return;

        const e1rm = parseFloat(estimated1RM);
        const roundTo = (val, step) => Math.round(val / step) * step;

        const sets = [
            { pct: 40, reps: 10, rest: '1-2 min', label: 'Calentamiento general' },
            { pct: 60, reps: 5, rest: '2 min', label: 'Calentamiento específico' },
            { pct: 75, reps: 3, rest: '2-3 min', label: 'Activación' },
            { pct: 85, reps: 1, rest: '3-4 min', label: 'Preparación' },
            { pct: 95, reps: 1, rest: '4-5 min', label: 'Aproximación' },
            { pct: 100, reps: 1, rest: '5 min', label: '🎯 Intento 1RM' },
            { pct: 103, reps: 1, rest: '—', label: '🏆 Intento PR (+3%)' },
        ];

        let html = `
        <div style="background:rgba(0,0,0,0.15); border-radius:8px; padding:12px; margin-top:8px;">
            <h5 style="color:#F59E0B; font-size:0.85rem; margin-bottom:8px;">
                Protocolo de Test: ${exercise} (e1RM: ${e1rm}kg)
            </h5>
            <table style="width:100%; font-size:0.75rem; border-collapse:collapse;">
                <thead>
                    <tr style="color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.1);">
                        <th style="text-align:left; padding:4px;">Set</th>
                        <th style="text-align:center; padding:4px;">%</th>
                        <th style="text-align:center; padding:4px;">Peso (kg)</th>
                        <th style="text-align:center; padding:4px;">Reps</th>
                        <th style="text-align:center; padding:4px;">Descanso</th>
                        <th style="text-align:left; padding:4px;">Nota</th>
                    </tr>
                </thead>
                <tbody>`;

        sets.forEach((s, i) => {
            const weight = roundTo(e1rm * s.pct / 100, 2.5);
            const isAttempt = s.pct >= 100;
            const bg = isAttempt ? 'rgba(245,158,11,0.12)' : 'transparent';
            const fw = isAttempt ? '700' : '400';
            html += `
                <tr style="background:${bg}; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:5px; font-weight:${fw};">Set ${i + 1}</td>
                    <td style="padding:5px; text-align:center;">${s.pct}%</td>
                    <td style="padding:5px; text-align:center; font-weight:600; color:#F59E0B;">${weight}kg</td>
                    <td style="padding:5px; text-align:center;">× ${s.reps}</td>
                    <td style="padding:5px; text-align:center;">${s.rest}</td>
                    <td style="padding:5px; font-size:0.7rem;">${s.label}</td>
                </tr>`;
        });

        html += `</tbody></table>
            <div style="margin-top:10px; padding:8px; background:rgba(245,158,11,0.08); border-radius:6px; font-size:0.72rem; color:var(--text-muted);">
                <strong style="color:#F59E0B;">💡 Consejos:</strong>
                <ul style="margin:4px 0 0 16px; padding:0;">
                    <li>Respeta los descansos — la recuperación es clave para el 1RM real</li>
                    <li>Si el Set 5 (95%) se siente pesado, no intentes el PR (+3%)</li>
                    <li>Usa spotter o safety bars en Press Banca y Sentadilla</li>
                    <li>Si logras el 1RM, puedes registrarlo como PR arriba ↑</li>
                </ul>
            </div>
        </div>`;

        container.innerHTML = html;
    }

    // ── Event Binding ──

    function bindEvents() {
        const btnSave = document.getElementById('btn-save-pr');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const exercise = document.getElementById('pr-exercise').value;
                const weight = parseFloat(document.getElementById('pr-weight').value);
                const reps = parseInt(document.getElementById('pr-reps').value) || 1;
                const date = document.getElementById('pr-date').value;

                if (!exercise || !weight || weight <= 0) {
                    alert('Ingresa un ejercicio y peso válidos.');
                    return;
                }

                const allPRs = loadPRs();
                allPRs.push({ exercise, weight, reps, date: date || new Date().toISOString().split('T')[0] });
                savePRs(allPRs);

                document.getElementById('pr-weight').value = '';
                document.getElementById('pr-reps').value = '1';

                refreshPRList();
                refreshOverview();
            });
        }

        const btnProtocol = document.getElementById('btn-generate-protocol');
        if (btnProtocol) {
            btnProtocol.addEventListener('click', () => {
                const exercise = document.getElementById('test-exercise').value;
                const e1rm = parseFloat(document.getElementById('test-e1rm').value);
                if (!e1rm || e1rm <= 0) {
                    alert('Ingresa un e1RM estimado válido.');
                    return;
                }
                generateTestProtocol(exercise, e1rm);
            });
        }

        // Auto-poblar e1RM al cambiar ejercicio del test
        const testSelect = document.getElementById('test-exercise');
        if (testSelect) {
            const updateE1RM = () => {
                const exercise = testSelect.value;
                const estimated = getEstimated1RMsMap();
                const e1rmInput = document.getElementById('test-e1rm');
                if (estimated[exercise] && e1rmInput) {
                    e1rmInput.value = estimated[exercise].e1rm;
                } else {
                    const best = getBestPR(exercise);
                    if (best && e1rmInput) {
                        e1rmInput.value = best._e1rm;
                    }
                }
            };
            testSelect.addEventListener('change', updateE1RM);
            updateE1RM();
        }
    }

    return {
        init,
        loadPRs,
        savePRs,
        refreshPRList,
        refreshOverview
    };

})();
