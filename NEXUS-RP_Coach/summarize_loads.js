const fs = require('fs');
const data = JSON.parse(fs.readFileSync('js/data/metodologias_data.json', 'utf8'));

let report = "# Auditoría de Cargas (% RM) por Metodología\n\n";
for (const [key, meth] of Object.entries(data.methodologies)) {
    report += `## ${meth.name}\n`;
    report += `Niveles: ${meth.level.join(', ')}\n\n`;
    report += `| Protocolo | Sets | Reps | Carga (Load) | RPE/RIR |\n`;
    report += `|---|---|---|---|---|\n`;
    meth.protocols.forEach(p => {
        report += `| ${p.name || p.id} | ${p.sets || '-'} | ${p.reps || '-'} | ${p.load || '-'} | ${p.rpe || p.rir || '-'} |\n`;
    });
    report += "\n";
}
fs.writeFileSync('cargas_report.md', report);
console.log('Report generated');
