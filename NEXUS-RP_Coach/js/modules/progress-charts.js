/**
 * NEXUS-RP Coach - Gráficas de Progreso con Canvas
 * 
 * Visualización de progreso sin dependencias externas
 */

const ProgressChartsModule = (() => {
    // Instancias activas de Chart.js para evitar overlaps
    window._rpChartInstances = window._rpChartInstances || {};

    /**
     * Dibuja una gráfica de línea usando Chart.js
     */
    function drawLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        if (window._rpChartInstances[canvasId]) {
            window._rpChartInstances[canvasId].destroy();
        }

        if (data.length < 2) {
            const ctx = canvas.getContext('2d');
            const cw = canvas.width = canvas.offsetWidth;
            const ch = canvas.height = canvas.offsetHeight;
            ctx.fillStyle = options.background || '#1A1A2E';
            ctx.fillRect(0, 0, cw, ch);
            ctx.fillStyle = '#B0B0C0';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Necesitas más datos para ver la gráfica', cw / 2, ch / 2);
            return;
        }

        const ctx = canvas.getContext('2d');
        const labels = data.map(d => d.label || '');
        const values = data.map(d => d.value);

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 300);
        gradient.addColorStop(0, (options.lineColor || '#E040FB') + '80'); // 50% opacity
        gradient.addColorStop(1, (options.lineColor || '#E040FB') + '00'); // 0% opacity

        window._rpChartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: options.title || '',
                    data: values,
                    borderColor: options.lineColor || '#E040FB',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#0D0D1A',
                    pointBorderColor: options.lineColor || '#E040FB',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                color: '#B0B0C0',
                plugins: {
                    legend: {
                        display: !!options.title,
                        labels: { color: '#FFF', font: { family: 'Inter', size: 12, weight: 'bold' } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(13, 13, 26, 0.9)',
                        titleColor: '#E040FB',
                        bodyColor: '#FFF',
                        borderColor: 'rgba(224, 64, 251, 0.4)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#888', font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#888', font: { family: 'Inter', size: 10 } }
                    }
                }
            }
        });
    }

    /**
     * Dibuja una barra de progreso horizontal
     */
    function drawProgressBar(canvasId, current, max, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * 2;
        const height = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        const actualWidth = canvas.offsetWidth;
        const actualHeight = canvas.offsetHeight;

        const percentage = Math.min(current / max, 1);
        const barHeight = 20;
        const y = (actualHeight - barHeight) / 2;

        // Fondo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.roundRect(0, y, actualWidth, barHeight, 10);
        ctx.fill();

        // Barra de progreso
        const gradient = ctx.createLinearGradient(0, 0, actualWidth * percentage, 0);
        gradient.addColorStop(0, '#7C4DFF');
        gradient.addColorStop(1, '#E040FB');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, y, actualWidth * percentage, barHeight, 10);
        ctx.fill();

        // Texto
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${current} / ${max}`, actualWidth / 2, actualHeight / 2 + 4);
    }

    /**
     * Dibuja un mini gráfico sparkline
     */
    function drawSparkline(canvasId, data, color = '#E040FB') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * 2;
        const height = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        const actualWidth = canvas.offsetWidth;
        const actualHeight = canvas.offsetHeight;

        if (data.length < 2) return;

        const minValue = Math.min(...data);
        const maxValue = Math.max(...data);
        const range = maxValue - minValue || 1;

        const padding = 4;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        data.forEach((value, i) => {
            const x = padding + ((actualWidth - padding * 2) / (data.length - 1)) * i;
            const y = actualHeight - padding - ((value - minValue) / range) * (actualHeight - padding * 2);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Punto final
        const lastX = actualWidth - padding;
        const lastY = actualHeight - padding - ((data[data.length - 1] - minValue) / range) * (actualHeight - padding * 2);
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    /**
     * Genera datos de progreso desde el historial de sesiones
     */
    function getProgressDataFromLogs(exerciseName, metric = 'weight') {
        if (typeof SessionLoggerModule === 'undefined') return [];

        const logs = SessionLoggerModule.getLogsByExercise(exerciseName);
        if (logs.length === 0) return [];

        return logs.slice(-10).map(log => {
            let value = 0;
            if (metric === 'weight') {
                value = Math.max(...log.sets.map(s => s.weight));
            } else if (metric === 'volume') {
                value = log.totalVolume;
            } else if (metric === 'reps') {
                value = Math.max(...log.sets.map(s => s.reps));
            }

            return {
                value,
                label: log.dateFormatted.split(' ')[0],
                date: log.date
            };
        });
    }

    /**
     * Genera datos de autorregulación
     */
    function getAutoregulationTrend() {
        if (typeof AutoregulationModule === 'undefined') return [];

        const history = AutoregulationModule.getEvaluationHistory();
        return history.slice(-7).map(entry => ({
            value: 10 - ((entry.scores.fatigue + entry.scores.soreness) / 2),
            label: new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short' }),
            date: entry.date
        }));
    }

    /**
     * Renderiza el dashboard de gráficas
     */
    function renderDashboardCharts(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="charts-grid">
                <div class="chart-card">
                    <h4 class="chart-title">📈 Tendencia de Recuperación</h4>
                    <canvas id="chart-recovery" class="chart-canvas"></canvas>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">🏋️ Progreso de Fuerza</h4>
                    <canvas id="chart-strength" class="chart-canvas"></canvas>
                </div>
            </div>
        `;

        // Renderizar gráficas después de que el DOM se actualice
        setTimeout(() => {
            const recoveryData = getAutoregulationTrend();
            drawLineChart('chart-recovery', recoveryData, {
                title: '',
                lineColor: '#00BFA5'
            });

            // Obtener el ejercicio más frecuente
            const logs = SessionLoggerModule ? SessionLoggerModule.getAllLogs() : [];
            if (logs.length > 0) {
                const exercises = {};
                logs.forEach(log => {
                    exercises[log.exercise] = (exercises[log.exercise] || 0) + 1;
                });
                const topExercise = Object.entries(exercises).sort((a, b) => b[1] - a[1])[0]?.[0];

                if (topExercise) {
                    const strengthData = getProgressDataFromLogs(topExercise, 'weight');
                    drawLineChart('chart-strength', strengthData, {
                        title: topExercise,
                        lineColor: '#E040FB'
                    });
                }
            }
        }, 100);
    }

    /**
     * Dibuja gráfica de progreso del Mesociclo (Volumen, Intensidad, Esfuerzo) TEÓRICA
     */
    function drawMesocycleProgressionChart(canvasId, methodology = 'Y3T', level = 'intermediate') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;

        const actualWidth = container.offsetWidth || 600;
        const actualHeight = container.offsetHeight || 220;

        canvas.width = actualWidth * 2;
        canvas.height = actualHeight * 2;
        ctx.scale(2, 2);

        const padding = { top: 30, right: 30, bottom: 40, left: 40 };
        const chartW = actualWidth - padding.left - padding.right;
        const chartH = actualHeight - padding.top - padding.bottom;

        const bgGradient = ctx.createLinearGradient(0, 0, 0, actualHeight);
        bgGradient.addColorStop(0, '#1A1A2E');
        bgGradient.addColorStop(1, '#151525');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, actualWidth, actualHeight);

        const labels = ['S1 (Base)', 'S2 (Prog)', 'S3 (Int)', 'S4 (Peak)', 'S5 (Deload)'];

        let renderData = null;
        if (typeof WorkoutUIController !== 'undefined' && typeof WorkoutUIController.getMesocycleRenderData === 'function') {
            renderData = WorkoutUIController.getMesocycleRenderData(methodology, level);
        }

        if (!renderData) {
            renderData = {
                volData: [40, 60, 80, 100, 20],
                effData: [40, 60, 80, 100, 10],
                intData: [60, 70, 85, 100, 50],
                rawSets: [3, 4, 3, 2, 1]
            };
        }

        const datasets = [
            { label: 'Volumen', color: '#3B82F6', data: renderData.volData },
            { label: 'Esfuerzo', color: '#EF4444', data: renderData.effData },
            { label: 'Intensidad', color: '#F59E0B', data: renderData.intData }
        ];

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            let y = padding.top + (chartH / 4) * i;
            ctx.moveTo(padding.left, y);
            ctx.lineTo(actualWidth - padding.right, y);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, actualHeight - padding.bottom);
        ctx.lineTo(actualWidth - padding.right, actualHeight - padding.bottom);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = '600 12px Inter, sans-serif';
        const legendTotalW = datasets.length * 110;
        const legendStartX = (actualWidth - legendTotalW) / 2 + 10;

        datasets.forEach((ds, i) => {
            let x = legendStartX + (i * 110);
            let y = 18;
            ctx.fillStyle = ds.color;
            ctx.beginPath();
            ctx.roundRect(x, y - 10, 14, 14, 3);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(ds.label, x + 22, y + 2);
        });

        datasets.forEach((ds) => {
            ctx.strokeStyle = ds.color;
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowColor = ds.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();

            let points = [];
            ds.data.forEach((val, i) => {
                let x = padding.left + (chartW / 4) * i;
                let y = padding.top + chartH - (val / 100) * chartH;
                points.push({ x, y });
            });

            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();

            ctx.shadowBlur = 0;

            points.forEach((p, i) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = ds.color;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#0F0F1A';
                ctx.fill();
            });
        });

        datasets.forEach((ds) => {
            let points = [];
            ds.data.forEach((val, i) => {
                let x = padding.left + (chartW / 4) * i;
                let y = padding.top + chartH - (val / 100) * chartH;
                points.push({ x, y });
            });

            points.forEach((p, i) => {
                if (ds.label === 'Volumen' && renderData && renderData.rawSets) {
                    const text = `${renderData.rawSets[i]} sets`;
                    ctx.font = '700 10.5px Inter, sans-serif';
                    const tw = ctx.measureText(text).width;

                    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
                    ctx.beginPath();
                    ctx.roundRect(p.x - tw / 2 - 6, p.y - 28, tw + 12, 18, 4);
                    ctx.fill();

                    ctx.fillStyle = '#60A5FA';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, p.x, p.y - 19);
                }

                if (ds.label === 'Esfuerzo' && renderData && renderData.effData) {
                    let rirScore = renderData.effData[i];
                    let rirText = 'RIR 3';
                    if (rirScore >= 100) rirText = 'FALLO';
                    else if (rirScore >= 85) rirText = 'RIR 1';
                    else if (rirScore >= 65) rirText = 'RIR 2';
                    else if (rirScore <= 20) rirText = 'Recup.';

                    ctx.font = '700 9px Inter, sans-serif';
                    const tw = ctx.measureText(rirText).width;

                    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
                    ctx.beginPath();
                    ctx.roundRect(p.x - tw / 2 - 6, p.y + 12, tw + 12, 16, 4);
                    ctx.fill();

                    ctx.fillStyle = '#F87171';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(rirText, p.x, p.y + 20);
                }
            });
        });

        ctx.fillStyle = '#C0C0D0';
        ctx.font = '500 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        labels.forEach((text, i) => {
            let x = padding.left + (chartW / 4) * i;
            ctx.fillText(text, x, actualHeight - 15);
        });
    }

    /**
     * Dibuja gráfica de progreso del Mesociclo (CUMPLIMIENTO REAL)
     */
    function drawComplianceProgressionChart(canvasId, methodology = 'Y3T', level = 'intermediate') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;

        // Si el contenedor mide 0 (porque la pestaña está oculta), usa sus dimensiones por CSS
        const actualWidth = container.offsetWidth || 600;
        const actualHeight = container.offsetHeight || 220;

        canvas.width = actualWidth * 2;
        canvas.height = actualHeight * 2;
        ctx.scale(2, 2);

        const padding = { top: 30, right: 30, bottom: 40, left: 40 };
        const chartW = actualWidth - padding.left - padding.right;
        const chartH = actualHeight - padding.top - padding.bottom;

        // Limpiar con fondo premium
        const bgGradient = ctx.createLinearGradient(0, 0, 0, actualHeight);
        bgGradient.addColorStop(0, '#1A1A2E');
        bgGradient.addColorStop(1, '#151525');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, actualWidth, actualHeight);

        const labels = ['S1 (Base)', 'S2 (Prog)', 'S3 (Int)', 'S4 (Peak)', 'S5 (Deload)'];

        // Extraer los datos teóricos de la metodología
        let renderData = null;
        if (typeof WorkoutUIController !== 'undefined' && typeof WorkoutUIController.getMesocycleRenderData === 'function') {
            renderData = WorkoutUIController.getMesocycleRenderData(methodology, level);
        }

        // Fallback robusto
        if (!renderData) {
            renderData = {
                volData: [40, 60, 80, 100, 20],
                effData: [40, 60, 80, 100, 10],
                intData: [60, 70, 85, 100, 50],
                rawSets: [3, 4, 3, 2, 1]
            };
        }

        // === NUEVO LÓGICO DE CUMPLIMIENTO (COMPLIANCE) ===
        // 1. Deducir cuántos días a la semana tiene la rutina actual
        let targetSessionsPerWeek = 4; // default
        try {
            const savedRoutine = localStorage.getItem('rpCoach_currentRoutine');
            if (savedRoutine) {
                const routine = JSON.parse(savedRoutine);
                if (routine.days && routine.days.length) {
                    targetSessionsPerWeek = routine.days.length;
                }
            }
        } catch (e) { }

        // 2. Extraer sesiones y agrupar por mesocycleWeek
        let complianceRatios = [0, 0, 0, 0, 0]; // S1 a S5

        // Fuente principal: rpCoach_session_history (usado por CalendarioTracker y ProgressAnalytics)
        let sessionData = [];
        try {
            sessionData = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]');
        } catch (e) { }

        // Fallback: SessionLoggerModule si no hay datos en session_history
        if (sessionData.length === 0 && typeof SessionLoggerModule !== 'undefined') {
            const allLogs = SessionLoggerModule.getAllLogs();
            if (allLogs.length > 0) {
                sessionData = allLogs.map(log => ({
                    date: log.date || log.dateFormatted,
                    mesocycleWeek: parseInt(log.weekNumber) || 1
                }));
            }
        }

        if (sessionData.length > 0) {
            // Contar días únicos de entrenamiento por semana del mesociclo
            const uniqueDaysPerWeek = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
            sessionData.forEach(session => {
                const w = parseInt(session.mesocycleWeek);
                if (w >= 1 && w <= 5) {
                    const dateKey = session.date ? new Date(session.date).toISOString().split('T')[0] : session.dateFormatted;
                    if (dateKey) uniqueDaysPerWeek[w].add(dateKey);
                }
            });

            for (let w = 1; w <= 5; w++) {
                const completedDays = uniqueDaysPerWeek[w].size;
                complianceRatios[w - 1] = Math.min(completedDays / targetSessionsPerWeek, 1.0);
            }
        }

        // 3. Multiplicar Data por Compliance Ratio
        const actualVolData = renderData.volData.map((val, i) => val * complianceRatios[i]);
        const actualEffData = renderData.effData.map((val, i) => val * complianceRatios[i]);
        const actualIntData = renderData.intData.map((val, i) => val * complianceRatios[i]);

        const datasets = [
            { label: 'Volumen', color: '#3B82F6', data: actualVolData, rawSets: renderData.rawSets, theoryEff: renderData.effData, ratio: complianceRatios },
            { label: 'Esfuerzo', color: '#EF4444', data: actualEffData, ratio: complianceRatios },
            { label: 'Intensidad', color: '#F59E0B', data: actualIntData, ratio: complianceRatios }
        ];

        // Grid Y refinado (Líneas sutiles)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            let y = padding.top + (chartH / 4) * i;
            ctx.moveTo(padding.left, y);
            ctx.lineTo(actualWidth - padding.right, y);
        }
        ctx.stroke();

        // Ejes X / Y (Lineas base sólidas)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, actualHeight - padding.bottom);
        ctx.lineTo(actualWidth - padding.right, actualHeight - padding.bottom);
        ctx.stroke();

        // Leyenda SUPERIOR (fuera de la malla para evitar bloqueos)
        ctx.textAlign = 'left';
        ctx.font = '600 12px Inter, sans-serif'; // Texto más legible
        const legendTotalW = datasets.length * 110;
        const legendStartX = (actualWidth - legendTotalW) / 2 + 10;

        datasets.forEach((ds, i) => {
            let x = legendStartX + (i * 110);
            let y = 18; // Pegarlo al techo

            ctx.fillStyle = ds.color;
            ctx.beginPath();
            ctx.roundRect(x, y - 10, 14, 14, 3); // Botón de color
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(ds.label, x + 22, y + 2); // Texto más legible
        });

        // Dibujar curvas con Neon Glow
        datasets.forEach((ds) => {
            ctx.strokeStyle = ds.color;
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowColor = ds.color;
            ctx.shadowBlur = 8; // Efecto Neon premium
            ctx.beginPath();

            let points = [];
            ds.data.forEach((val, i) => {
                let x = padding.left + (chartW / 4) * i;
                let y = padding.top + chartH - (val / 100) * chartH;
                points.push({ x, y });
            });

            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();

            // Desactivar sombra para puntos
            ctx.shadowBlur = 0;

            // Dibujar Puntos Intersección Premium
            points.forEach((p, i) => {
                // Ribete externo
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = ds.color;
                ctx.fill();

                // Centro oscuro
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#0F0F1A';
                ctx.fill();
            });
        });

        // === CAPA SUPERIOR (Z-INDEX): Etiquetas y Datos Duros ===
        // Se dibujan al final para garantizar que ninguna línea de otro dataset pase por encima (encimado)
        datasets.forEach((ds) => {
            let points = [];
            ds.data.forEach((val, i) => {
                let x = padding.left + (chartW / 4) * i;
                let y = padding.top + chartH - (val / 100) * chartH;
                points.push({ x, y });
            });

            points.forEach((p, i) => {
                // Solo mostrar la etiqueta si el cumplimiento > 0 para que no floten en el aire
                if (ds.ratio && ds.ratio[i] === 0) return;

                // Etiqueta de Volumen (Arriba)
                if (ds.label === 'Volumen' && ds.rawSets) {
                    const fracSets = (ds.rawSets[i] * ds.ratio[i]).toFixed(1).replace('.0', '');
                    const text = `${fracSets} sets`;
                    ctx.font = '700 10.5px Inter, sans-serif';
                    const tw = ctx.measureText(text).width;

                    // Fondo tipo cápsula (Pill) para asegurar legibilidad
                    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)'; // Color de fondo oscuro con ligera transparencia
                    ctx.beginPath();
                    ctx.roundRect(p.x - tw / 2 - 6, p.y - 28, tw + 12, 18, 4);
                    ctx.fill();

                    // Texto Premium Neon
                    ctx.fillStyle = '#60A5FA';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, p.x, p.y - 19);
                }

                // Etiqueta de Esfuerzo/RIR (Abajo)
                if (ds.label === 'Esfuerzo' && datasets[0].theoryEff) {
                    // Calculamos el texto del RIR basado en el esfuerzo REQUERIDO, 
                    // pero solo si lo estamos cumpliendo
                    let rirScore = datasets[0].theoryEff[i]; // Theoretical intended effort 
                    let rirText = 'RIR 3';
                    if (rirScore >= 100) rirText = 'FALLO';
                    else if (rirScore >= 85) rirText = 'RIR 1';
                    else if (rirScore >= 65) rirText = 'RIR 2';
                    else if (rirScore <= 20) rirText = 'Recup.';

                    // Append percentage completed
                    let completedPct = Math.round(ds.ratio[i] * 100) + '%';
                    let fullText = `${rirText} (${completedPct})`;

                    ctx.font = '700 9px Inter, sans-serif';
                    const tw = ctx.measureText(fullText).width;

                    // Fondo cápsula (Pill)
                    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
                    ctx.beginPath();
                    ctx.roundRect(p.x - tw / 2 - 6, p.y + 12, tw + 12, 16, 4);
                    ctx.fill();

                    // Texto Rojo Neon
                    ctx.fillStyle = '#F87171';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(fullText, p.x, p.y + 20);
                }
            });
        });

        // Eje X Labels - Inferiores, más grandes y legibles
        ctx.fillStyle = '#C0C0D0';
        ctx.font = '500 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        labels.forEach((text, i) => {
            let x = padding.left + (chartW / 4) * i;
            ctx.fillText(text, x, actualHeight - 15);
        });
    }

    function _unused_drawStrengthProgressionChart(canvasId) { // eslint-disable-line
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        const W = container.offsetWidth || 700;
        const H = container.offsetHeight || 260;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        // Fondo
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#1A1A2E');
        bgGrad.addColorStop(1, '#151525');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Obtener datos de sesiones
        let sessions = [];
        try { sessions = JSON.parse(localStorage.getItem('rpCoach_session_history') || '[]'); } catch { }
        if (!sessions.length) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '500 13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sin datos de sesiones para graficar', W / 2, H / 2);
            return;
        }

        // Calcular e1RM por ejercicio por semana
        const e1rmByExercise = {}; // {exercise: {1: e1rm, 2: e1rm, ...}}
        sessions.forEach(s => {
            const week = parseInt(s.mesocycleWeek);
            if (!week || week < 1 || week > 5) return;
            (s.exercises || []).forEach(ex => {
                if (!ex.weight || !ex.reps) return;
                const e1rm = ex.reps === 1 ? ex.weight : Math.round(ex.weight * (1 + ex.reps / 30) * 10) / 10;
                if (!e1rmByExercise[ex.name]) e1rmByExercise[ex.name] = {};
                // Guardar el máximo e1RM de la semana
                if (!e1rmByExercise[ex.name][week] || e1rm > e1rmByExercise[ex.name][week]) {
                    e1rmByExercise[ex.name][week] = e1rm;
                }
            });
        });

        // Seleccionar top 6 ejercicios por e1RM máximo (compuestos pesados)
        const exerciseMax = {};
        Object.entries(e1rmByExercise).forEach(([name, weekData]) => {
            exerciseMax[name] = Math.max(...Object.values(weekData));
        });
        const topExercises = Object.entries(exerciseMax)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(e => e[0]);

        if (!topExercises.length) return;

        // Semanas con datos
        const allWeeks = new Set();
        topExercises.forEach(ex => {
            Object.keys(e1rmByExercise[ex]).forEach(w => allWeeks.add(parseInt(w)));
        });
        const weekNumbers = [...allWeeks].sort((a, b) => a - b);
        if (weekNumbers.length < 1) return;

        // Colores para cada ejercicio
        const palette = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

        // Calcular rango Y
        let globalMin = Infinity, globalMax = 0;
        topExercises.forEach(ex => {
            weekNumbers.forEach(w => {
                const val = e1rmByExercise[ex][w];
                if (val) {
                    globalMin = Math.min(globalMin, val);
                    globalMax = Math.max(globalMax, val);
                }
            });
        });
        // Padding del rango
        const range = globalMax - globalMin || 10;
        const yMin = Math.max(0, globalMin - range * 0.15);
        const yMax = globalMax + range * 0.15;

        const pad = { top: 45, right: 20, bottom: 40, left: 50 };
        const cW = W - pad.left - pad.right;
        const cH = H - pad.top - pad.bottom;

        const xStep = weekNumbers.length > 1 ? cW / (weekNumbers.length - 1) : cW / 2;
        const getX = (i) => pad.left + xStep * i;
        const getY = (val) => pad.top + cH - ((val - yMin) / (yMax - yMin)) * cH;

        // Grid horizontal
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = pad.top + (cH / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();

            // Etiqueta Y
            const val = yMax - ((yMax - yMin) / gridLines) * i;
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font = '400 10px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(val) + 'kg', pad.left - 6, y + 4);
        }

        // Ejes
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top);
        ctx.lineTo(pad.left, H - pad.bottom);
        ctx.lineTo(W - pad.right, H - pad.bottom);
        ctx.stroke();

        // Etiquetas X
        ctx.fillStyle = '#C0C0D0';
        ctx.font = '500 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        const weekLabels = { 1: 'S1', 2: 'S2', 3: 'S3', 4: 'S4', 5: 'S5' };
        weekNumbers.forEach((w, i) => {
            ctx.fillText(weekLabels[w] || 'S' + w, getX(i), H - pad.bottom + 18);
        });

        // Leyenda superior
        ctx.font = '600 10px Inter, sans-serif';
        const legendItemW = cW / Math.min(topExercises.length, 6);
        topExercises.forEach((ex, i) => {
            const shortName = ex.length > 18 ? ex.substring(0, 16) + '…' : ex;
            const lx = pad.left + legendItemW * i;
            const ly = 14;

            ctx.fillStyle = palette[i];
            ctx.beginPath();
            ctx.roundRect(lx, ly - 6, 10, 10, 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.textAlign = 'left';
            ctx.fillText(shortName, lx + 14, ly + 3);
        });

        // Dibujar líneas y puntos por ejercicio
        topExercises.forEach((ex, exIdx) => {
            const color = palette[exIdx];
            const weekData = e1rmByExercise[ex];
            const points = [];

            weekNumbers.forEach((w, i) => {
                if (weekData[w]) {
                    points.push({ x: getX(i), y: getY(weekData[w]), val: weekData[w], week: w });
                }
            });

            if (points.length < 1) return;

            // Línea con glow
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowColor = color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Puntos
            points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#0F0F1A';
                ctx.fill();
            });

            // Etiqueta en el último punto (e1RM actual)
            if (points.length >= 1) {
                const last = points[points.length - 1];
                const first = points[0];
                const diff = last.val - first.val;
                const diffPct = first.val > 0 ? ((diff / first.val) * 100).toFixed(1) : '0';
                const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
                const diffColor = diff > 0 ? '#10B981' : diff < 0 ? '#EF4444' : '#F59E0B';

                const text = `${last.val}kg`;
                const diffText = points.length > 1 ? ` ${arrow}${diff > 0 ? '+' : ''}${diffPct}%` : '';

                ctx.font = '700 9px Inter, sans-serif';
                const tw = ctx.measureText(text + diffText).width;

                // Posicionar etiqueta: alternar arriba/abajo según índice para evitar overlap
                const offsetY = exIdx % 2 === 0 ? -18 : 16;
                const labelY = last.y + offsetY;

                ctx.fillStyle = 'rgba(15,15,26,0.88)';
                ctx.beginPath();
                ctx.roundRect(last.x - tw / 2 - 5, labelY - 8, tw + 10, 16, 3);
                ctx.fill();

                ctx.textAlign = 'center';
                ctx.fillStyle = color;
                ctx.fillText(text, last.x - (diffText ? ctx.measureText(diffText).width / 2 : 0), labelY + 3);

                if (diffText) {
                    ctx.fillStyle = diffColor;
                    ctx.fillText(diffText, last.x + ctx.measureText(text).width / 2 + 2, labelY + 3);
                }
            }
        });
    }

    /**
     * Gráfica de Composición Corporal — 2 líneas: % Grasa y Masa Muscular (Chart.js)
     */
    function drawBodyCompositionChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        if (window._rpChartInstances[canvasId]) {
            window._rpChartInstances[canvasId].destroy();
        }

        const data = JSON.parse(localStorage.getItem('rpCoach_body_composition') || 'null');
        if (!data || !data.measurements || data.measurements.length < 2) {
            const ctx = canvas.getContext('2d');
            const cw = canvas.width = canvas.offsetWidth;
            const ch = canvas.height = canvas.offsetHeight;
            ctx.fillStyle = '#1A1A2E';
            ctx.fillRect(0, 0, cw, ch);
            ctx.fillStyle = '#888';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Se necesitan al menos 2 mediciones', cw / 2, ch / 2);
            return;
        }

        const measurements = data.measurements;
        const ctx = canvas.getContext('2d');

        const labels = measurements.map(m => {
            const d = new Date(m.date);
            return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        });
        const fatVals = measurements.map(m => Number(m.bodyFat).toFixed(1));
        const muscleVals = measurements.map(m => Number(m.muscleMass).toFixed(1));

        window._rpChartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '% Grasa',
                        data: fatVals,
                        borderColor: '#F97316',
                        backgroundColor: '#F9731633',
                        yAxisID: 'y',
                        borderWidth: 3,
                        pointBackgroundColor: '#1A1A2E',
                        pointBorderColor: '#F97316',
                        pointRadius: 4,
                        tension: 0.3
                    },
                    {
                        label: 'Masa Muscular (kg)',
                        data: muscleVals,
                        borderColor: '#10B981',
                        backgroundColor: '#10B98133',
                        yAxisID: 'y1',
                        borderWidth: 3,
                        pointBackgroundColor: '#1A1A2E',
                        pointBorderColor: '#10B981',
                        pointRadius: 4,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                color: '#B0B0C0',
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        labels: { color: '#FFF', font: { family: 'Inter', size: 11, weight: 'bold' } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(13, 13, 26, 0.9)',
                        titleColor: '#FFF',
                        bodyColor: '#FFF',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#888', font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#F97316', font: { family: 'Inter', size: 10 }, callback: function (value) { return Number(value).toFixed(1) + '%'; } }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#10B981', font: { family: 'Inter', size: 10 }, callback: function (value) { return Number(value).toFixed(1) + 'kg'; } }
                    }
                }
            }
        });
    }

    // API Pública
    return {
        drawLineChart,
        drawProgressBar,
        drawSparkline,
        getProgressDataFromLogs,
        getAutoregulationTrend,
        renderDashboardCharts,
        drawMesocycleProgressionChart,
        drawComplianceProgressionChart,
        drawBodyCompositionChart
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ProgressChartsModule = ProgressChartsModule;
}
