/**
 * NEXUS-RP Coach - Catálogo de tiendas por país (asistente geonutricional)
 * Productos reales típicos de cada cadena con macros por porción.
 * tags: proteina | carb | limpio | rapido
 */
window.TIENDAS_DB = {
    MX: [
        {
            id: 'oxxo', nombre: 'Oxxo', emoji: '🏪', tipo: 'Tienda de conveniencia',
            productos: [
                { nombre: 'Yogur griego bebible', porcion: '250ml', kcal: 140, prot: 15, carb: 16, grasa: 2, tags: ['proteina', 'rapido'] },
                { nombre: 'Atún en vasito', porcion: '110g', kcal: 160, prot: 16, carb: 8, grasa: 7, tags: ['proteina', 'rapido'] },
                { nombre: 'Leche descremada 1L', porcion: '240ml', kcal: 83, prot: 8, carb: 12, grasa: 0.2, tags: ['proteina', 'limpio'] },
                { nombre: 'Huevos cocidos (2 pzas)', porcion: '2 pzas', kcal: 144, prot: 12, carb: 1, grasa: 10, tags: ['proteina', 'rapido'] },
                { nombre: 'Barra de proteína', porcion: '60g', kcal: 220, prot: 20, carb: 23, grasa: 7, tags: ['proteina', 'rapido'] },
                { nombre: 'Cacahuates naturales', porcion: '50g', kcal: 285, prot: 13, carb: 8, grasa: 24, tags: ['rapido'] },
                { nombre: 'Manzana', porcion: '1 pza', kcal: 95, prot: 0.5, carb: 25, grasa: 0.3, tags: ['carb', 'limpio'] },
                { nombre: 'Plátano', porcion: '1 pza', kcal: 105, prot: 1.3, carb: 27, grasa: 0.4, tags: ['carb', 'limpio'] },
                { nombre: 'Sandwich de pavo', porcion: '1 pza', kcal: 320, prot: 18, carb: 40, grasa: 9, tags: ['proteina', 'carb', 'rapido'] },
                { nombre: 'Bebida deportiva 600ml', porcion: '600ml', kcal: 150, prot: 0, carb: 38, grasa: 0, tags: ['carb', 'rapido'] },
                { nombre: 'Leche con chocolate', porcion: '240ml', kcal: 190, prot: 8, carb: 30, grasa: 5, tags: ['carb', 'proteina'] },
                { nombre: 'Jamón de pavo', porcion: '60g', kcal: 64, prot: 10, carb: 2, grasa: 1.5, tags: ['proteina', 'limpio'] }
            ]
        },
        {
            id: 'seveneleven', nombre: '7-Eleven', emoji: '🏪', tipo: 'Tienda de conveniencia',
            productos: [
                { nombre: 'Yogur griego con granola', porcion: '170g', kcal: 180, prot: 14, carb: 22, grasa: 3.5, tags: ['proteina', 'rapido'] },
                { nombre: 'Atún lata en agua', porcion: '140g', kcal: 130, prot: 29, carb: 0, grasa: 1, tags: ['proteina', 'limpio'] },
                { nombre: 'Sandwich de pollo', porcion: '1 pza', kcal: 340, prot: 22, carb: 38, grasa: 10, tags: ['proteina', 'carb', 'rapido'] },
                { nombre: 'Barra de proteína', porcion: '60g', kcal: 220, prot: 20, carb: 23, grasa: 7, tags: ['proteina', 'rapido'] },
                { nombre: 'Almendras naturales', porcion: '28g', kcal: 164, prot: 6, carb: 6, grasa: 14, tags: ['limpio'] },
                { nombre: 'Fruta picada (vaso)', porcion: '250g', kcal: 110, prot: 1.5, carb: 27, grasa: 0.5, tags: ['carb', 'limpio'] },
                { nombre: 'Leche deslactosada light', porcion: '240ml', kcal: 90, prot: 8, carb: 12, grasa: 1, tags: ['proteina', 'limpio'] },
                { nombre: 'Bebida con proteína (botella)', porcion: '330ml', kcal: 160, prot: 25, carb: 9, grasa: 3, tags: ['proteina', 'rapido'] }
            ]
        },
        {
            id: 'chedraui', nombre: 'Chedraui', emoji: '🛒', tipo: 'Supermercado',
            productos: [
                { nombre: 'Pechuga de pollo (kg)', porcion: '150g', kcal: 248, prot: 46, carb: 0, grasa: 5, tags: ['proteina', 'limpio'] },
                { nombre: 'Huevo blanco (docena)', porcion: '2 pzas', kcal: 144, prot: 12, carb: 1, grasa: 10, tags: ['proteina', 'limpio'] },
                { nombre: 'Queso panela', porcion: '60g', kcal: 116, prot: 12, carb: 2, grasa: 7, tags: ['proteina', 'limpio'] },
                { nombre: 'Salmón fresco', porcion: '150g', kcal: 312, prot: 33, carb: 0, grasa: 20, tags: ['proteina'] },
                { nombre: 'Arroz (bolsa 1kg)', porcion: '1 taza cocida', kcal: 205, prot: 4, carb: 45, grasa: 0.5, tags: ['carb', 'limpio'] },
                { nombre: 'Avena natural (caja)', porcion: '60g', kcal: 228, prot: 8, carb: 39, grasa: 4, tags: ['carb', 'limpio'] },
                { nombre: 'Frijol negro (bolsa)', porcion: '1 taza cocida', kcal: 220, prot: 14, carb: 40, grasa: 1, tags: ['carb', 'proteina', 'limpio'] },
                { nombre: 'Camote', porcion: '200g', kcal: 180, prot: 3, carb: 41, grasa: 0.2, tags: ['carb', 'limpio'] },
                { nombre: 'Aguacate', porcion: '1/2 pza', kcal: 112, prot: 1.4, carb: 6, grasa: 10, tags: ['limpio'] },
                { nombre: 'Yogur griego natural 1kg', porcion: '170g', kcal: 100, prot: 17, carb: 6, grasa: 0.7, tags: ['proteina', 'limpio'] },
                { nombre: 'Whey protein (bote)', porcion: '1 scoop', kcal: 120, prot: 24, carb: 3, grasa: 1.5, tags: ['proteina'] },
                { nombre: 'Tortilla de maíz (kg)', porcion: '3 pzas', kcal: 192, prot: 4.5, carb: 39, grasa: 2, tags: ['carb'] }
            ]
        },
        {
            id: 'walmart_mx', nombre: 'Walmart', emoji: '🛒', tipo: 'Supermercado',
            productos: [
                { nombre: 'Pechuga de pollo (charola)', porcion: '150g', kcal: 248, prot: 46, carb: 0, grasa: 5, tags: ['proteina', 'limpio'] },
                { nombre: 'Carne molida 90/10', porcion: '150g', kcal: 264, prot: 39, carb: 0, grasa: 11, tags: ['proteina'] },
                { nombre: 'Atún en agua (4 pack)', porcion: '140g', kcal: 130, prot: 29, carb: 0, grasa: 1, tags: ['proteina', 'limpio'] },
                { nombre: 'Claras de huevo líquidas', porcion: '120ml', kcal: 60, prot: 13, carb: 1, grasa: 0, tags: ['proteina', 'limpio'] },
                { nombre: 'Queso cottage', porcion: '113g', kcal: 92, prot: 12, carb: 5, grasa: 2.5, tags: ['proteina', 'limpio'] },
                { nombre: 'Pan integral (paquete)', porcion: '2 rebanadas', kcal: 138, prot: 7, carb: 24, grasa: 2, tags: ['carb'] },
                { nombre: 'Pasta (paquete)', porcion: '1 taza cocida', kcal: 220, prot: 8, carb: 43, grasa: 1.3, tags: ['carb'] },
                { nombre: 'Crema de cacahuate natural', porcion: '2 cdas', kcal: 188, prot: 8, carb: 6, grasa: 16, tags: ['limpio'] },
                { nombre: 'Plátano (kg)', porcion: '1 pza', kcal: 105, prot: 1.3, carb: 27, grasa: 0.4, tags: ['carb', 'limpio'] },
                { nombre: 'Barra de proteína (caja)', porcion: '60g', kcal: 220, prot: 20, carb: 23, grasa: 7, tags: ['proteina', 'rapido'] }
            ]
        }
    ],
    US: [
        {
            id: 'walmart', nombre: 'Walmart', emoji: '🛒', tipo: 'Supermarket',
            productos: [
                { nombre: 'Chicken breast', porcion: '150g', kcal: 248, prot: 46, carb: 0, grasa: 5, tags: ['proteina', 'limpio'] },
                { nombre: 'Greek yogurt (cup)', porcion: '170g', kcal: 100, prot: 17, carb: 6, grasa: 0.7, tags: ['proteina', 'limpio'] },
                { nombre: 'Canned tuna in water', porcion: '140g', kcal: 130, prot: 29, carb: 0, grasa: 1, tags: ['proteina', 'limpio'] },
                { nombre: 'Egg whites carton', porcion: '120ml', kcal: 60, prot: 13, carb: 1, grasa: 0, tags: ['proteina', 'limpio'] },
                { nombre: 'Brown rice (bag)', porcion: '1 cup cooked', kcal: 216, prot: 5, carb: 45, grasa: 1.8, tags: ['carb', 'limpio'] },
                { nombre: 'Oats (canister)', porcion: '60g', kcal: 228, prot: 8, carb: 39, grasa: 4, tags: ['carb', 'limpio'] },
                { nombre: 'Peanut butter', porcion: '2 tbsp', kcal: 188, prot: 8, carb: 6, grasa: 16, tags: ['limpio'] },
                { nombre: 'Protein bar', porcion: '60g', kcal: 220, prot: 20, carb: 23, grasa: 7, tags: ['proteina', 'rapido'] },
                { nombre: 'Bananas', porcion: '1 pza', kcal: 105, prot: 1.3, carb: 27, grasa: 0.4, tags: ['carb', 'limpio'] },
                { nombre: 'Cottage cheese', porcion: '113g', kcal: 92, prot: 12, carb: 5, grasa: 2.5, tags: ['proteina', 'limpio'] }
            ]
        },
        {
            id: 'target', nombre: 'Target', emoji: '🎯', tipo: 'Supermarket',
            productos: [
                { nombre: 'Rotisserie chicken', porcion: '150g', kcal: 275, prot: 35, carb: 0, grasa: 14, tags: ['proteina', 'rapido'] },
                { nombre: 'Greek yogurt drink', porcion: '250ml', kcal: 140, prot: 15, carb: 16, grasa: 2, tags: ['proteina', 'rapido'] },
                { nombre: 'Protein shake (bottle)', porcion: '330ml', kcal: 160, prot: 30, carb: 5, grasa: 3, tags: ['proteina', 'rapido'] },
                { nombre: 'Turkey slices', porcion: '60g', kcal: 64, prot: 10, carb: 2, grasa: 1.5, tags: ['proteina', 'limpio'] },
                { nombre: 'Rice cakes', porcion: '2 pzas', kcal: 70, prot: 1.4, carb: 15, grasa: 0.5, tags: ['carb', 'rapido'] },
                { nombre: 'Mixed nuts', porcion: '28g', kcal: 170, prot: 5, carb: 6, grasa: 15, tags: ['limpio'] },
                { nombre: 'Apple', porcion: '1 pza', kcal: 95, prot: 0.5, carb: 25, grasa: 0.3, tags: ['carb', 'limpio'] },
                { nombre: 'String cheese', porcion: '28g', kcal: 80, prot: 7, carb: 1, grasa: 5, tags: ['proteina', 'rapido'] }
            ]
        },
        {
            id: 'cvs', nombre: 'CVS', emoji: '💊', tipo: 'Convenience / Pharmacy',
            productos: [
                { nombre: 'Protein bar', porcion: '60g', kcal: 220, prot: 20, carb: 23, grasa: 7, tags: ['proteina', 'rapido'] },
                { nombre: 'Beef jerky', porcion: '28g', kcal: 116, prot: 9, carb: 3, grasa: 7, tags: ['proteina', 'rapido'] },
                { nombre: 'Protein shake (bottle)', porcion: '330ml', kcal: 160, prot: 30, carb: 5, grasa: 3, tags: ['proteina', 'rapido'] },
                { nombre: 'Almonds (pack)', porcion: '28g', kcal: 164, prot: 6, carb: 6, grasa: 14, tags: ['limpio'] },
                { nombre: 'Tuna pouch', porcion: '74g', kcal: 70, prot: 16, carb: 0, grasa: 0.5, tags: ['proteina', 'limpio'] },
                { nombre: 'Banana', porcion: '1 pza', kcal: 105, prot: 1.3, carb: 27, grasa: 0.4, tags: ['carb', 'limpio'] },
                { nombre: 'Chocolate milk', porcion: '240ml', kcal: 190, prot: 8, carb: 30, grasa: 5, tags: ['carb', 'proteina'] },
                { nombre: 'Sports drink', porcion: '600ml', kcal: 150, prot: 0, carb: 38, grasa: 0, tags: ['carb', 'rapido'] }
            ]
        }
    ]
};
