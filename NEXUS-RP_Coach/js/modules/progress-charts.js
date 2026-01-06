/**
 * NEXUS-RP Coach - Gráficas de Progreso con Canvas
 * 
 * Visualización de progreso sin dependencias externas
 */

const ProgressChartsModule = (() => {
    /**
     * Dibuja una gráfica de línea simple
     */
    function drawLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * 2;
        const height = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        const actualWidth = canvas.offsetWidth;
        const actualHeight = canvas.offsetHeight;

        const padding = { top: 20, right: 20, bottom: 30, left: 50 };
        const chartWidth = actualWidth - padding.left - padding.right;
        const chartHeight = actualHeight - padding.top - padding.bottom;

        // Limpiar canvas
        ctx.fillStyle = options.background || '#1A1A2E';
        ctx.fillRect(0, 0, actualWidth, actualHeight);

        if (data.length < 2) {
            ctx.fillStyle = '#B0B0C0';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Necesitas más datos para ver la gráfica', actualWidth / 2, actualHeight / 2);
            return;
        }

        // Calcular rangos
        const values = data.map(d => d.value);
        const minValue = Math.min(...values) * 0.9;
        const maxValue = Math.max(...values) * 1.1;
        const valueRange = maxValue - minValue;

        // Dibujar grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(actualWidth - padding.right, y);
            ctx.stroke();

            // Labels del eje Y
            ctx.fillStyle = '#B0B0C0';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'right';
            const value = maxValue - (valueRange / 4) * i;
            ctx.fillText(value.toFixed(0), padding.left - 5, y + 4);
        }

        // Dibujar línea principal
        ctx.strokeStyle = options.lineColor || '#E040FB';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const points = data.map((d, i) => ({
            x: padding.left + (chartWidth / (data.length - 1)) * i,
            y: padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight
        }));

        ctx.moveTo(points[0].x, points[0].y);
        points.forEach((p, i) => {
            if (i > 0) ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Área bajo la curva (gradiente)
        const gradient = ctx.createLinearGradient(0, padding.top, 0, actualHeight - padding.bottom);
        gradient.addColorStop(0, 'rgba(224, 64, 251, 0.3)');
        gradient.addColorStop(1, 'rgba(224, 64, 251, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, actualHeight - padding.bottom);
        ctx.lineTo(points[0].x, points[0].y);
        points.forEach((p, i) => {
            if (i > 0) ctx.lineTo(p.x, p.y);
        });
        ctx.lineTo(points[points.length - 1].x, actualHeight - padding.bottom);
        ctx.closePath();
        ctx.fill();

        // Puntos
        points.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#E040FB';
            ctx.fill();
            ctx.strokeStyle = '#0D0D1A';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Labels del eje X
            ctx.fillStyle = '#B0B0C0';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(data[i].label || '', p.x, actualHeight - 10);
        });

        // Título
        if (options.title) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(options.title, padding.left, 14);
        }
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

    // API Pública
    return {
        drawLineChart,
        drawProgressBar,
        drawSparkline,
        getProgressDataFromLogs,
        getAutoregulationTrend,
        renderDashboardCharts
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ProgressChartsModule = ProgressChartsModule;
}
