// Default fallback keeps the flow safe when a service key is unknown.
const DEFAULT_SERVICE_CONFIG = {
  guarantee: 'Garantia por desprendimiento tecnico segun evaluacion del servicio',
  requires_removal_notice: false,
  extra_notes: 'Te acompanamos con una experiencia bonita y cuidada'
};

const SERVICE_CONFIG = {
  semipermanente: {
    guarantee: '3 dias por desprendimiento tecnico',
    requires_removal_notice: false,
    extra_notes: 'Ideal para acabado natural y duradero'
  },
  gel: {
    guarantee: '5 dias por desprendimiento tecnico',
    requires_removal_notice: true,
    extra_notes: 'Mayor resistencia y durabilidad'
  },
  semipermanente_rubber: {
    guarantee: '3 dias por desprendimiento tecnico',
    requires_removal_notice: false,
    extra_notes: 'Ideal para nivelar y dejar un acabado elegante'
  },
  soft_gel: {
    guarantee: '5 dias por desprendimiento tecnico',
    requires_removal_notice: true,
    extra_notes: 'Ligero, elegante y comodo para tu dia a dia'
  },
  recubrimiento: {
    guarantee: '5 dias por desprendimiento tecnico',
    requires_removal_notice: true,
    extra_notes: 'Perfecto para reforzar tu una natural sin perder elegancia'
  },
  extension_gel_esculpidas: {
    guarantee: '5 dias por desprendimiento tecnico',
    requires_removal_notice: true,
    extra_notes: 'Ideal si buscas mas estructura, forma y duracion'
  }
};

const REQUIRED_FIELDS = [
  'client_name',
  'service_key',
  'service_label',
  'appointment_date',
  'appointment_time',
  'price',
  'has_previous_product',
  'brand_name'
];

const AFFECTIONATE_ADJECTIVES = ['linda', 'hermosa', 'bebe'];

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function getRandomAdjective() {
  const randomIndex = Math.floor(Math.random() * AFFECTIONATE_ADJECTIVES.length);
  return AFFECTIONATE_ADJECTIVES[randomIndex];
}

// Validation stays strict so downstream channels like UChat receive complete data.
function validateBookingData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Booking data must be a valid object.');
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => {
    if (field === 'has_previous_product') {
      return typeof data[field] !== 'boolean';
    }

    return !hasValue(data[field]);
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required booking fields: ${missingFields.join(', ')}`);
  }
}

function getServiceConfig(serviceKey) {
  return SERVICE_CONFIG[serviceKey] || DEFAULT_SERVICE_CONFIG;
}

function buildPreviousProductLine({ hasPreviousProduct, serviceConfig }) {
  if (serviceConfig.requires_removal_notice || hasPreviousProduct) {
    return '• Si tienes producto previo, por favor avisanos con antelacion para prepararte la mejor experiencia';
  }

  return '• Si mas adelante llevas producto previo, avisanos antes de tu cita para dejarte todo listo';
}

// Main formatter used after a human confirms the appointment manually.
function generateBookingMessages(data) {
  validateBookingData(data);

  const serviceConfig = getServiceConfig(data.service_key);
  const shortName = String(data.client_name).trim().split(/\s+/)[0];
  const adjective = getRandomAdjective();

  const confirmationMessage = `Perfecto ${adjective} ${shortName} 😍✨ tu cita ha quedado confirmada con ${data.brand_name} 💅

🗓 Fecha: ${data.appointment_date}
🕓 Hora: ${data.appointment_time}
💅 Servicio: ${data.service_label}
💰 Valor: ${data.price}

Recuerda evitar cremas o aceites antes del servicio para una mejor adherencia ✨

${serviceConfig.extra_notes}.

Te va a encantar este momento bonito para ti 💖`;

  const termsMessage = `Para cuidarte como mereces y darte una experiencia preciosa con ${data.brand_name} 💖, ten en cuenta:

• El servicio es a domicilio 🚗✨
• Reagendamientos con minimo 24h de anticipacion
• Cancelaciones tardias pueden generar recargo
${buildPreviousProductLine({
    hasPreviousProduct: data.has_previous_product,
    serviceConfig
  })}

✨ Garantía: ${serviceConfig.guarantee} a partir de la cita, por desprendimiento técnico

Gracias por confiar en ${data.brand_name} 💖`;

  return {
    confirmation_message: confirmationMessage,
    terms_message: termsMessage
  };
}

module.exports = {
  generateBookingMessages,
  getRandomAdjective,
  SERVICE_CONFIG
};
