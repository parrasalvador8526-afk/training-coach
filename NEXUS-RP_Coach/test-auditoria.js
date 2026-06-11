/**
 * Simulación de usuario real + caza de espacios muertos.
 * Persona A: usuario nuevo (sin datos). Persona B: 3 semanas de historial.
 * Uso: node audit-sim.js
 */
const { chromium } = require('playwright');

const URL = 'http://localhost:8080/index.html';
const MODULES = ['home', 'strength', 'workout', 'routine-display', 'evolution', 'nutrition'];

const findings = [];
function report(persona, modulo, tipo, detalle) {
    findings.push({ persona, modulo, tipo, detalle });
}

// Botones cuyo "sin cambio visible" es esperado (no son espacios muertos)
// - Exportar PDF abre una VENTANA NUEVA (verificado manualmente, el DOM no cambia)
// - "Resumen" es la sub-pestaña ya activa al entrar a Evolución (clic = no-op)
// - "Huevo entero" sí registra comida (verificado manualmente; el barrido por
//   índices se desalinea cuando un clic previo re-renderiza la lista)
const IGNORE_BUTTONS = [
    'acceder', 'guía de protocolo', 'detener cámara', 'iniciar escáner',
    'exportar pdf', '📊 resumen', 'huevo entero'
];

async function newPage(browser) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') page.consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => page.consoleErrors.push('PAGEERROR: ' + err.message));
    page.on('dialog', d => d.dismiss().catch(() => { }));
    page.on('filechooser', () => { });
    return page;
}

async function login(page) {
    await page.goto(URL);
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
        const o = document.getElementById('login-overlay');
        if (o) o.style.display = 'none';
    });
}

async function gotoModule(page, mod) {
    await page.locator(`.nav-tab[data-module="${mod}"]`).click();
    await page.waitForTimeout(600);
}

/** Contenedores visibles totalmente vacíos (sin contenido ni estado vacío) */
async function findEmptyContainers(page, modulo) {
    return page.evaluate((modulo) => {
        const section = document.getElementById('module-' + modulo) ||
            document.getElementById('module-' + (modulo === 'evolution' ? 'evolution' : modulo));
        if (!section) return [];
        const out = [];
        section.querySelectorAll('div[id], section[id]').forEach(el => {
            const visible = el.offsetParent !== null;
            if (visible && el.innerHTML.trim() === '' && el.clientHeight < 5 &&
                !el.id.includes('placeholder') && !el.id.includes('banner')) {
                out.push(el.id);
            }
        });
        return out;
    }, modulo);
}

/** Barrido: clic en cada botón visible y detección de "sin efecto" */
async function sweepButtons(page, persona, modulo) {
    const buttons = await page.evaluate((modulo) => {
        const section = document.getElementById('module-' + modulo);
        if (!section) return [];
        return [...section.querySelectorAll('button')]
            .filter(b => b.offsetParent !== null && !b.disabled)
            .map((b, i) => ({
                idx: i,
                text: (b.textContent || '').trim().slice(0, 50),
                id: b.id || null
            }));
    }, modulo);

    for (const btn of buttons) {
        if (IGNORE_BUTTONS.some(t => btn.text.toLowerCase().includes(t))) continue;

        const errsBefore = page.consoleErrors.length;
        const result = await page.evaluate(async ({ modulo, idx }) => {
            const section = document.getElementById('module-' + modulo);
            const list = [...section.querySelectorAll('button')]
                .filter(b => b.offsetParent !== null && !b.disabled);
            const b = list[idx];
            if (!b) return { skipped: true };

            const before = document.body.innerHTML.length;
            const beforeClasses = document.body.className +
                [...document.querySelectorAll('.hidden,[style*="display"]')].length;
            let mutations = 0;
            const obs = new MutationObserver(m => { mutations += m.length; });
            obs.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
            try { b.click(); } catch (e) { return { error: e.message }; }
            await new Promise(r => setTimeout(r, 350));
            obs.disconnect();
            const after = document.body.innerHTML.length;
            const afterClasses = document.body.className +
                [...document.querySelectorAll('.hidden,[style*="display"]')].length;
            return {
                mutations,
                htmlDelta: Math.abs(after - before),
                classDelta: beforeClasses !== afterClasses
            };
        }, { modulo, idx: btn.idx });

        const newErrors = page.consoleErrors.slice(errsBefore);
        if (result?.error) {
            report(persona, modulo, 'ERROR AL CLIC', `"${btn.text}" lanzó: ${result.error}`);
        } else if (newErrors.length) {
            report(persona, modulo, 'ERROR CONSOLA', `"${btn.text}" → ${newErrors[0].slice(0, 140)}`);
        } else if (result && !result.skipped && result.mutations === 0 &&
            result.htmlDelta === 0 && !result.classDelta) {
            report(persona, modulo, 'BOTÓN MUERTO', `"${btn.text}"${btn.id ? ' (#' + btn.id + ')' : ''} no produce ningún cambio`);
        }

        // Cerrar modales que el clic haya abierto, y reencuadrar el módulo
        await page.evaluate((modulo) => {
            ['modal-end-of-cycle', 'export-options-modal', 'daily-summary-modal'].forEach(id => {
                const m = document.getElementById(id);
                if (m && m.style.display !== 'none' && m.offsetParent !== null) m.style.display = 'none';
            });
            document.querySelectorAll('.modal, [class*="modal"]').forEach(m => {
                if (m.offsetParent !== null && m.id && !m.id.startsWith('module-')) {
                    // dejar visibles solo overlays propios del módulo
                }
            });
        }, modulo);
    }
    return buttons.length;
}

