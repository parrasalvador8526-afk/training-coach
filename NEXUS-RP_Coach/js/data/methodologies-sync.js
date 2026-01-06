/**
 * NEXUS-RP Coach - Sincronización con Metodologías
 * 
 * Carga y sincroniza datos de metodologías desde
 * el archivo metodologias_data.json de NEXUS
 */

const MethodologiesSyncModule = (() => {
    // Ruta relativa al JSON de metodologías
    const JSON_PATH = '../Metodos creados HTML/metodologias_data.json';

    // Cache de metodologías cargadas
    let methodologiesCache = null;

    // Datos de respaldo en caso de fallo de carga
    const FALLBACK_METHODOLOGIES = {
        'Y3T': { id: 'Y3T', name: 'Y3T (Yoda 3 Training)', creator: 'Neil Hill', volume: 'Alto' },
        'HeavyDuty': { id: 'HD', name: 'Heavy Duty', creator: 'Mike Mentzer', volume: 'Muy Bajo' },
        'BloodAndGuts': { id: 'BG', name: 'Blood & Guts', creator: 'Dorian Yates', volume: 'Bajo' },
        'MTUT': { id: 'MTUT', name: 'MTUT (Tiempo Bajo Tensión)', creator: 'Varios', volume: 'Moderado' },
        'SST': { id: 'SST', name: 'SST (Sarcoplasm Stimulating)', creator: 'Varios', volume: 'Moderado' },
        'FST7': { id: 'FST7', name: 'FST-7', creator: 'Hany Rambod', volume: 'Alto' },
        'RestPause': { id: 'RP', name: 'Rest-Pause System', creator: 'Raúl Carrasco', volume: 'Moderado' },
        'GVT': { id: 'GVT', name: 'GVT (German Volume)', creator: 'Charles Poliquin', volume: 'Muy Alto' },
        'DUP': { id: 'DUP', name: 'DUP (Periodización Ondulante)', creator: 'Varios', volume: 'Variable' },
        '531': { id: '531', name: '5/3/1', creator: 'Jim Wendler', volume: 'Moderado' },
        'DCTraining': { id: 'DC', name: 'DC Training (Doggcrapp)', creator: 'Dante Trudel', volume: 'Bajo' }
    };

    /**
     * Carga las metodologías desde el archivo JSON
     * @returns {Promise<Object>} Datos de metodologías
     */
    async function loadMethodologies() {
        if (methodologiesCache) {
            return methodologiesCache;
        }

        try {
            const response = await fetch(JSON_PATH);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            methodologiesCache = data.methodologies;
            console.log('✅ Metodologías cargadas:', Object.keys(methodologiesCache).length);
            return methodologiesCache;
        } catch (error) {
            console.warn('⚠️ No se pudo cargar JSON, usando datos de respaldo:', error.message);
            methodologiesCache = FALLBACK_METHODOLOGIES;
            return methodologiesCache;
        }
    }

    /**
     * Obtiene la lista de metodologías disponibles
     * @returns {Promise<Array>} Lista simplificada de metodologías
     */
    async function getMethodologyList() {
        const methodologies = await loadMethodologies();
        return Object.entries(methodologies).map(([key, data]) => ({
            id: key,
            shortId: data.id,
            name: data.name,
            creator: data.creator,
            volume: data.volume || 'Moderado',
            intensity: data.intensity || 'Variable'
        }));
    }

    /**
     * Obtiene los detalles completos de una metodología
     * @param {string} methodologyId - ID de la metodología
     * @returns {Promise<Object>} Detalles completos
     */
    async function getMethodologyDetails(methodologyId) {
        const methodologies = await loadMethodologies();
        return methodologies[methodologyId] || null;
    }

    /**
     * Obtiene los protocolos de una metodología
     * @param {string} methodologyId - ID de la metodología
     * @returns {Promise<Array>} Lista de protocolos
     */
    async function getProtocols(methodologyId) {
        const details = await getMethodologyDetails(methodologyId);
        return details?.protocols || [];
    }

    /**
     * Obtiene la configuración de deload de una metodología
     * @param {string} methodologyId - ID de la metodología
     * @returns {Promise<Object>} Configuración de deload
     */
    async function getDeloadConfig(methodologyId) {
        const details = await getMethodologyDetails(methodologyId);
        return details?.deload || {
            frequency: 'Cada 4-6 semanas',
            duration: '1 semana',
            intensity: '50%'
        };
    }

    /**
     * Obtiene la configuración de timer de una metodología
     * @param {string} methodologyId - ID de la metodología
     * @returns {Promise<Object>} Configuración de timers
     */
    async function getTimerConfig(methodologyId) {
        const details = await getMethodologyDetails(methodologyId);
        return details?.timerConfig || null;
    }

    /**
     * Verifica compatibilidad entre dos metodologías
     * @param {string} method1 - Primera metodología
     * @param {string} method2 - Segunda metodología
     * @returns {Promise<Object>} Resultado de compatibilidad
     */
    async function checkCompatibility(method1, method2) {
        const details1 = await getMethodologyDetails(method1);
        const details2 = await getMethodologyDetails(method2);

        if (!details1 || !details2) {
            return { compatible: false, reason: 'Metodología no encontrada' };
        }

        // Verificar incompatibilidades directas
        if (details1.incompatibleWith?.includes(details2.name)) {
            return {
                compatible: false,
                reason: `${details1.name} es incompatible con ${details2.name}`
            };
        }

        // Verificar compatibilidades directas
        if (details1.compatibleWith?.includes(details2.name)) {
            return {
                compatible: true,
                reason: `${details1.name} es compatible con ${details2.name}`,
                synergy: 'high'
            };
        }

        return {
            compatible: true,
            reason: 'Sin conflictos directos',
            synergy: 'neutral'
        };
    }

    /**
     * Obtiene el factor de ajuste de volumen para una metodología
     * Usado por VolumeMEVMRVModule
     * @param {string} methodologyId - ID de la metodología
     * @returns {number} Factor de ajuste (1.0 = sin cambio)
     */
    function getVolumeAdjustmentFactor(methodologyId) {
        const factors = {
            'HeavyDuty': 0.3,
            'BloodAndGuts': 0.4,
            'DCTraining': 0.4,
            'RestPause': 0.6,
            'SST': 0.8,
            'MTUT': 0.9,
            '531': 0.9,
            'DUP': 1.0,
            'Y3T': 1.1,
            'FST7': 1.2,
            'GVT': 1.3
        };
        return factors[methodologyId] || 1.0;
    }

    /**
     * Obtiene información sobre fatiga SNC/muscular
     * @param {string} methodologyId - ID de la metodología
     * @returns {Object} Niveles de fatiga
     */
    function getFatigueProfile(methodologyId) {
        const profiles = {
            'HeavyDuty': { snc: 9, muscular: 7, recovery: 4 },
            'BloodAndGuts': { snc: 9, muscular: 8, recovery: 5 },
            'DCTraining': { snc: 8, muscular: 9, recovery: 5 },
            '531': { snc: 7, muscular: 6, recovery: 3 },
            'Y3T': { snc: 6, muscular: 7, recovery: 4 },
            'GVT': { snc: 6, muscular: 10, recovery: 5 },
            'DUP': { snc: 6, muscular: 6, recovery: 3 },
            'MTUT': { snc: 5, muscular: 8, recovery: 3 },
            'SST': { snc: 5, muscular: 9, recovery: 4 },
            'FST7': { snc: 4, muscular: 8, recovery: 3 },
            'RestPause': { snc: 8, muscular: 9, recovery: 4.5 }
        };
        return profiles[methodologyId] || { snc: 5, muscular: 5, recovery: 3 };
    }

    /**
     * Limpia el cache de metodologías
     */
    function clearCache() {
        methodologiesCache = null;
    }

    /**
     * Recarga las metodologías
     */
    async function reload() {
        clearCache();
        return await loadMethodologies();
    }

    // API Pública
    return {
        loadMethodologies,
        getMethodologyList,
        getMethodologyDetails,
        getProtocols,
        getDeloadConfig,
        getTimerConfig,
        checkCompatibility,
        getVolumeAdjustmentFactor,
        getFatigueProfile,
        clearCache,
        reload,
        FALLBACK_METHODOLOGIES
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.MethodologiesSyncModule = MethodologiesSyncModule;
}
