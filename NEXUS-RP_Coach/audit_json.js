const fs = require('fs');
const data = JSON.parse(fs.readFileSync('js/data/metodologias_data.json', 'utf8'));

let count = 0;
const methodologies = data.methodologies;

for (const [key, method] of Object.entries(methodologies)) {
    if (method.protocols) {
        method.protocols.forEach(protocol => {
            if (!protocol.tempo) {
                if (key === 'FST7') protocol.tempo = '2-0-2-0';
                else if (key === 'HeavyDuty') protocol.tempo = '4-1-4-1';
                else if (key === 'BloodAndGuts') protocol.tempo = '2-1-2-1';
                else if (key === 'SST') protocol.tempo = '3-1-3-0';
                else if (key === 'Y3T') protocol.tempo = '2-0-2-0';
                else protocol.tempo = '2-0-2-0';
                count++;
            }
            if (!protocol.load) {
                protocol.load = '70-80% 1RM';
                count++;
            }
            if (!protocol.tut) {
                protocol.tut = '40-60s';
                count++;
            }
            if (!protocol.rir && !protocol.rpe && !protocol.failures) {
                protocol.rpe = '8-9';
                count++;
            }
        });
    }
}
fs.writeFileSync('js/data/metodologias_data.json', JSON.stringify(data, null, 2));
console.log(`Patched ${count} missing parameters in methodologies JSON.`);
