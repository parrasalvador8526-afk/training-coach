/**
 * Verificación E2E del upgrade premium (Fases 1-3).
 * Uso: node test-premium.js [fase]   (sin argumento corre todo lo disponible)
 */
const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.join(__dirname, 'index.html');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message));

    const results = [];
    const check = (name, ok, extra = '') =>
        results.push(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);

    await page.goto(URL);
    await page.waitForTimeout(1500);

    // Saltar login overlay
    await page.evaluate(() => {
        const o = document.getElementById('login-overlay');
        if (o) o.style.display = 'none';
    });

    // ── FASE 1: Dashboard de Evolución ──
    const evoTab = page.locator('.nav-tab[data-module="evolution"]');
    check('F1: tab Evolución existe', await evoTab.count() === 1);
    check('F1: tabs viejos eliminados',
        await page.locator('.nav-tab[data-module="visual"], .nav-tab[data-module="progress"]').count() === 0);

    await evoTab.click();
    await page.waitForTimeout(800);
    check('F1: sección evolution visible',
        await page.locator('#module-evolution:not(.hidden)').count() === 1);
    check('F1: 3 anillos renderizados',
        await page.locator('#evolution-rings .evo-ring').count() === 3);
    check('F1: gráficas Chart.js creadas',
        await page.evaluate(() => !!window.Chart && document.getElementById('chart-evo-volume') !== null));

    // Sub-tab Métricas → muestra module-visual
    await page.locator('.evo-subtab[data-sub="metricas"]').click();
    await page.waitForTimeout(400);
    check('F1: sub-tab Métricas muestra module-visual',
        await page.locator('#module-visual:not(.hidden)').count() === 1 &&
        await page.locator('#evolution-resumen.hidden').count() === 1);

    // Sub-tab Progresión → muestra module-progress
    await page.locator('.evo-subtab[data-sub="progresion"]').click();
    await page.waitForTimeout(400);
    check('F1: sub-tab Progresión muestra module-progress',
        await page.locator('#module-progress:not(.hidden)').count() === 1);

    await page.locator('.evo-subtab[data-sub="resumen"]').click();

    // ── FASE 2: Coach Nutricional ──
    const hasNutriModules = await page.evaluate(() =>
        !!(window.NutritionFlexible && window.NutritionStores && window.BarcodeScannerRP));
    if (hasNutriModules) {
        await page.locator('.nav-tab[data-module="nutrition"]').click();
        await page.waitForTimeout(800);

        check('F2: sub-tabs de nutrición presentes',
            await page.locator('.nutri-subtab').count() === 4);
        check('F2: barras de macros renderizadas',
            await page.locator('#nutri-sub-flexible .macro-bar').count() === 4);

        // Registrar comida manual y verificar que la barra cambia
        const before = await page.evaluate(() => window.NutritionFlexible.getConsumidoHoy().kcal);
        await page.evaluate(() => window.NutritionFlexible.addFood({
            nombre: 'Test Pollo', kcal: 220, prot: 40, carb: 0, grasa: 5, gramos: 150, fuente: 'test'
        }));
        await page.waitForTimeout(500);
        const after = await page.evaluate(() => window.NutritionFlexible.getConsumidoHoy().kcal);
        check('F2: registrar comida actualiza el diario', after === before + 220, `${before} → ${after}`);
        check('F2: la comida aparece en la lista',
            await page.locator('#flexible-meal-list .meal-row').count() >= 1);

        // Tiendas: seleccionar país manual + tienda → sugerencias
        await page.locator('.nutri-subtab[data-sub="tiendas"]').click();
        await page.waitForTimeout(400);
        await page.evaluate(() => window.NutritionStores.setCountry('MX'));
        await page.waitForTimeout(400);
        const storeChips = await page.locator('#stores-list .store-chip').count();
        check('F2: tiendas MX renderizadas', storeChips >= 3, `${storeChips} tiendas`);
        await page.locator('#stores-list .store-chip').first().click();
        await page.waitForTimeout(400);
        const suggestions = await page.locator('#store-suggestions .store-suggestion').count();
        check('F2: sugerencias según macros faltantes', suggestions >= 1, `${suggestions} sugerencias`);

        // Escáner: UI presente (cámara no disponible en file://, debe avisar)
        await page.locator('.nutri-subtab[data-sub="scanner"]').click();
        await page.waitForTimeout(400);
        check('F2: UI del escáner renderizada',
            await page.locator('#nutri-sub-scanner #scanner-manual-code').count() === 1);

        // ── FASE 3: Sinergia (PR hoy → ajuste) ──
        if (await page.evaluate(() => !!window.RecoveryNutritionSync)) {
            await page.evaluate(() => {
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('rpCoach_strength_prs',
                    JSON.stringify([{ exercise: 'Press Banca', weight: 120, reps: 1, date: today }]));
                localStorage.removeItem('rpCoach_nutrition_adjustment');
                window.RecoveryNutritionSync.evaluateToday();
            });
            await page.waitForTimeout(500);
            const adj = await page.evaluate(() =>
                JSON.parse(localStorage.getItem('rpCoach_nutrition_adjustment') || 'null'));
            check('F3: PR genera ajuste de macros', adj && adj.reason === 'pr',
                adj ? `+${adj.kcalDelta} kcal, +${adj.carbDelta}g carbs` : 'sin ajuste');

            await page.locator('.nutri-subtab[data-sub="flexible"]').click();
            await page.waitForTimeout(500);
            check('F3: banner de ajuste visible',
                await page.locator('#nutrition-adjustment-banner .coach-adjustment-banner').count() === 1);

            // Reversibilidad
            const targetsAntes = await page.evaluate(() => window.NutritionFlexible.getTargetsHoy().kcal);
            await page.evaluate(() => window.RecoveryNutritionSync.setStatus('ignored'));
            const targetsDespues = await page.evaluate(() => window.NutritionFlexible.getTargetsHoy().kcal);
            check('F3: ajuste reversible (ignorar baja el target)',
                targetsDespues < targetsAntes, `${targetsAntes} → ${targetsDespues}`);
        }
    } else {
        results.push('⏭️  Fase 2/3 aún no implementadas, se omiten');
    }

    // Errores de consola (ignorar fallos de red esperables en file://)
    const realErrors = consoleErrors.filter(e =>
        !e.includes('net::ERR') && !e.includes('Failed to load resource') &&
        !e.includes('CORS') && !e.includes('ERR_FILE_NOT_FOUND') &&
        // Pre-existentes al abrir por file:// (fetch de metodologias_data.json):
        !e.includes('URL scheme "file" is not supported') &&
        !e.includes('Metodología Cargando metodologías'));
    check('Sin errores de consola', realErrors.length === 0,
        realErrors.slice(0, 3).join(' | '));

    console.log(results.join('\n'));
    await browser.close();
    process.exit(results.some(r => r.startsWith('❌')) ? 1 : 0);
})();
