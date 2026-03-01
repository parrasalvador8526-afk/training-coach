/**
 * NEXUS-RP Coach - Módulo de Bioimpedancia
 * Formulario de datos corporales, cálculos y visualización
 * Adaptado desde NEXUS-APP para integración con RP Coach
 */

const BioimpedanciaRP = (() => {
    let bioChart = null;

    // =============================================
    // INICIALIZACIÓN
    // =============================================

    function init() {
        renderFormulario();
        cargarDatosGuardados();
        setupEventListeners();
    }

    // =============================================
    // RENDERIZADO DEL FORMULARIO
    // =============================================

    function renderFormulario() {
        const container = document.getElementById('bioimpedancia-form-container');
        if (!container) return;

        container.innerHTML = `
            <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-input" id="bio-nombre" placeholder="Tu nombre" required>
            </div>
            
            <div class="module-grid mt-2">
                <div class="form-group">
                    <label class="form-label">Edad</label>
                    <input type="number" class="form-input" id="bio-edad" min="15" max="80" placeholder="25" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Sexo</label>
                    <select class="form-select" id="bio-sexo" required>
                        <option value="">Seleccionar...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>
            </div>
            
            <div class="module-grid mt-2">
                <div class="form-group">
                    <label class="form-label">Peso (kg)</label>
                    <input type="number" class="form-input" id="bio-peso" min="40" max="200" step="0.1" placeholder="75.5" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Altura (cm)</label>
                    <input type="number" class="form-input" id="bio-altura" min="140" max="220" placeholder="175" required>
                </div>
            </div>
            
            <div class="alert alert--info mt-2" style="padding: 8px;">
                <span>📊</span>
                <span style="font-size: 0.8rem;">Datos de bioimpedancia (opcionales)</span>
            </div>
            
            <div class="module-grid mt-2">
                <div class="form-group">
                    <label class="form-label">% Grasa Corporal</label>
                    <input type="number" class="form-input" id="bio-grasa" min="5" max="50" step="0.1" placeholder="15.5">
                </div>
                <div class="form-group">
                    <label class="form-label">Masa Muscular (kg)</label>
                    <input type="number" class="form-input" id="bio-muscular" min="20" max="100" step="0.1" placeholder="55.0">
                </div>
            </div>
            
            <div class="module-grid mt-2">
                <div class="form-group">
                    <label class="form-label">Grasa Visceral (nivel)</label>
                    <input type="number" class="form-input" id="bio-visceral" min="1" max="59" step="1" placeholder="8">
                    <small style="font-size: 0.7rem; color: var(--text-muted);">1-12 saludable</small>
                </div>
                <div class="form-group">
                    <label class="form-label">Nivel de Actividad</label>
                    <select class="form-select" id="bio-actividad" required>
                        <option value="ligero">Ligero (1-3 días/sem)</option>
                        <option value="moderado" selected>Moderado (3-5 días/sem)</option>
                        <option value="activo">Activo (6-7 días/sem)</option>
                        <option value="muy_activo">Muy Activo</option>
                    </select>
                </div>
            </div>
            
            <button type="button" id="btn-calcular-bio" class="btn btn--primary btn--block mt-3">
                📊 CALCULAR MÉTRICAS
            </button>
        `;
    }

    // =============================================
    // CÁLCULOS
    // =============================================

    function calcularMetricas() {
        const datos = obtenerDatosFormulario();

        if (!datos.nombre || !datos.peso || !datos.altura || !datos.edad || !datos.sexo) {
            showNotification('Por favor completa los campos requeridos', 'warning');
            return null;
        }

        // Calcular TMB (Mifflin-St Jeor)
        let tmb;
        if (datos.sexo === 'M') {
            tmb = 10 * datos.peso + 6.25 * datos.altura - 5 * datos.edad + 5;
        } else {
            tmb = 10 * datos.peso + 6.25 * datos.altura - 5 * datos.edad - 161;
        }

        // Factor de actividad para TDEE
        const factores = {
            sedentario: 1.2,
            ligero: 1.375,
            moderado: 1.55,
            activo: 1.725,
            muy_activo: 1.9
        };
        const tdee = Math.round(tmb * (factores[datos.actividad] || 1.55));

        // Calcular IMC
        const alturaM = datos.altura / 100;
        const imc = datos.peso / (alturaM * alturaM);

        // Clasificar IMC
        let clasificacionIMC;
        if (imc < 18.5) clasificacionIMC = 'Bajo peso';
        else if (imc < 25) clasificacionIMC = 'Normal';
        else if (imc < 30) clasificacionIMC = 'Sobrepeso';
        else clasificacionIMC = 'Obesidad';

        // Estimar % grasa si no se proporciona
        let porcentajeGrasa = datos.grasa;
        if (!porcentajeGrasa) {
            if (datos.sexo === 'M') {
                porcentajeGrasa = imc < 25 ? 15 : (imc < 30 ? 22 : 30);
            } else {
                porcentajeGrasa = imc < 25 ? 23 : (imc < 30 ? 30 : 38);
            }
        }

        // Calcular masa libre de grasa y masa grasa
        const masaGrasa = datos.peso * (porcentajeGrasa / 100);
        const ffm = datos.peso - masaGrasa;

        // Macros recomendados (volumen por defecto)
        const proteina = Math.round(ffm * 2.2); // 2.2g/kg FFM
        const carbos = Math.round(tdee * 0.5 / 4); // 50% de calorías
        const grasas = Math.round(tdee * 0.25 / 9); // 25% de calorías

        const metricas = {
            tmb: Math.round(tmb),
            tdee: tdee,
            imc: parseFloat(imc.toFixed(1)),
            clasificacionIMC,
            porcentajeGrasa,
            masaGrasa: parseFloat(masaGrasa.toFixed(1)),
            ffm: parseFloat(ffm.toFixed(1)),
            macros: {
                calorias: tdee,
                proteina,
                carbohidratos: carbos,
                grasas
            }
        };

        // Guardar datos
        guardarDatos(datos, metricas);

        // Mostrar resultados
        mostrarResultados(datos, metricas);

        // Notificar éxito
        showNotification('Métricas calculadas exitosamente', 'success');

        return metricas;
    }

    function obtenerDatosFormulario() {
        return {
            nombre: document.getElementById('bio-nombre')?.value || '',
            edad: parseInt(document.getElementById('bio-edad')?.value) || null,
            sexo: document.getElementById('bio-sexo')?.value || '',
            peso: parseFloat(document.getElementById('bio-peso')?.value) || null,
            altura: parseFloat(document.getElementById('bio-altura')?.value) || null,
            grasa: parseFloat(document.getElementById('bio-grasa')?.value) || null,
            muscular: parseFloat(document.getElementById('bio-muscular')?.value) || null,
            visceral: parseInt(document.getElementById('bio-visceral')?.value) || null,
            actividad: document.getElementById('bio-actividad')?.value || 'moderado'
        };
    }

    // =============================================
    // VISUALIZACIÓN
    // =============================================

    function mostrarResultados(datos, metricas) {
        const display = document.getElementById('bio-results-container');
        if (!display) return;

        display.innerHTML = `
            <div class="card mt-2">
                <div class="card__header">
                    <h4>📊 Métricas Calculadas</h4>
                </div>
                
                <div class="module-grid mt-2" style="gap: 8px;">
                    <div class="stat-box" style="padding: 10px;">
                        <div class="stat-box__value" style="font-size: 1.2rem;">${metricas.tmb}</div>
                        <div class="stat-box__label">TMB (kcal)</div>
                    </div>
                    <div class="stat-box" style="padding: 10px;">
                        <div class="stat-box__value" style="font-size: 1.2rem;">${metricas.tdee}</div>
                        <div class="stat-box__label">TDEE (kcal)</div>
                    </div>
                    <div class="stat-box" style="padding: 10px;">
                        <div class="stat-box__value" style="font-size: 1.2rem;">${metricas.imc}</div>
                        <div class="stat-box__label">IMC</div>
                    </div>
                    <div class="stat-box" style="padding: 10px;">
                        <div class="stat-box__value" style="font-size: 1.2rem;">${metricas.ffm}</div>
                        <div class="stat-box__label">Masa Magra (kg)</div>
                    </div>
                </div>
                
                <div class="alert ${metricas.clasificacionIMC === 'Normal' ? 'alert--success' : 'alert--warning'} mt-2" style="padding: 8px;">
                    <span>${metricas.clasificacionIMC === 'Normal' ? '✅' : '⚠️'}</span>
                    <span>IMC: ${metricas.clasificacionIMC} | Grasa: ${metricas.porcentajeGrasa}%</span>
                </div>
            </div>
            
            <div class="card mt-2">
                <div class="card__header">
                    <h4>🍽️ Macros Recomendados</h4>
                </div>
                
                <div class="module-grid mt-2" style="gap: 8px;">
                    <div class="stat-box" style="padding: 10px; background: rgba(239, 68, 68, 0.1);">
                        <div class="stat-box__value" style="font-size: 1.2rem; color: #F87171;">${metricas.macros.calorias}</div>
                        <div class="stat-box__label">🔥 Calorías</div>
                    </div>
                    <div class="stat-box" style="padding: 10px; background: rgba(59, 130, 246, 0.1);">
                        <div class="stat-box__value" style="font-size: 1.2rem; color: #60A5FA;">${metricas.macros.proteina}g</div>
                        <div class="stat-box__label">💪 Proteína</div>
                    </div>
                    <div class="stat-box" style="padding: 10px; background: rgba(251, 191, 36, 0.1);">
                        <div class="stat-box__value" style="font-size: 1.2rem; color: #FBBF24;">${metricas.macros.carbohidratos}g</div>
                        <div class="stat-box__label">🍚 Carbos</div>
                    </div>
                    <div class="stat-box" style="padding: 10px; background: rgba(34, 197, 94, 0.1);">
                        <div class="stat-box__value" style="font-size: 1.2rem; color: #4ADE80;">${metricas.macros.grasas}g</div>
                        <div class="stat-box__label">🥑 Grasas</div>
                    </div>
                </div>
            </div>
            
            <canvas id="bio-chart" style="max-height: 200px; margin-top: 16px;"></canvas>
        `;

        // Renderizar gráfico
        renderChart(datos, metricas);
    }

    function renderChart(datos, metricas) {
        const canvas = document.getElementById('bio-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        if (bioChart) {
            bioChart.destroy();
        }

        const ctx = canvas.getContext('2d');

        bioChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Masa Magra', 'Masa Grasa'],
                datasets: [{
                    data: [metricas.ffm, metricas.masaGrasa],
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgba(139, 92, 246, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#E5E7EB', font: { size: 11 } }
                    },
                    title: {
                        display: true,
                        text: 'Composición Corporal (kg)',
                        color: '#E5E7EB',
                        font: { size: 14 }
                    }
                }
            }
        });
    }

    // =============================================
    // PERSISTENCIA
    // =============================================

    function guardarDatos(datos, metricas) {
        const bioData = {
            ...datos,
            metricas,
            fechaActualizacion: new Date().toISOString()
        };
        localStorage.setItem('rpcoach_bioimpedancia', JSON.stringify(bioData));

        // También guardar en el perfil general
        const profile = JSON.parse(localStorage.getItem('rpcoach_profile') || '{}');
        profile.bioimpedancia = bioData;
        localStorage.setItem('rpcoach_profile', JSON.stringify(profile));
    }

    function cargarDatosGuardados() {
        try {
            const saved = localStorage.getItem('rpcoach_bioimpedancia');
            if (!saved) return;

            const data = JSON.parse(saved);

            // Rellenar formulario
            setTimeout(() => {
                if (data.nombre) document.getElementById('bio-nombre').value = data.nombre;
                if (data.edad) document.getElementById('bio-edad').value = data.edad;
                if (data.sexo) document.getElementById('bio-sexo').value = data.sexo;
                if (data.peso) document.getElementById('bio-peso').value = data.peso;
                if (data.altura) document.getElementById('bio-altura').value = data.altura;
                if (data.grasa) document.getElementById('bio-grasa').value = data.grasa;
                if (data.muscular) document.getElementById('bio-muscular').value = data.muscular;
                if (data.visceral) document.getElementById('bio-visceral').value = data.visceral;
                if (data.actividad) document.getElementById('bio-actividad').value = data.actividad;

                // Mostrar métricas si existen
                if (data.metricas) {
                    mostrarResultados(data, data.metricas);
                }
            }, 100);
        } catch (e) {
            console.warn('Error cargando datos de bioimpedancia:', e);
        }
    }

    function setupEventListeners() {
        setTimeout(() => {
            const btnCalcular = document.getElementById('btn-calcular-bio');
            if (btnCalcular) {
                btnCalcular.addEventListener('click', calcularMetricas);
            }
        }, 200);
    }

    // =============================================
    // UTILIDAD: Obtener datos para otros módulos
    // =============================================

    function getDatosCalculados() {
        try {
            const saved = localStorage.getItem('rpcoach_bioimpedancia');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) { }
        return null;
    }

    function getTDEE() {
        const datos = getDatosCalculados();
        return datos?.metricas?.tdee || 2000;
    }

    function getMacros() {
        const datos = getDatosCalculados();
        return datos?.metricas?.macros || { calorias: 2000, proteina: 150, carbohidratos: 250, grasas: 65 };
    }

    // =============================================
    // NOTIFICACIÓN (helper local)
    // =============================================

    function showNotification(message, type = 'info') {
        // Usar la función global si existe
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }

        // Fallback simple
        console.log(`[${type.toUpperCase()}] ${message}`);

        const notification = document.createElement('div');
        notification.className = `alert alert--${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'}`;
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 12px 20px; animation: fadeIn 0.3s;';
        notification.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    // API Pública
    return {
        init,
        calcularMetricas,
        getDatosCalculados,
        getTDEE,
        getMacros,
        cargarDatosGuardados
    };
})();

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.BioimpedanciaRP = BioimpedanciaRP;
}
