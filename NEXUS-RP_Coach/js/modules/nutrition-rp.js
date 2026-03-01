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

        // Obtener datos de bioimpedancia
        const bioData = BioimpedanciaRP?.getDatosCalculados?.();
        const macros = bioData?.metricas?.macros;

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
        const methodology = localStorage.getItem('rpcoach_methodology') || 'Y3T';

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
            
            <!-- Ciclado Ondulante -->
            ${renderCicladoOndulante(macros)}
            
            <!-- Suplementación -->
            ${renderSuplementacion()}
            
            <!-- Timing Nutricional -->
            ${renderTimingNutricional(macros)}
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
    // UTILIDADES
    // =============================================

    function actualizarConMetodologia(metodologia) {
        localStorage.setItem('rpcoach_methodology', metodologia);
        renderPlanNutricional();
    }

    // API Pública
    return {
        init,
        renderPlanNutricional,
        actualizarConMetodologia
    };
})();

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.NutricionRP = NutricionRP;
}
