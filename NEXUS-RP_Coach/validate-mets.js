const fs = require('fs');
const path = './js/data/metodologias_data.json';
try {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    const mets = Object.keys(data.methodologies);
    console.log('Metodologias encontradas en JSON:', mets.length);
    const reqMets = ['Y3T', 'HeavyDuty', 'BloodAndGuts', 'DCTraining', 'RestPause', 'FST7', 'SST', 'MTUT', 'GVT', 'DUP', '531'];

    const missingReq = reqMets.filter(m => !mets.includes(m));
    if (missingReq.length > 0) {
        console.log('Faltan metodologias en JSON:', missingReq.join(', '));
    } else {
        console.log('EXITO Todas las 11 metodologias base estan presentes en el JSON.');
    }

    let hasErrors = false;
    mets.forEach(m => {
        let met = data.methodologies[m];
        if (!met.protocols || met.protocols.length === 0) { console.log(m + ': ERROR FALTAN PROTOCOLOS'); hasErrors = true; }
        if (!met.level || met.level.length === 0) { console.log(m + ': ERROR FALTA NIVEL'); hasErrors = true; }

        met.protocols.forEach(p => {
            if (!p.reps) { console.log(m + ' - ' + p.id + ': Faltan reps'); hasErrors = true; }
            if (!p.sets) { console.log(m + ' - ' + p.id + ': Faltan sets'); hasErrors = true; }
        });
    });

    if (!hasErrors) console.log('EXITO Todas la metodologias tienen la estructura (protocolos, niveles, sets, reps) requerida.');
} catch (e) {
    console.error('Error leyendo JSON:', e.message);
}
