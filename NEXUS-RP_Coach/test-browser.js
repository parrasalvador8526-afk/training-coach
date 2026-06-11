const { chromium } = require('playwright');
(async () => {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();

        let hasError = false;
        page.on('console', msg => {
            if (msg.type() === 'error') hasError = true;
            console.log(`[CONSOLE] ${msg.type().toUpperCase()}:`, msg.text());
        });
        page.on('pageerror', err => {
            hasError = true;
            console.error('[PAGE ERROR]:', err.message);
        });

        await page.goto('file:///Users/salvador/Documents/DATOS PARA METODOLOGIA/FISICOCULTURIMO ENTRENAMIENTO /NEXUS-RP_Coach/index.html');
        await page.waitForTimeout(1000);

        console.log("Clicking 'Ir a Entrenar'...");
        await page.evaluate(() => {
            const btn = document.querySelector('.btn--primary.btn--sm.mt-3');
            if (btn) btn.click();
        });
        await page.waitForTimeout(500);

        console.log("Clicking 'Coach Nutricional' tab...");
        await page.evaluate(() => {
            const btn = document.querySelector('.nav-tab[data-module="nutrition"]');
            if (btn) btn.click();
        });
        await page.waitForTimeout(500);

        if (!hasError) console.log("SUCCESS: No errors found during interaction tests.");

        await browser.close();
    } catch (e) {
        console.error("Script Error:", e);
    }
})();