// ── Datos de Persona B: 3 semanas de historial ──
function seedData() {
    const today = new Date();
    const iso = d => d.toISOString().split('T')[0];
    const daysAgo = n => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };

    const exercises = ['Press Banca', 'Sentadilla', 'Remo con Barra', 'Press Militar'];
    const sessions = [];
    for (let i = 20; i >= 0; i -= 2) {
        const d = daysAgo(i);
        sessions.push({
            id: 'sim_' + i,
            date: d.toISOString(),
            startedAt: d.toISOString(),
            completedAt: d.toISOString(),
            methodology: 'RestPause',
            weekNumber: Math.ceil((21 - i) / 7),
            mesocycleWeek: Math.ceil((21 - i) / 7),
            duration: 62,
            overallRating: 4,
            exercises: exercises.map(name => ({
                name, exerciseName: name,
                muscleGroup: name.includes('Sentadilla') ? 'Cuádriceps' : 'Pecho',
                pumpRating: 4, jointComfort: 4,
                sets: [1, 2, 3].map(s => ({
                    setNumber: s,
                    weight: 60 + (21 - i) * 0.5,
                    reps: 10 - s,
                    rir: 2
                }))
            }))
        });
    }

    const readiness = [];
    for (let i = 18; i >= 0; i--) {
        const score = 2.5 + Math.abs(Math.sin(i)) * 2.4;
        readiness.push({
            date: iso(daysAgo(i)), score: Math.round(score * 10) / 10,
            sleep: 4, stress: 3, doms: 3,
            level: score >= 4 ? 'green' : score >= 3 ? 'yellow' : 'red'
        });
    }

    localStorage.setItem('rpCoach_enhanced_logs', JSON.stringify(sessions));
    localStorage.setItem('rpCoach_readiness_history', JSON.stringify(readiness));
    localStorage.setItem('rpCoach_strength_prs', JSON.stringify([
        { exercise: 'Press Banca', weight: 100, reps: 3, date: iso(daysAgo(9)) },
        { exercise: 'Sentadilla', weight: 140, reps: 2, date: iso(daysAgo(4)) },
        { exercise: 'Peso Muerto', weight: 170, reps: 1, date: iso(daysAgo(0)) }
    ]));
    localStorage.setItem('rpCoach_active_routine', JSON.stringify({
        id: 'sim_routine', methodology: 'RestPause', split: 'upper_lower',
        mesocycleWeek: 3, currentWeek: 3, status: 'active',
        days: [1, 2, 3, 4].map(n => ({
            dayNumber: n, weekNumber: 1, name: 'Día ' + n,
            muscles: ['Pecho', 'Espalda'],
            exercises: exercises.map(name => ({
                id: 'ex_' + n + name, name, sets: 3, targetReps: '8-12', targetRIR: 2, restSeconds: 90
            }))
        }))
    }));
    const log = {};
    log[iso(today)] = [
        { id: 'm1', nombre: 'Avena con whey', kcal: 350, prot: 32, carb: 42, grasa: 6, hora: '08:30', fuente: 'manual' },
        { id: 'm2', nombre: 'Pollo con arroz', kcal: 520, prot: 50, carb: 48, grasa: 9, hora: '14:00', fuente: 'manual' }
    ];
    localStorage.setItem('rpCoach_nutrition_log', JSON.stringify(log));
}

