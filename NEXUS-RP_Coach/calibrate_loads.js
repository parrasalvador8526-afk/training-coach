const fs = require('fs');
const data = JSON.parse(fs.readFileSync('js/data/metodologias_data.json', 'utf8'));

let count = 0;
for (const [key, meth] of Object.entries(data.methodologies)) {
    if (meth.protocols) {
        meth.protocols.forEach(p => {
            // Analizar el número máximo de reps en el protocolo
            let repsUpper = 10;
            if (p.reps) {
                // Sacar todos los números del string de reps, ej "12-15 + 4-5"
                const match = p.reps.match(/(\d+)/g);
                if (match && match.length > 0) {
                    repsUpper = Math.max(...match.map(Number));
                }
            }

            // Reglas Fisiológicas de Carga vs Repeticiones
            if (p.reps && p.reps.includes('30+')) {
                p.load = '30-40% 1RM';
                count++;
            } else if (p.name && p.name.includes('Widowmaker') || (repsUpper >= 20 && repsUpper < 30)) {
                // Widowmakers, sets respiratorios gigantes
                p.load = '55-65% 1RM';
                count++;
            } else if (repsUpper >= 15 && repsUpper < 20) {
                p.load = '50-60% 1RM';
                count++;
            } else if (repsUpper >= 8 && repsUpper < 15) {
                if (key === 'GVT') p.load = '60-65% 1RM'; // GVT clásico usa 60%
                else if (key === 'FST7') p.load = '60-70% 1RM'; // Finisher de expansión fascial
                else p.load = '65-75% 1RM';
                count++;
            } else if (repsUpper > 0 && repsUpper < 8) {
                // Especializado en fuerza o alta intensidad
                if (p.load !== '100-120% 1RM' && p.load !== '100-110% 1RM') {
                    p.load = '80-85% 1RM';
                    count++;
                }
            }

            // Excepciones Clínicas Manuales (Excéntricas SupraMáximas)
            if (key === 'HeavyDuty' && p.name && p.name.includes('Negativas')) {
                p.load = '100-120% 1RM'; // Excéntrico puro súper máximo
            }
            if (key === 'BloodAndGuts' && p.name && p.name.includes('Negativas')) {
                p.load = '100-110% 1RM'; // Excéntrico puro
            }
        });
    }
}
fs.writeFileSync('js/data/metodologias_data.json', JSON.stringify(data, null, 2));
console.log(`Re-calibrated ${count} load parameters in methodologies JSON based on physiological rep ranges.`);
