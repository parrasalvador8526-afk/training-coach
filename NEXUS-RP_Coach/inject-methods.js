const fs = require('fs');
const pathJSON1 = './js/data/metodologias_data.json';
const pathJSON2 = '../Metodos creados HTML/metodologias_data.json';

const newMets = {
    "DCTraining": {
        "id": "DC",
        "name": "DC Training (Doggcrapp)",
        "creator": "Dante Trudel",
        "level": ["Avanzado"],
        "philosophy": "Bajo volumen, altísima intensidad, Rest-Pause",
        "sessionDuration": "40-60 min",
        "frequency": "3 días/semana",
        "volume": "Muy Bajo",
        "intensity": "Extrema",
        "requiresSpotter": true,
        "protocols": [
            {
                "id": "DC-RP",
                "name": "DC Rest-Pause Set",
                "description": "Un solo working set extendido con rest-pauses (11-15 total reps)",
                "reps": "Varies",
                "sets": "1",
                "rest": "15s (micro)",
                "rpe": "10",
                "tut": "Varies",
                "load": "75-85% 1RM"
            },
            {
                "id": "DC-STR",
                "name": "Extreme Stretching",
                "description": "Estiramiento bajo carga pesada (60-90s) post ejercicio",
                "reps": "1 (Hold)",
                "sets": "1",
                "rest": "0",
                "rpe": "10",
                "tut": "60-90s",
                "load": "Pesado"
            },
            {
                "id": "DC-WM",
                "name": "Widowmaker",
                "description": "Serie única de 20 repeticiones para piernas al fallo",
                "reps": "20",
                "sets": "1",
                "rest": "180s",
                "rpe": "10",
                "tut": "90-120s"
            }
        ],
        "compatibleWith": ["RestPause"],
        "incompatibleWith": ["Y3T", "GVT", "FST7"],
        "warmup": { "set1": "30% x 10 reps", "set2": "50% x 6 reps", "set3": "70% x 3 reps" },
        "deload": { "frequency": "Cada 4-6 semanas", "duration": "1 semana (cruising)", "intensity": "50%" },
        "timerConfig": { "restPause": { "rest": 15 }, "extremeStretch": { "time": 90 } }
    },
    "GVT": {
        "id": "GVT",
        "name": "GVT (German Volume Training)",
        "creator": "Charles Poliquin",
        "level": ["Intermedio", "Avanzado"],
        "philosophy": "10 series de 10 reps, hipertrofia sarcoplasmática brutal",
        "sessionDuration": "60-70 min",
        "frequency": "3 días/semana",
        "volume": "Muy Alto",
        "intensity": "Moderada",
        "requiresSpotter": false,
        "protocols": [
            {
                "id": "GVT-10x10",
                "name": "10x10 Clásico",
                "description": "10 series de 10 repeticiones con el 60% del 1RM",
                "reps": "10",
                "sets": "10",
                "rest": "60-90s",
                "rpe": "8-9",
                "tut": "v",
                "load": "60% 1RM",
                "tempo": "4-0-2"
            }
        ],
        "compatibleWith": [],
        "incompatibleWith": ["Heavy Duty", "DCTraining"],
        "warmup": { "general": "Movilidad ligera", "set1": "10 reps con la barra sola" },
        "deload": { "frequency": "No aplicable", "duration": "La rutina total dura 4-6 semanas" },
        "timerConfig": { "betweenSets": { "rest": 90 } }
    },
    "DUP": {
        "id": "DUP",
        "name": "Periodización Ondulatoria Diaria",
        "creator": "Dr. Zourdos",
        "level": ["Intermedio", "Avanzado"],
        "philosophy": "Cambio diario del volumen e intensidad en los mismos lifts",
        "sessionDuration": "60-90 min",
        "frequency": "3-5 días/semana",
        "volume": "Moderado-Alto",
        "intensity": "Variable",
        "requiresSpotter": true,
        "protocols": [
            {
                "id": "DUP-HYP",
                "name": "Día Hipertrofia",
                "description": "Día de volumen alto, intensidad moderada",
                "reps": "8-12",
                "sets": "3-4",
                "rest": "90s",
                "rpe": "8",
                "tut": "v",
                "load": "70% 1RM"
            },
            {
                "id": "DUP-STR",
                "name": "Día Fuerza",
                "description": "Día de volumen bajo, intensidad alta",
                "reps": "3-5",
                "sets": "4-5",
                "rest": "180s",
                "rpe": "9",
                "tut": "v",
                "load": "85% 1RM"
            },
            {
                "id": "DUP-POW",
                "name": "Día Potencia",
                "description": "Mover pesos submáximos lo más rápido posible",
                "reps": "1-3",
                "sets": "4-6",
                "rest": "120s",
                "rpe": "7",
                "tut": "v",
                "load": "80% 1RM",
                "tempo": "Explosivo"
            }
        ],
        "compatibleWith": ["531"],
        "incompatibleWith": ["GVT", "Heavy Duty"],
        "warmup": { "general": "Series progresivas estándar para el compuesto del día" },
        "deload": { "frequency": "Cada 4 semanas", "intensity": "Reducida en fuerza" },
        "timerConfig": { "hypertrophy": { "rest": 90 }, "strength": { "rest": 180 } }
    },
    "531": {
        "id": "531",
        "name": "5/3/1",
        "creator": "Jim Wendler",
        "level": ["Intermedio", "Avanzado"],
        "philosophy": "Fuerza y progresiones a largo plazo lentas y constantes",
        "sessionDuration": "45-60 min",
        "frequency": "3-4 días/semana",
        "volume": "Mínimo/Moderado",
        "intensity": "Alta a submáxima",
        "requiresSpotter": true,
        "protocols": [
            {
                "id": "531-W1",
                "name": "Semana 5's",
                "description": "Target de 5 reps + repeticiones extra al AMRAP",
                "reps": "5, 5, 5+",
                "sets": "3",
                "rest": "120-180s",
                "rpe": "8-9",
                "tut": "-",
                "load": "65%, 75%, 85%"
            },
            {
                "id": "531-W2",
                "name": "Semana 3's",
                "description": "Target de 3 reps + AMRAP",
                "reps": "3, 3, 3+",
                "sets": "3",
                "rest": "120-180s",
                "rpe": "9",
                "tut": "-",
                "load": "70%, 80%, 90%"
            },
            {
                "id": "531-W3",
                "name": "Semana 5/3/1",
                "description": "Target de 1 rep pesada + AMRAP",
                "reps": "5, 3, 1+",
                "sets": "3",
                "rest": "180s+",
                "rpe": "10",
                "tut": "-",
                "load": "75%, 85%, 95%"
            },
            {
                "id": "531-BBB",
                "name": "Boring But Big (Accesorio)",
                "description": "5 series de 10 reps del compuesto vital",
                "reps": "10",
                "sets": "5",
                "rest": "90s",
                "rpe": "7-8",
                "tut": "-",
                "load": "50-60%"
            }
        ],
        "compatibleWith": ["DUP"],
        "incompatibleWith": ["FST7", "GVT"],
        "warmup": { "set1": "40% x 5", "set2": "50% x 5", "set3": "60% x 3" },
        "deload": { "frequency": "Semana 4", "training": "40x5, 50x5, 60x5" },
        "timerConfig": { "mainLift": { "rest": 180 }, "accessory": { "rest": 90 } }
    }
};

function processFile(targetPath) {
    if (fs.existsSync(targetPath)) {
        let jsonStr = fs.readFileSync(targetPath, 'utf8');
        let data = JSON.parse(jsonStr);
        let count = 0;
        for (const [key, val] of Object.entries(newMets)) {
            if (!data.methodologies[key]) {
                data.methodologies[key] = val;
                count++;
            }
        }
        if (count > 0) {
            data.totalProtocols = Object.values(data.methodologies).reduce((acc, met) => acc + (met.protocols ? met.protocols.length : 0), 0);
            fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
            console.log("Inyectadas " + count + " metodologias en " + targetPath);
        } else {
            console.log("No se necesitaban inyectar en " + targetPath);
        }
    }
}

processFile(pathJSON1);
processFile(pathJSON2);
console.log("Done");
