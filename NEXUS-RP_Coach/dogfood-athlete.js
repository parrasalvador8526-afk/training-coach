/**
 * Dogfooding: un atleta usa la app POR LA UI (sin sembrar localStorage).
 * Registra cada paso y cada fricción encontrada.
 * Uso: node dogfood-athlete.js  (requiere servidor en :8080)
 */
const { chromium } = require('playwright');

const pasos = [];
const fricciones = [];
const ok = (p, extra = '') => pasos.push(`✅ ${p}${extra ? ' — ' + extra : ''}`);
const friccion = (sev, p) => fricciones.push(`[${sev}] ${p}`);

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
    page.on('dialog', d => d.accept().catch(() => { }));
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('http://localhost:8080/index.html');
    await page.waitForTimeout(1500);

    // ── 1. Llegar: bienvenida ──
    if (await page.locator('#welcome-name').isVisible()) {
        await page.fill('#welcome-name', 'Salvador Atleta');
        await page.click('#login-form button[type="submit"]');
        await page.waitForTimeout(700);
        ok('Bienvenida: nombre guardado y entrada a la app');
    } else {
        friccion('ALTA', 'La pantalla de bienvenida no apareció en visita nueva');
    }

    const saludo = await page.locator('#home-greeting-name').textContent();
    if (saludo?.includes('Salvador')) ok('Home saluda por nombre', saludo);
    else friccion('MEDIA', 'El saludo del Home no usa el nombre recién dado: ' + saludo);

    // ── 2. Onboarding: seguir paso 1 (perfil) ──
    const onboardingVisible = await page.locator('#onboarding-checklist .onboarding-step').count();
    if (onboardingVisible === 3) ok('Onboarding visible con 3 pasos');
    else friccion('ALTA', `Onboarding muestra ${onboardingVisible} pasos (esperaba 3)`);

    await page.locator('.onboarding-step__btn').first().click();
    await page.waitForTimeout(600);
    const enPerfil = await page.locator('#module-profile:not(.hidden)').count();
    if (enPerfil) ok('Onboarding paso 1 lleva al Perfil');
    else friccion('ALTA', 'El botón "Ir" del paso 1 no llevó al perfil');

    // ── 3. Perfil: llenar y guardar ──
    await page.fill('#profile-name', 'Salvador Atleta');
    await page.fill('#profile-weight', '82');
    await page.fill('#profile-height', '175');
    await page.fill('#profile-age', '32');
    const genderSel = page.locator('#profile-gender');
    if (await genderSel.count()) await genderSel.selectOption({ index: 0 });
    await page.click('#btn-save-profile');
    await page.waitForTimeout(800);
    const profileSaved = await page.evaluate(() => {
        const p = JSON.parse(localStorage.getItem('rpCoach_profile') || '{}');
        return p.weight === 82 && p.height === 175;
    });
    if (profileSaved) ok('Perfil guardado (82kg/175cm/32a)');
    else friccion('ALTA', 'El perfil no se guardó al presionar Guardar');

    // ¿La app me regresa al flujo o me deja varado en Perfil?
    const seQuedaEnPerfil = await page.locator('#module-profile:not(.hidden)').count();
    if (seQuedaEnPerfil) {
        friccion('MEDIA', 'Tras guardar el perfil me quedo varado ahí: nada me lleva de vuelta al onboarding/siguiente paso');
    }

    // ── 4. Generar rutina con el wizard ──
    await page.locator('.nav-tab[data-module="workout"]').click();
    await page.waitForTimeout(900);
    const methSel = page.locator('#routine-methodology');
    if (await methSel.count()) {
        const opciones = await methSel.locator('option').count();
        if (opciones > 1) ok('Wizard: metodologías cargadas', opciones + ' opciones');
        else friccion('ALTA', 'Wizard sin metodologías en el selector');
        await methSel.selectOption({ index: 1 });
        await page.waitForTimeout(400);
        const splitSel = page.locator('#routine-split');
        if (await splitSel.count()) await splitSel.selectOption({ index: 1 }).catch(() => { });
        await page.waitForTimeout(300);
        await page.click('#btn-generate-routine');
        await page.waitForTimeout(1500);
        const rutinaOk = await page.evaluate(() => !!localStorage.getItem('rpCoach_active_routine'));
        if (rutinaOk) ok('Rutina generada y guardada');
        else friccion('ALTA', 'btn-generate-routine no produjo rutina activa');
    } else {
        friccion('ALTA', 'No encontré el wizard (#routine-methodology) en ENTRENAMIENTO');
    }

    // ── 5. Readiness del día ──
    await page.locator('.nav-tab[data-module="home"]').click();
    await page.waitForTimeout(700);
    await page.selectOption('#readiness-sleep', '4').catch(() => friccion('MEDIA', 'No pude setear sueño en readiness'));
    await page.selectOption('#readiness-stress', '4').catch(() => { });
    await page.selectOption('#readiness-doms', '3').catch(() => { });
    await page.click('#btn-eval-readiness');
    await page.waitForTimeout(600);
    const badge = await page.locator('#readiness-score-badge').textContent();
    if (badge && !badge.includes('PENDIENTE')) ok('Readiness evaluado', badge.trim());
    else friccion('ALTA', 'Evaluar readiness no actualizó el semáforo');

    const onboardingRestante = await page.locator('#onboarding-checklist .onboarding-step__btn').count();
    if (onboardingRestante === 0) ok('Onboarding completado: la guía desapareció sola');
    else friccion('BAJA', `Onboarding aún muestra ${onboardingRestante} pendientes tras completar todo`);

    // ── 6. Entrenar: registrar sets en la tabla del día ──
    await page.locator('.nav-tab[data-module="workout"]').click();
    await page.waitForTimeout(900);
    let logInputs = await page.locator('.log-input.log-weight').count();
    if (!logInputs) {
        // ¿la tabla vive en otra pestaña? probar FEEDBACK (routine-display)
        await page.locator('.nav-tab[data-module="routine-display"]').click();
        await page.waitForTimeout(900);
        logInputs = await page.locator('.log-input.log-weight').count();
        if (logInputs) friccion('MEDIA', 'La tabla para registrar pesos está en FEEDBACK, no en ENTRENAMIENTO: como atleta la busqué primero donde generé la rutina');
    }
    if (logInputs) {
        ok('Tabla de registro encontrada', logInputs + ' inputs de peso');
        const n = await page.evaluate(() => {
            const set = (el, v) => {
                el.value = v;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            };
            const ws = [...document.querySelectorAll('.log-input.log-weight')];
            const rs = [...document.querySelectorAll('.log-input.log-reps')];
            const n = Math.min(6, ws.length);
            for (let i = 0; i < n; i++) {
                set(ws[i], String(60 + i * 2));
                if (rs[i]) set(rs[i], String(10 - (i % 3)));
            }
            return n;
        });
        ok(`Registré ${n} sets (peso y reps)`);
        await page.click('#btn-finish-session');
        await page.waitForTimeout(1500);
        const sesiones = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]').length);
        if (sesiones >= 1) ok('Sesión guardada en historial', sesiones + ' sesión(es)');
        else friccion('ALTA', 'CALCULAR Y GUARDAR SESIÓN no guardó nada en rpCoach_session_history');
        const proxima = await page.locator('#next-session-container:not(.hidden)').count();
        if (proxima) ok('Apareció la tabla de Próxima Sesión con objetivos');
        else friccion('BAJA', 'No vi objetivos de próxima sesión tras guardar');
    } else {
        friccion('ALTA', 'No existe NINGUNA tabla visible para registrar pesos/reps tras generar rutina');
    }

    // ── 7. Comer: plan flexible + tiendas ──
    await page.locator('.nav-tab[data-module="nutrition"]').click();
    await page.waitForTimeout(900);
    const kcalAntes = await page.evaluate(() => window.NutritionFlexible?.getConsumidoHoy().kcal ?? -1);
    const quick = page.locator('.quick-food-btn').first();
    if (await quick.count()) {
        await quick.click();
        await page.waitForTimeout(500);
        const kcalDespues = await page.evaluate(() => window.NutritionFlexible.getConsumidoHoy().kcal);
        if (kcalDespues > kcalAntes) ok('Desayuno registrado con 1 tap', `${kcalAntes} → ${kcalDespues} kcal`);
        else friccion('ALTA', 'El registro rápido no sumó la comida');
    } else friccion('ALTA', 'No hay botones de registro rápido en nutrición');

    await page.locator('.nutri-subtab[data-sub="tiendas"]').click();
    await page.waitForTimeout(500);
    await page.evaluate(() => window.NutritionStores?.setCountry('MX'));
    await page.waitForTimeout(500);
    const tienda = page.locator('#stores-list .store-chip').first();
    if (await tienda.count()) {
        await tienda.click();
        await page.waitForTimeout(500);
        const sug = await page.locator('#store-suggestions .store-suggestion').count();
        if (sug) ok('Tienda elegida y sugerencias por macros', sug + ' productos');
        else friccion('MEDIA', 'La tienda no dio sugerencias con macros pendientes');
    }

    // ── 8. Revisar progreso en Evolución ──
    await page.locator('.nav-tab[data-module="evolution"]').click();
    await page.waitForTimeout(1200);
    const anillos = await page.evaluate(() =>
        [...document.querySelectorAll('#evolution-rings .evo-ring-svg text')]
            .map(t => t.textContent).filter(t => t.includes('%')));
    const adherencia = anillos[0] || '0%';
    if (adherencia !== '0%') ok('Mi sesión de HOY ya cuenta en el anillo de adherencia', anillos.join(' / '));
    else friccion('ALTA', 'Entrené hoy pero el anillo de adherencia sigue en 0%: ' + anillos.join('/'));
    const tonelaje = await page.evaluate(() => {
        const c = window.Chart?.getChart?.(document.getElementById('chart-evo-tonnage'));
        return c ? c.data.datasets[0].data.filter(v => v > 0).length : -1;
    });
    if (tonelaje > 0) ok('La gráfica de tonelaje muestra mi sesión');
    else friccion('ALTA', 'La gráfica de tonelaje no refleja la sesión de hoy');

    await page.screenshot({ path: 'dogfood-final.png' });
    await browser.close();

    console.log('═══ RECORRIDO DEL ATLETA ═══');
    pasos.forEach(p => console.log(p));
    console.log('\n═══ FRICCIONES ═══');
    if (!fricciones.length) console.log('🎉 Ninguna');
    fricciones.forEach(f => console.log(f));
    if (errors.length) console.log('\n═══ ERRORES JS ═══\n' + [...new Set(errors)].slice(0, 5).join('\n'));
})();
