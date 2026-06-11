/**
 * NEXUS-RP Coach - Base de alimentos local
 * Macros por porción indicada. Se carga como global (no fetch) para funcionar en file://.
 * cat: proteina | carb | grasa | veg | fruta | lacteo | snack | bebida
 */
window.ALIMENTOS_DB = [
    // ── Proteínas ──
    { nombre: 'Pechuga de pollo', porcion: '150g', gramos: 150, kcal: 248, prot: 46, carb: 0, grasa: 5, cat: 'proteina' },
    { nombre: 'Muslo de pollo sin piel', porcion: '150g', gramos: 150, kcal: 270, prot: 36, carb: 0, grasa: 13, cat: 'proteina' },
    { nombre: 'Bistec de res', porcion: '150g', gramos: 150, kcal: 290, prot: 40, carb: 0, grasa: 14, cat: 'proteina' },
    { nombre: 'Carne molida 90/10', porcion: '150g', gramos: 150, kcal: 264, prot: 39, carb: 0, grasa: 11, cat: 'proteina' },
    { nombre: 'Atún en agua (lata)', porcion: '1 lata 140g', gramos: 140, kcal: 130, prot: 29, carb: 0, grasa: 1, cat: 'proteina' },
    { nombre: 'Salmón', porcion: '150g', gramos: 150, kcal: 312, prot: 33, carb: 0, grasa: 20, cat: 'proteina' },
    { nombre: 'Tilapia / mojarra', porcion: '150g', gramos: 150, kcal: 192, prot: 39, carb: 0, grasa: 4, cat: 'proteina' },
    { nombre: 'Camarones', porcion: '150g', gramos: 150, kcal: 150, prot: 34, carb: 1, grasa: 1, cat: 'proteina' },
    { nombre: 'Huevo entero', porcion: '1 pza', gramos: 50, kcal: 72, prot: 6, carb: 0, grasa: 5, cat: 'proteina' },
    { nombre: 'Claras de huevo', porcion: '4 claras', gramos: 132, kcal: 68, prot: 14, carb: 1, grasa: 0, cat: 'proteina' },
    { nombre: 'Proteína whey (scoop)', porcion: '1 scoop 30g', gramos: 30, kcal: 120, prot: 24, carb: 3, grasa: 1.5, cat: 'proteina' },
    { nombre: 'Tofu firme', porcion: '150g', gramos: 150, kcal: 217, prot: 24, carb: 4, grasa: 13, cat: 'proteina' },
    { nombre: 'Cerdo lomo', porcion: '150g', gramos: 150, kcal: 242, prot: 39, carb: 0, grasa: 9, cat: 'proteina' },
    { nombre: 'Pavo molido', porcion: '150g', gramos: 150, kcal: 224, prot: 41, carb: 0, grasa: 6, cat: 'proteina' },
    { nombre: 'Sardinas en lata', porcion: '1 lata 90g', gramos: 90, kcal: 187, prot: 22, carb: 0, grasa: 11, cat: 'proteina' },

    // ── Carbohidratos ──
    { nombre: 'Arroz blanco cocido', porcion: '1 taza 160g', gramos: 160, kcal: 205, prot: 4, carb: 45, grasa: 0.5, cat: 'carb' },
    { nombre: 'Arroz integral cocido', porcion: '1 taza 160g', gramos: 160, kcal: 216, prot: 5, carb: 45, grasa: 1.8, cat: 'carb' },
    { nombre: 'Avena en hojuelas', porcion: '60g secos', gramos: 60, kcal: 228, prot: 8, carb: 39, grasa: 4, cat: 'carb' },
    { nombre: 'Pasta cocida', porcion: '1 taza 140g', gramos: 140, kcal: 220, prot: 8, carb: 43, grasa: 1.3, cat: 'carb' },
    { nombre: 'Papa cocida', porcion: '200g', gramos: 200, kcal: 172, prot: 4, carb: 39, grasa: 0.2, cat: 'carb' },
    { nombre: 'Camote', porcion: '200g', gramos: 200, kcal: 180, prot: 3, carb: 41, grasa: 0.2, cat: 'carb' },
    { nombre: 'Tortilla de maíz', porcion: '1 pza 30g', gramos: 30, kcal: 64, prot: 1.5, carb: 13, grasa: 0.7, cat: 'carb' },
    { nombre: 'Tortilla de harina', porcion: '1 pza 45g', gramos: 45, kcal: 140, prot: 4, carb: 23, grasa: 3.5, cat: 'carb' },
    { nombre: 'Pan integral', porcion: '2 rebanadas', gramos: 56, kcal: 138, prot: 7, carb: 24, grasa: 2, cat: 'carb' },
    { nombre: 'Bolillo', porcion: '1 pza 60g', gramos: 60, kcal: 170, prot: 5, carb: 34, grasa: 1.5, cat: 'carb' },
    { nombre: 'Frijoles cocidos', porcion: '1 taza 170g', gramos: 170, kcal: 220, prot: 14, carb: 40, grasa: 1, cat: 'carb' },
    { nombre: 'Lentejas cocidas', porcion: '1 taza 200g', gramos: 200, kcal: 230, prot: 18, carb: 40, grasa: 0.8, cat: 'carb' },
    { nombre: 'Garbanzos cocidos', porcion: '1 taza 165g', gramos: 165, kcal: 269, prot: 14, carb: 45, grasa: 4, cat: 'carb' },
    { nombre: 'Quinoa cocida', porcion: '1 taza 185g', gramos: 185, kcal: 222, prot: 8, carb: 39, grasa: 3.5, cat: 'carb' },
    { nombre: 'Elote', porcion: '1 pza 150g', gramos: 150, kcal: 132, prot: 5, carb: 29, grasa: 1.8, cat: 'carb' },
    { nombre: 'Tostadas horneadas', porcion: '2 pzas', gramos: 40, kcal: 124, prot: 3, carb: 26, grasa: 1, cat: 'carb' },

    // ── Grasas ──
    { nombre: 'Aguacate', porcion: '1/2 pza 70g', gramos: 70, kcal: 112, prot: 1.4, carb: 6, grasa: 10, cat: 'grasa' },
    { nombre: 'Aceite de oliva', porcion: '1 cda 14g', gramos: 14, kcal: 119, prot: 0, carb: 0, grasa: 13.5, cat: 'grasa' },
    { nombre: 'Almendras', porcion: '28g (~23 pzas)', gramos: 28, kcal: 164, prot: 6, carb: 6, grasa: 14, cat: 'grasa' },
    { nombre: 'Nueces', porcion: '28g', gramos: 28, kcal: 185, prot: 4, carb: 4, grasa: 18, cat: 'grasa' },
    { nombre: 'Cacahuates naturales', porcion: '28g', gramos: 28, kcal: 161, prot: 7, carb: 5, grasa: 14, cat: 'grasa' },
    { nombre: 'Crema de cacahuate', porcion: '2 cdas 32g', gramos: 32, kcal: 188, prot: 8, carb: 6, grasa: 16, cat: 'grasa' },
    { nombre: 'Mantequilla', porcion: '1 cda 14g', gramos: 14, kcal: 102, prot: 0, carb: 0, grasa: 11.5, cat: 'grasa' },
    { nombre: 'Chía', porcion: '2 cdas 24g', gramos: 24, kcal: 116, prot: 4, carb: 10, grasa: 7, cat: 'grasa' },

    // ── Lácteos ──
    { nombre: 'Yogur griego natural', porcion: '170g', gramos: 170, kcal: 100, prot: 17, carb: 6, grasa: 0.7, cat: 'lacteo' },
    { nombre: 'Leche descremada', porcion: '1 taza 240ml', gramos: 240, kcal: 83, prot: 8, carb: 12, grasa: 0.2, cat: 'lacteo' },
    { nombre: 'Leche entera', porcion: '1 taza 240ml', gramos: 240, kcal: 149, prot: 8, carb: 12, grasa: 8, cat: 'lacteo' },
    { nombre: 'Queso panela', porcion: '60g', gramos: 60, kcal: 116, prot: 12, carb: 2, grasa: 7, cat: 'lacteo' },
    { nombre: 'Queso Oaxaca', porcion: '40g', gramos: 40, kcal: 141, prot: 9, carb: 1, grasa: 11, cat: 'lacteo' },
    { nombre: 'Requesón', porcion: '100g', gramos: 100, kcal: 96, prot: 11, carb: 3, grasa: 4, cat: 'lacteo' },
    { nombre: 'Queso cottage', porcion: '113g', gramos: 113, kcal: 92, prot: 12, carb: 5, grasa: 2.5, cat: 'lacteo' },

    // ── Verduras ──
    { nombre: 'Brócoli', porcion: '1 taza 90g', gramos: 90, kcal: 31, prot: 2.5, carb: 6, grasa: 0.3, cat: 'veg' },
    { nombre: 'Espinaca', porcion: '2 tazas 60g', gramos: 60, kcal: 14, prot: 1.7, carb: 2, grasa: 0.2, cat: 'veg' },
    { nombre: 'Nopales', porcion: '1 taza 150g', gramos: 150, kcal: 22, prot: 2, carb: 5, grasa: 0.1, cat: 'veg' },
    { nombre: 'Calabacita', porcion: '1 taza 125g', gramos: 125, kcal: 21, prot: 1.5, carb: 4, grasa: 0.3, cat: 'veg' },
    { nombre: 'Jitomate', porcion: '1 pza 120g', gramos: 120, kcal: 22, prot: 1, carb: 5, grasa: 0.2, cat: 'veg' },
    { nombre: 'Zanahoria', porcion: '1 pza 70g', gramos: 70, kcal: 29, prot: 0.7, carb: 7, grasa: 0.1, cat: 'veg' },
    { nombre: 'Ensalada mixta', porcion: '2 tazas 100g', gramos: 100, kcal: 20, prot: 1.5, carb: 4, grasa: 0.2, cat: 'veg' },
    { nombre: 'Chayote', porcion: '1 taza 160g', gramos: 160, kcal: 38, prot: 1.5, carb: 9, grasa: 0.2, cat: 'veg' },

    // ── Frutas ──
    { nombre: 'Plátano', porcion: '1 pza 118g', gramos: 118, kcal: 105, prot: 1.3, carb: 27, grasa: 0.4, cat: 'fruta' },
    { nombre: 'Manzana', porcion: '1 pza 180g', gramos: 180, kcal: 95, prot: 0.5, carb: 25, grasa: 0.3, cat: 'fruta' },
    { nombre: 'Naranja', porcion: '1 pza 130g', gramos: 130, kcal: 62, prot: 1.2, carb: 15, grasa: 0.2, cat: 'fruta' },
    { nombre: 'Fresas', porcion: '1 taza 150g', gramos: 150, kcal: 49, prot: 1, carb: 12, grasa: 0.5, cat: 'fruta' },
    { nombre: 'Papaya', porcion: '1 taza 140g', gramos: 140, kcal: 60, prot: 0.7, carb: 15, grasa: 0.4, cat: 'fruta' },
    { nombre: 'Mango', porcion: '1 taza 165g', gramos: 165, kcal: 99, prot: 1.4, carb: 25, grasa: 0.6, cat: 'fruta' },
    { nombre: 'Sandía', porcion: '2 tazas 300g', gramos: 300, kcal: 91, prot: 1.8, carb: 23, grasa: 0.5, cat: 'fruta' },
    { nombre: 'Uvas', porcion: '1 taza 150g', gramos: 150, kcal: 104, prot: 1, carb: 27, grasa: 0.2, cat: 'fruta' },

    // ── Snacks / bebidas útiles ──
    { nombre: 'Barra de proteína', porcion: '1 pza 60g', gramos: 60, kcal: 220, prot: 20, carb: 23, grasa: 7, cat: 'snack' },
    { nombre: 'Galletas de arroz', porcion: '2 pzas 18g', gramos: 18, kcal: 70, prot: 1.4, carb: 15, grasa: 0.5, cat: 'snack' },
    { nombre: 'Palomitas naturales', porcion: '3 tazas 24g', gramos: 24, kcal: 93, prot: 3, carb: 19, grasa: 1, cat: 'snack' },
    { nombre: 'Jamón de pavo', porcion: '3 rebanadas 60g', gramos: 60, kcal: 64, prot: 10, carb: 2, grasa: 1.5, cat: 'snack' },
    { nombre: 'Atún preparado (vasito)', porcion: '1 pza 110g', gramos: 110, kcal: 160, prot: 16, carb: 8, grasa: 7, cat: 'snack' },
    { nombre: 'Bebida deportiva', porcion: '600ml', gramos: 600, kcal: 150, prot: 0, carb: 38, grasa: 0, cat: 'bebida' },
    { nombre: 'Leche con chocolate', porcion: '240ml', gramos: 240, kcal: 190, prot: 8, carb: 30, grasa: 5, cat: 'bebida' },
    { nombre: 'Café negro', porcion: '1 taza', gramos: 240, kcal: 2, prot: 0.3, carb: 0, grasa: 0, cat: 'bebida' }
];
