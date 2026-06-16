/**
 * NEXUS-RP Coach - Módulo de Nutrición
 * Plan nutricional con ciclado ondulante y suplementación
 * Adaptado desde NEXUS-APP para integración con RP Coach
 */

const NutricionRP = (() => {

    // =============================================
    // INICIALIZACIÓN
    // =============================================

    function init() {
        renderPlanNutricional();
    }

    // =============================================
    // GENERACIÓN DEL PLAN
    // =============================================

    function renderPlanNutricional() {
        const container = document.getElementById('nutrition-plan-container');
        if (!container) return;

        // Obtener datos de bioimpedancia (fallback: targets del Plan Flexible)
        const bioData = BioimpedanciaRP?.getDatosCalculados?.();
        let macros = bioData?.metricas?.macros;
        let usingFallback = false;

        if (!macros && window.NutritionFlexible) {
            const t = NutritionFlexible.getTargetsBase();
            macros = { calorias: t.kcal, proteina: t.prot, carbohidratos: t.carb, grasas: t.grasa };
            usingFallback = true;
        }

        if (!macros) {
            container.innerHTML = `
                <div class="alert alert--warning">
                    <span>⚠️</span>
                    <div>
                        <strong>Datos incompletos</strong>
                        <p>Primero completa tus datos en la sección <strong>DATOS</strong> para generar tu plan nutricional.</p>
                    </div>
                </div>
            `;
            return;
        }

        // Obtener metodología activa
        const methodology = localStorage.getItem('rpCoach_methodology') || 'Y3T';

        container.innerHTML = `
            <div class="card card--highlight">
                <div class="card__header">
                    <h3 class="card__title">🍽️ Tu Plan Nutricional</h3>
                    <span class="rp-badge">${methodology}</span>
                </div>
                
                <div class="alert alert--info mt-2" style="padding: 10px;">
                    <span>📊</span>
                    <span>Plan basado en tu TDEE de <strong>${macros.calorias} kcal</strong></span>
                </div>
                
                <!-- Macros Diarios -->
                <h4 class="mt-3">📊 Macros Diarios Base</h4>
                <div class="module-grid mt-2" style="gap: 8px;">
                    <div class="stat-box" style="padding: 10px; background: rgba(239, 68, 68, 0.1);">
                        <div class="stat-box__value" style="font-size: 1.3rem; color: #F87171;">${macros.calorias}</div>
                        <div class="stat-box__label">🔥 Calorías</div>
                    </div>
                    <div class="stat-box" style="padding: 10px; background: rgba(59, 130, 246, 0.1);">
                        <div class="stat-box__value" style="font-size: 1.3rem; color: #60A5FA;">${macros.proteina}g</div>
                        <div class="stat-box__label">💪 Proteína</div>
                    </div>
                    <div class="stat-box" style="padding: 10px; background: rgba(251, 191, 36, 0.1);">
                        <div class="stat-box__value" style="font-size: 1.3rem; color: #FBBF24;">${macros.carbohidratos}g</div>
                        <div class="stat-box__label">🍚 Carbos</div>
                    </div>
                    <div class="stat-box" style="padding: 10px; background: rgba(34, 197, 94, 0.1);">
                        <div class="stat-box__value" style="font-size: 1.3rem; color: #4ADE80;">${macros.grasas}g</div>
                        <div class="stat-box__label">🥑 Grasas</div>
                    </div>
                </div>
            </div>
            
            ${usingFallback ? `
                <div class="alert alert--info mt-2" style="padding:8px; font-size:0.75rem;">
                    <span>ℹ️</span>
                    <span>Menú con targets genéricos. Completa <strong>Perfil → DATOS</strong> para personalizarlo.</span>
                </div>` : ''}

            <!-- Menú del día generado (Plan Estricto) -->
            ${renderMenuEstricto(macros)}

            <!-- Ciclado Ondulante -->
            ${renderCicladoOndulante(macros)}
            
            <!-- Suplementación -->
            ${renderSuplementacion()}
            
            <!-- Timing Nutricional -->
            ${renderTimingNutricional(macros)}
        `;
    }

    // =============================================
    // MENÚ DEL DÍA (PLAN ESTRICTO)
    // =============================================

    /**
     * Mapea la categoría de un alimento al macro que debe gobernar su escalado.
     * Las proteínas/lácteos escalan hacia el objetivo de proteína, los
     * carbohidratos/frutas/snacks hacia el de carbohidratos, las grasas hacia
     * el de grasas. Las verduras son de bajo aporte y no se escalan (saciedad).
     */
    function grupoEscalado(cat) {
        if (cat === 'proteina' || cat === 'lacteo') return 'prot';
        if (cat === 'carb' || cat === 'fruta' || cat === 'snack' || cat === 'bebida') return 'carb';
        if (cat === 'grasa') return 'grasa';
        return 'veg';
    }

    /**
     * Genera un menú fijo de 4 comidas a partir de ALIMENTOS_DB. A diferencia de
     * un escalado por calorías (que dispara la proteína muy por encima del
     * objetivo), aquí cada grupo de fuentes se escala hacia SU macro objetivo:
     * proteínas → target proteína, carbohidratos → target carbos, grasas →
     * target grasas. Así los totales del menú aterrizan cerca de los 4 macros y
     * el "Progreso de Hoy" solo marca exceso (⚠️) cuando realmente lo hay.
     * Rota las fuentes según el día de la semana para dar variedad sin azar.
     */
    function generarMenuDiario(macros) {
        const db = window.ALIMENTOS_DB || [];
        if (!db.length) return null;

        const pick = (cat, idx) => {
            const items = db.filter(a => a.cat === cat);
            return items.length ? items[idx % items.length] : null;
        };
        const dia = new Date().getDay();

        const comidas = [
            { nombre: '🌅 Desayuno', fuentes: [pick('proteina', dia + 8), pick('carb', dia + 2), pick('fruta', dia)] },
            { nombre: '🍽️ Comida', fuentes: [pick('proteina', dia), pick('carb', dia), pick('veg', dia), pick('grasa', dia)] },
            { nombre: '🌙 Cena', fuentes: [pick('proteina', dia + 3), pick('veg', dia + 2), pick('grasa', dia + 1)] },
            { nombre: '🥜 Snack', fuentes: [pick('lacteo', dia), pick('fruta', dia + 1)] }
        ];

        // Lista plana de fuentes para resolver el escalado global
        const fuentesPlano = [];
        comidas.forEach(c => c.fuentes.filter(Boolean).forEach(f => fuentesPlano.push(f)));

        const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
        const escala = { prot: 1, carb: 1, grasa: 1, veg: 1 };

        // Totales de cada macro con un set de escalas dado (cada fuente aporta a
        // los 3 macros, no solo al de su grupo — de ahí el acoplamiento)
        const totalesCon = (s) => fuentesPlano.reduce((acc, f) => {
            const k = s[grupoEscalado(f.cat)];
            acc.prot += f.prot * k; acc.carb += f.carb * k; acc.grasa += f.grasa * k;
            return acc;
        }, { prot: 0, carb: 0, grasa: 0 });

        // Ajuste iterativo (Gauss-Seidel): cada grupo persigue su macro objetivo
        // teniendo en cuenta el aporte cruzado de las demás fuentes. Converge en
        // pocas vueltas porque cada macro está dominado por su propio grupo.
        for (let i = 0; i < 8; i++) {
            const t = totalesCon(escala);
            if (t.prot  > 0) escala.prot  = clamp(escala.prot  * (macros.proteina     / t.prot),  0.35, 3.5);
            if (t.carb  > 0) escala.carb  = clamp(escala.carb  * (macros.carbohidratos / t.carb),  0.35, 3.5);
            if (t.grasa > 0) escala.grasa = clamp(escala.grasa * (macros.grasas        / t.grasa), 0.35, 3.5);
        }

        return comidas.map(comida => {
            const fuentes = comida.fuentes.filter(Boolean);
            let totales = { kcal: 0, prot: 0, carb: 0, grasa: 0 };
            const items = fuentes.map(f => {
                const s = escala[grupoEscalado(f.cat)];
                const r = {
                    nombre: f.nombre,
                    gramos: Math.round((f.gramos || 0) * s),
                    kcal: Math.round(f.kcal * s),
                    prot: Math.round(f.prot * s),
                    carb: Math.round(f.carb * s),
                    grasa: Math.round(f.grasa * s)
                };
                totales.kcal += r.kcal; totales.prot += r.prot;
                totales.carb += r.carb; totales.grasa += r.grasa;
                return r;
            });
            return { nombre: comida.nombre, items, totales };
        });
    }

    function renderMenuEstricto(macros) {
        const menu = generarMenuDiario(macros);
        if (!menu) return '';

        const totalDia = menu.reduce((acc, c) => ({
            kcal: acc.kcal + c.totales.kcal, prot: acc.prot + c.totales.prot,
            carb: acc.carb + c.totales.carb, grasa: acc.grasa + c.totales.grasa
        }), { kcal: 0, prot: 0, carb: 0, grasa: 0 });

        return `
            <div class="card mt-3">
                <div class="card__header">
                    <h4>📋 Menú de Hoy (Plan Estricto)</h4>
                    <span class="rp-badge" style="background:#10B981;">${totalDia.kcal} kcal</span>
                </div>
                ${menu.map(comida => `
                    <div style="margin-top:12px; padding:10px; background:rgba(255,255,255,0.03); border-radius:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.85rem;">${comida.nombre}</strong>
                            <span class="text-muted" style="font-size:0.68rem;">
                                ${comida.totales.kcal} kcal · P ${comida.totales.prot}g · C ${comida.totales.carb}g · G ${comida.totales.grasa}g
                            </span>
                        </div>
                        ${comida.items.map(i => `
                            <div style="display:flex; justify-content:space-between; font-size:0.78rem; padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                                <span>${i.nombre} <span class="text-muted" style="font-size:0.65rem;">(${i.gramos}g)</span></span>
                                <span class="text-muted">${i.kcal} kcal</span>
                            </div>`).join('')}
                    </div>`).join('')}
                <div class="alert alert--info mt-2" style="padding:8px; font-size:0.75rem;">
                    <span>🔄</span>
                    <span>El menú rota automáticamente cada día de la semana. Total: <strong>${totalDia.kcal} kcal · P ${totalDia.prot}g · C ${totalDia.carb}g · G ${totalDia.grasa}g</strong> (objetivo: ${macros.calorias} kcal).</span>
                </div>
            </div>
        `;
    }

    // =============================================
    // CICLADO ONDULANTE
    // =============================================

    function renderCicladoOndulante(macros) {
        // Calcular variaciones
        const diaAlto = {
            calorias: Math.round(macros.calorias * 1.1),
            carbos: Math.round(macros.carbohidratos * 1.3),
            proteina: macros.proteina,
            grasas: Math.round(macros.grasas * 0.9)
        };

        const diaModerado = {
            calorias: macros.calorias,
            carbos: macros.carbohidratos,
            proteina: macros.proteina,
            grasas: macros.grasas
        };

        const diaDescanso = {
            calorias: Math.round(macros.calorias * 0.85),
            carbos: Math.round(macros.carbohidratos * 0.6),
            proteina: macros.proteina,
            grasas: Math.round(macros.grasas * 1.1)
        };

        return `
            <div class="card mt-3">
                <div class="card__header">
                    <h4>🔄 Ciclado Ondulante de Carbohidratos</h4>
                </div>
                
                <table class="data-table mt-2">
                    <tr>
                        <th>Tipo de Día</th>
                        <th>Calorías</th>
                        <th>Carbos</th>
                        <th>Proteína</th>
                        <th>Grasas</th>
                    </tr>
                    <tr style="background: rgba(34, 197, 94, 0.1);">
                        <td><strong>💪 Día Alto</strong><br><small>Entrenamiento intenso</small></td>
                        <td>${diaAlto.calorias}</td>
                        <td class="text-success">${diaAlto.carbos}g</td>
                        <td>${diaAlto.proteina}g</td>
                        <td>${diaAlto.grasas}g</td>
                    </tr>
                    <tr style="background: rgba(251, 191, 36, 0.1);">
                        <td><strong>📊 Día Moderado</strong><br><small>Entrenamiento normal</small></td>
                        <td>${diaModerado.calorias}</td>
                        <td class="text-warning">${diaModerado.carbos}g</td>
                        <td>${diaModerado.proteina}g</td>
                        <td>${diaModerado.grasas}g</td>
                    </tr>
                    <tr style="background: rgba(139, 92, 246, 0.1);">
                        <td><strong>😴 Día Descanso</strong><br><small>Sin entrenamiento</small></td>
                        <td>${diaDescanso.calorias}</td>
                        <td class="text-muted">${diaDescanso.carbos}g</td>
                        <td>${diaDescanso.proteina}g</td>
                        <td>${diaDescanso.grasas}g</td>
                    </tr>
                </table>
                
                <div class="alert alert--info mt-2" style="padding: 8px; font-size: 0.8rem;">
                    <span>💡</span>
                    <span>Los días de entrenamiento intenso suben carbos +30%. Los días de descanso bajan carbos -40%.</span>
                </div>
            </div>
        `;
    }

    // =============================================
    // SUPLEMENTACIÓN
    // =============================================

    function renderSuplementacion() {
        return `
            <div class="card mt-3">
                <div class="card__header">
                    <h4>💊 Suplementación Recomendada</h4>
                </div>
                
                <table class="data-table mt-2">
                    <tr>
                        <th>Suplemento</th>
                        <th>Dosis</th>
                        <th>Timing</th>
                        <th>Evidencia</th>
                    </tr>
                    <tr>
                        <td><strong>🔴 Creatina</strong></td>
                        <td>5g/día</td>
                        <td>Cualquier momento</td>
                        <td><span class="rp-badge" style="background: #10B981;">Alta</span></td>
                    </tr>
                    <tr>
                        <td><strong>🟡 Proteína Whey</strong></td>
                        <td>25-40g</td>
                        <td>Post-entreno / Desayuno</td>
                        <td><span class="rp-badge" style="background: #10B981;">Alta</span></td>
                    </tr>
                    <tr>
                        <td><strong>🟠 Cafeína</strong></td>
                        <td>3-6mg/kg</td>
                        <td>30-60min pre-entreno</td>
                        <td><span class="rp-badge" style="background: #10B981;">Alta</span></td>
                    </tr>
                    <tr>
                        <td><strong>⚪ Beta-Alanina</strong></td>
                        <td>3-5g/día</td>
                        <td>Dividido en tomas</td>
                        <td><span class="rp-badge" style="background: #F59E0B;">Media</span></td>
                    </tr>
                    <tr>
                        <td><strong>🔵 Omega-3</strong></td>
                        <td>2-3g EPA+DHA</td>
                        <td>Con comidas</td>
                        <td><span class="rp-badge" style="background: #10B981;">Alta</span></td>
                    </tr>
                    <tr>
                        <td><strong>☀️ Vitamina D</strong></td>
                        <td>2000-5000 IU</td>
                        <td>Mañana con grasa</td>
                        <td><span class="rp-badge" style="background: #10B981;">Alta</span></td>
                    </tr>
                </table>
                
                <div class="alert alert--warning mt-2" style="padding: 8px; font-size: 0.8rem;">
                    <span>⚠️</span>
                    <span>Prioriza una alimentación completa antes de suplementar. Consulta con un profesional.</span>
                </div>
            </div>
        `;
    }

    // =============================================
    // TIMING NUTRICIONAL
    // =============================================

    function renderTimingNutricional(macros) {
        const protePerComida = Math.round(macros.proteina / 5);

        return `
            <div class="card mt-3">
                <div class="card__header">
                    <h4>⏰ Distribución del Día de Entrenamiento</h4>
                </div>
                
                <div class="mt-2" style="position: relative; padding-left: 20px; border-left: 2px solid #8B5CF6;">
                    <div class="mb-3" style="position: relative;">
                        <div style="position: absolute; left: -26px; width: 12px; height: 12px; background: #8B5CF6; border-radius: 50%;"></div>
                        <strong>🌅 Desayuno</strong>
                        <p class="text-muted text-sm">~${protePerComida}g proteína + carbos complejos</p>
                    </div>
                    
                    <div class="mb-3" style="position: relative;">
                        <div style="position: absolute; left: -26px; width: 12px; height: 12px; background: #10B981; border-radius: 50%;"></div>
                        <strong>🕐 Pre-Entreno (2h antes)</strong>
                        <p class="text-muted text-sm">~${protePerComida}g proteína + carbos moderados</p>
                    </div>
                    
                    <div class="mb-3" style="position: relative;">
                        <div style="position: absolute; left: -26px; width: 12px; height: 12px; background: #F59E0B; border-radius: 50%;"></div>
                        <strong>💪 Intra/Post-Entreno</strong>
                        <p class="text-muted text-sm">Whey + carbos rápidos (opcional)</p>
                    </div>
                    
                    <div class="mb-3" style="position: relative;">
                        <div style="position: absolute; left: -26px; width: 12px; height: 12px; background: #3B82F6; border-radius: 50%;"></div>
                        <strong>🍽️ Almuerzo</strong>
                        <p class="text-muted text-sm">~${protePerComida}g proteína + carbos + verduras</p>
                    </div>
                    
                    <div class="mb-3" style="position: relative;">
                        <div style="position: absolute; left: -26px; width: 12px; height: 12px; background: #EC4899; border-radius: 50%;"></div>
                        <strong>🌙 Cena</strong>
                        <p class="text-muted text-sm">~${protePerComida}g proteína + grasas + verduras</p>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // =============================================
    // UTILIDADES
    // =============================================

    function actualizarConMetodologia(metodologia) {
        localStorage.setItem('rpCoach_methodology', metodologia);
        renderPlanNutricional();
    }


    // API Pública
    return {
        init,
        renderPlanNutricional,
        actualizarConMetodologia,
        generarMenuDiario
    };
})();

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.NutricionRP = NutricionRP;
}
