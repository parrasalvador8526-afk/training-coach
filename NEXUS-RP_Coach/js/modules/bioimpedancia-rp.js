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
                <span style="font-size: 0.8rem;">Datos de báscula de bioimpedancia (opcionales)</span>
            </div>
            
            <div class="module-grid mt-2">
                <div class="form-group">
                    <label class="form-label">TMB (kcal)</label>
                    <input type="number" class="form-input" id="bio-tmb" min="1000" max="4000" step="1" placeholder="Ej: 1850">
                </div>
                <div class="form-group">
                    <label class="form-label">IMC</label>
                    <input type="number" class="form-input" id="bio-imc" min="15" max="50" step="0.1" placeholder="Ej: 24.5">
                </div>
            </div>

            <div class="module-grid mt-2">
                <div class="form-group">
                    <label class="form-label">% Grasa Corporal</label>
                    <input type="number" class="form-input" id="bio-grasa" min="3" max="60" step="0.1" placeholder="Ej: 15.5">
                </div>
                <div class="form-group">
                    <label class="form-label">Masa Grasa (kg)</label>
                    <input type="number" class="form-input" id="bio-masa-grasa" min="2" max="100" step="0.1" placeholder="Ej: 12.5">
                </div>
            </div>

            <div class="module-grid mt-2">
                <div class="form-group">
                    <label class="form-label">Masa Muscular (kg)</label>
                    <input type="number" class="form-input" id="bio-muscular" min="20" max="100" step="0.1" placeholder="Ej: 55.0">
                </div>
                <div class="form-group">
                    <label class="form-label">% Muscular</label>
                    <input type="number" class="form-input" id="bio-porcentaje-muscular" min="10" max="80" step="0.1" placeholder="Ej: 45.5">
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
        // Validación de rangos
        if (datos.peso < 30 || datos.peso > 300) {
            showNotification('Peso debe estar entre 30 y 300 kg', 'warning');
            return null;
        }
        if (datos.altura < 100 || datos.altura > 250) {
            showNotification('Altura debe estar entre 100 y 250 cm', 'warning');
            return null;
        }
        if (datos.edad < 10 || datos.edad > 100) {
            showNotification('Edad debe estar entre 10 y 100 años', 'warning');
            return null;
        }
        if (datos.grasa && (datos.grasa < 3 || datos.grasa > 60)) {
            showNotification('% de grasa debe estar entre 3% y 60%', 'warning');
            return null;
        }

        // Calcular TMB (Mifflin-St Jeor) o usar el input
        let tmb = datos.tmbInput;
        if (!tmb) {
            if (datos.sexo === 'M') {
                tmb = 10 * datos.peso + 6.25 * datos.altura - 5 * datos.edad + 5;
            } else {
                tmb = 10 * datos.peso + 6.25 * datos.altura - 5 * datos.edad - 161;
            }
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

        // Calcular IMC o usar el input
        let imc = datos.imcInput;
        if (!imc) {
            const alturaM = datos.altura / 100;
            imc = datos.peso / (alturaM * alturaM);
        }

        // Clasificar IMC
        let clasificacionIMC;
        if (imc < 18.5) clasificacionIMC = 'Bajo peso';
        else if (imc < 25) clasificacionIMC = 'Normal';
        else if (imc < 30) clasificacionIMC = 'Sobrepeso';
        else clasificacionIMC = 'Obesidad';

        // Estimar % grasa si no se proporciona
        let porcentajeGrasa = datos.grasa;
        if (!porcentajeGrasa && datos.masaGrasaInput && datos.peso) {
            porcentajeGrasa = (datos.masaGrasaInput / datos.peso) * 100;
        }
        if (!porcentajeGrasa) {
            if (datos.sexo === 'M') {
                porcentajeGrasa = imc < 25 ? 15 : (imc < 30 ? 22 : 30);
            } else {
                porcentajeGrasa = imc < 25 ? 23 : (imc < 30 ? 30 : 38);
            }
        }

        // Calcular masa libre de grasa y masa grasa
        let masaGrasa = datos.masaGrasaInput;
        if (!masaGrasa) {
            masaGrasa = datos.peso * (porcentajeGrasa / 100);
        }
        const ffm = datos.peso - masaGrasa;

        // Masa muscular (para mostrar en reporte, opcional)
        let masaMuscular = datos.muscular;
        let porcentajeMuscular = datos.muscularPctInput;
        if (masaMuscular && !porcentajeMuscular && datos.peso) {
            porcentajeMuscular = (masaMuscular / datos.peso) * 100;
        } else if (porcentajeMuscular && !masaMuscular && datos.peso) {
            masaMuscular = datos.peso * (porcentajeMuscular / 100);
        }

        // Macros recomendados (volumen por defecto). Proteína por masa magra,
        // grasa al 25% del TDEE y carbohidratos = calorías restantes, de modo
        // que P+C+G sumen EXACTAMENTE el TDEE (sin calorías "huérfanas").
        const proteina = Math.round(ffm * 2.2); // 2.2g/kg FFM
        const repartoMacros = repartirMacros(tdee, proteina);
        const carbos = repartoMacros.carbohidratos;
        const grasas = repartoMacros.grasas;

        const metricas = {
            tmb: Math.round(tmb),
            tdee: tdee,
            imc: parseFloat(imc.toFixed(1)),
            clasificacionIMC,
            porcentajeGrasa: parseFloat(porcentajeGrasa.toFixed(1)),
            masaGrasa: parseFloat(masaGrasa.toFixed(1)),
            ffm: parseFloat(ffm.toFixed(1)),
            masaMuscular: masaMuscular ? parseFloat(masaMuscular.toFixed(1)) : null,
            porcentajeMuscular: porcentajeMuscular ? parseFloat(porcentajeMuscular.toFixed(1)) : null,
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
            actividad: document.getElementById('bio-actividad')?.value || 'moderado',
            tmbInput: parseInt(document.getElementById('bio-tmb')?.value) || null,
            imcInput: parseFloat(document.getElementById('bio-imc')?.value) || null,
            masaGrasaInput: parseFloat(document.getElementById('bio-masa-grasa')?.value) || null,
            muscularPctInput: parseFloat(document.getElementById('bio-porcentaje-muscular')?.value) || null
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
        localStorage.setItem('rpCoach_bioimpedancia', JSON.stringify(bioData));

        // También guardar en el perfil general
        const profile = JSON.parse(localStorage.getItem('rpCoach_profile') || '{}');
        profile.bioimpedancia = bioData;
        localStorage.setItem('rpCoach_profile', JSON.stringify(profile));
    }

    function cargarDatosGuardados() {
        try {
            const savedBio = localStorage.getItem('rpCoach_bioimpedancia');
            const savedProfile = localStorage.getItem('rpCoach_profile');
            
            let dataBio = savedBio ? JSON.parse(savedBio) : {};
            let dataProfile = savedProfile ? JSON.parse(savedProfile) : {};

            // Mapear sexo (profile usa 'male'/'female', bio usa 'M'/'F')
            let profileSexo = '';
            if (dataProfile.gender === 'male' || dataProfile.gender === 'M') profileSexo = 'M';
            if (dataProfile.gender === 'female' || dataProfile.gender === 'F') profileSexo = 'F';

            // Priorizar datos de bioimpedancia, y si no hay, usar los del perfil general
            const data = {
                nombre: dataBio.nombre || dataProfile.name || '',
                edad: dataBio.edad || dataProfile.age || '',
                sexo: dataBio.sexo || profileSexo || '',
                peso: dataBio.peso || dataProfile.weight || '',
                altura: dataBio.altura || dataProfile.height || '',
                grasa: dataBio.grasa || '',
                muscular: dataBio.muscular || '',
                visceral: dataBio.visceral || '',
                actividad: dataBio.actividad || dataProfile.actividad || 'moderado',
                tmbInput: dataBio.tmbInput || '',
                imcInput: dataBio.imcInput || '',
                masaGrasaInput: dataBio.masaGrasaInput || '',
                muscularPctInput: dataBio.muscularPctInput || '',
                metricas: dataBio.metricas || null
            };

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
                if (data.tmbInput) document.getElementById('bio-tmb').value = data.tmbInput;
                if (data.imcInput) document.getElementById('bio-imc').value = data.imcInput;
                if (data.masaGrasaInput) document.getElementById('bio-masa-grasa').value = data.masaGrasaInput;
                if (data.muscularPctInput) document.getElementById('bio-porcentaje-muscular').value = data.muscularPctInput;

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

    /**
     * Reparte las calorías en macros coherentes: proteína fija (g), grasa al
     * 25% del TDEE y carbohidratos = calorías restantes. Si los carbohidratos
     * caerían por debajo del 10% (déficit alto / mucha proteína), recorta la
     * grasa hasta un piso del 20% para preservar un mínimo de carbohidratos.
     * Garantiza que proteína*4 + carbohidratos*4 + grasas*9 ≈ calorías.
     */
    function repartirMacros(cal, proteina) {
        const protKcal = proteina * 4;
        let grasaKcal = cal * 0.25;
        let carbKcal = cal - protKcal - grasaKcal;
        const carbMinKcal = cal * 0.10;
        if (carbKcal < carbMinKcal) {
            grasaKcal = Math.max(cal * 0.20, cal - protKcal - carbMinKcal);
            carbKcal = Math.max(0, cal - protKcal - grasaKcal);
        }
        return { carbohidratos: Math.round(carbKcal / 4), grasas: Math.round(grasaKcal / 9) };
    }

    /**
     * Corrige macros incoherentes (P+C+G que no suman las calorías). Conserva
     * proteína y calorías, y recalcula carbohidratos/grasas para cerrar el
     * balance. Devuelve el MISMO objeto si ya está dentro del ±3%.
     */
    function normalizeMacros(m) {
        if (!m || !(m.calorias > 0) || !(m.proteina > 0)) return m;
        const suma = m.proteina * 4 + (m.carbohidratos || 0) * 4 + (m.grasas || 0) * 9;
        if (Math.abs(suma - m.calorias) <= m.calorias * 0.03) return m; // ya cuadra
        const r = repartirMacros(m.calorias, m.proteina);
        return { ...m, carbohidratos: r.carbohidratos, grasas: r.grasas };
    }

    function getDatosCalculados() {
        try {
            const saved = localStorage.getItem('rpCoach_bioimpedancia');
            if (saved) {
                const datos = JSON.parse(saved);
                // Auto-sanado de datos antiguos con macros incoherentes (una sola vez)
                const m = datos?.metricas?.macros;
                if (m) {
                    const norm = normalizeMacros(m);
                    if (norm !== m) {
                        datos.metricas.macros = norm;
                        try { localStorage.setItem('rpCoach_bioimpedancia', JSON.stringify(datos)); } catch (e) { }
                    }
                }
                return datos;
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