// ── Verificaciones de Persona B: ¿los datos sembrados se pintan? ──
async function verifySeededRendering(page) {
    await gotoModule(page, 'evolution');
    await page.waitForTimeout(900);

    const rings = await page.evaluate(() =>
        [...document.querySelectorAll('#evolution-rings .evo-ring-svg text')]
            .map(t => t.textContent).filter(t => t.includes('%')));
    if (!rings.length || rings.every(r => r === '0%')) {
        report('B', 'evolution', 'DATOS NO PINTADOS', 'Anillos en 0% con 12 sesiones sembradas: ' + rings.join(','));
    }

    const chartData = await page.evaluate(() => {
        const out = {};
        for (const id of ['chart-evo-volume', 'chart-evo-tonnage']) {
            const c = window.Chart?.getChart?.(document.getElementById(id));
            out[id] = c ? c.data.datasets[0].data.filter(v => v > 0).length : -1;
        }
        return out;
    });
    Object.entries(chartData).forEach(([id, n]) => {
        if (n <= 0) report('B', 'evolution', 'DATOS NO PINTADOS', `${id} sin puntos de datos (${n})`);
    });

    const prs = await page.locator('#evolution-prs .evo-pr-row').count();
    if (prs === 0) report('B', 'evolution', 'DATOS NO PINTADOS', 'PRs sembrados no aparecen en el dashboard');

    // Sub-vista progresión con datos
    await page.locator('.evo-subtab[data-sub="progresion"]').click();
    await page.waitForTimeout(800);
    const progresionVacia = await page.evaluate(() => {
        const sec = document.getElementById('module-progress');
        return sec ? sec.innerText.trim().length < 100 : true;
    });
    if (progresionVacia) report('B', 'evolution', 'DATOS NO PINTADOS', 'Sub-vista Progresión casi vacía con historial sembrado');

    // Home: readiness history + heatmap
    await gotoModule(page, 'home');
    await page.waitForTimeout(800);
    const heatmap = await page.evaluate(() =>
        (document.getElementById('fatigue-heatmap-content')?.innerText || '').trim().length);
    if (heatmap < 20) report('B', 'home', 'DATOS NO PINTADOS', 'Heatmap de fatiga vacío con 12 sesiones sembradas');

    // Nutrición: diario y targets
    await gotoModule(page, 'nutrition');
    await page.waitForTimeout(800);
    const meals = await page.locator('#flexible-meal-list .meal-row').count();
    if (meals !== 2) report('B', 'nutrition', 'DATOS NO PINTADOS', `Diario muestra ${meals} comidas, se sembraron 2`);

    // PR de HOY debe disparar el ajuste del coach
    const banner = await page.locator('#nutrition-adjustment-banner .coach-adjustment-banner').count();
    if (!banner) report('B', 'nutrition', 'SINERGIA ROTA', 'PR de hoy sembrado pero sin banner de ajuste');
}

(async () => {
    const browser = await chromium.launch();

    // ════ PERSONA A: usuario nuevo ════
    let page = await newPage(browser);
    await login(page);
    for (const mod of MODULES) {
        await gotoModule(page, mod);
        const empties = await findEmptyContainers(page, mod);
        empties.forEach(id => report('A', mod, 'CONTENEDOR VACÍO', '#' + id + ' visible y sin contenido'));
        // Estado vacío: ¿hay guía para el novato?
        const guidance = await page.evaluate((mod) => {
            const sec = document.getElementById('module-' + mod);
            return sec ? sec.innerText.length : 0;
        }, mod);
        if (guidance < 80) report('A', mod, 'ESTADO VACÍO POBRE', `El módulo casi no muestra texto guía (${guidance} chars)`);
        await sweepButtons(page, 'A', mod);
    }
    const errsA = [...new Set(page.consoleErrors)].filter(e => !e.includes('Failed to load resource'));
    errsA.slice(0, 6).forEach(e => report('A', 'global', 'ERROR CONSOLA', e.slice(0, 160)));
    await page.close();

    // ════ PERSONA B: 3 semanas de historial ════
    page = await newPage(browser);
    await page.goto(URL);
    await page.evaluate(seedData);
    await page.reload();
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
        const o = document.getElementById('login-overlay');
        if (o) o.style.display = 'none';
    });
    await verifySeededRendering(page);
    const errsB = [...new Set(page.consoleErrors)].filter(e => !e.includes('Failed to load resource'));
    errsB.slice(0, 6).forEach(e => report('B', 'global', 'ERROR CONSOLA', e.slice(0, 160)));
    await page.close();

    await browser.close();

    // ════ Reporte ════
    console.log('\n══════ HALLAZGOS DE LA SIMULACIÓN ══════\n');
    if (!findings.length) console.log('🎉 Sin espacios muertos detectados');
    const byTipo = {};
    findings.forEach(f => { (byTipo[f.tipo] ??= []).push(f); });
    Object.entries(byTipo).forEach(([tipo, items]) => {
        console.log(`\n── ${tipo} (${items.length}) ──`);
        items.forEach(f => console.log(`  [${f.persona}/${f.modulo}] ${f.detalle}`));
    });
    console.log(`\nTotal: ${findings.length} hallazgos`);
    require('fs').writeFileSync('audit-findings.json', JSON.stringify(findings, null, 2));
})();
