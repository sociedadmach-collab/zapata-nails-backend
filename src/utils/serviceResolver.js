const { SERVICE_CATALOG } = require('../constants/serviceCatalog');

const SERVICE_KEYWORDS = {
  soft_gel: ['soft gel', 'gel suave', 'gel natural'],
  experiencia_zapata: ['experiencia zapata', 'spa completo', 'spa en casa'],
  glow_express: ['glow express', 'rapido', 'express'],
  zapata_elite: ['zapata elite', 'elite', 'premium'],
  recubrimiento: ['recubrimiento', 'refuerzo'],
  extension_gel_esculpidas: ['esculpidas', 'extension gel'],
  pedicura_semipermanente: ['pedicura semipermanente', 'pedicure semipermanente'],
  retiro_semipermanente: ['retiro semipermanente'],
  retiro_gel: ['retiro gel'],
  retoque_gel: ['retoque gel'],
  semipermanente_rubber: ['semipermanente rubber', 'rubber'],
  reconstruccion_extension_una: ['reconstruccion', 'extension de una', 'extension una']
};

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchText({ intentData, enrichedProfileContext }) {
  return normalizeText(
    [
      intentData?.service_interest,
      enrichedProfileContext?.service_interest
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function matchServiceByKeywords(text) {
  if (!text) {
    return null;
  }

  for (const [serviceKey, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    const hasMatch = keywords.some((keyword) => text.includes(normalizeText(keyword)));

    if (hasMatch) {
      return serviceKey;
    }
  }

  return null;
}

function resolveServiceKey(searchText) {
  if (!searchText) {
    return null;
  }

  return matchServiceByKeywords(searchText);
}

function resolveServiceFromIntent({ intentData, enrichedProfileContext }) {
  const searchText = buildSearchText({ intentData, enrichedProfileContext });
  const serviceKey = resolveServiceKey(searchText);

  if (!serviceKey || !SERVICE_CATALOG[serviceKey]) {
    return {
      serviceKey: null,
      serviceData: null
    };
  }

  return {
    serviceKey,
    serviceData: SERVICE_CATALOG[serviceKey]
  };
}

module.exports = {
  resolveServiceFromIntent,
  normalizeText
};
