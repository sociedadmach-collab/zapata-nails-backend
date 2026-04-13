const SERVICE_CATALOG = {
  glow_express: {
    display_name: 'Glow Express',
    category: 'combo',
    summary: 'Rapido, practico y siempre impecable',
    benefits: [
      'manicure en seco',
      'pedicure en seco',
      'resultado bonito y practico en poco tiempo',
      'ideal para mujeres con poco tiempo'
    ],
    prices: {
      initial: '79.99€',
      discount: '69.99€',
      retouch: '59.99€'
    },
    guarantee: {
      type: 'standard',
      text: '48 horas de garantia'
    },
    notes: [
      'incluye diseno entre preseleccionados'
    ]
  },
  experiencia_zapata: {
    display_name: 'Experiencia ZAPATA',
    category: 'combo',
    summary: 'Tu momento de spa sin salir de casa',
    benefits: [
      'manicure SPA',
      'pedicure SPA',
      'tina relajante',
      'exfoliacion e hidratacion profunda',
      'masaje relajante en pies y manos',
      'musica personalizada',
      'servicio a domicilio gratis'
    ],
    prices: {
      initial: '94.99€',
      discount: '79.99€',
      retouch: '69.99€'
    },
    guarantee: {
      type: 'extended',
      text: 'Garantia extendida a 5 dias'
    },
    notes: [
      'no incluye relieves, caricaturas o 3D',
      'incluye una reconstruccion sin costo'
    ]
  },
  zapata_elite: {
    display_name: 'ZAPATA Elite',
    category: 'combo',
    summary: 'Lujo, detalle y experiencia premium en casa',
    benefits: [
      'manicure SPA',
      'pedicure SPA',
      'diseno sin limites',
      'mascarilla hidratante',
      'masaje relajante',
      'servicio a domicilio gratis',
      'kit personalizado de limpieza',
      'prioridad en agendamiento'
    ],
    prices: {
      initial: '134.99€',
      discount: '119.99€',
      retouch: '89.99€'
    },
    guarantee: {
      type: 'premium',
      text: 'Garantia extendida a 10 dias'
    },
    notes: [
      'incluye dos reconstrucciones sin costo'
    ]
  },
  semipermanente_rubber: {
    display_name: 'Semipermanente + Rubber',
    category: 'manicure',
    summary: 'Acabado natural y elegante',
    benefits: [
      'acabado natural y elegante',
      'mas ligero',
      'aplicacion rapida y limpia',
      'ideal para nivelar'
    ],
    prices: {
      standard: '34.99€'
    }
  },
  extension_gel_esculpidas: {
    display_name: 'Extension en Gel o Esculpidas',
    category: 'manicure',
    summary: 'Diseno totalmente personalizado, largo y forma',
    benefits: [
      'diseno personalizado',
      'mayor resistencia',
      'ideal para correcciones',
      'acabado profesional y duradero'
    ],
    prices: {
      standard: '41.99€'
    }
  },
  soft_gel: {
    display_name: 'Soft Gel',
    category: 'manicure',
    summary: 'Ligero, flexible y natural',
    benefits: [
      'acabado natural y elegante',
      'mas ligero y comodo',
      'aplicacion rapida y limpia',
      'ideal para lograr largo y forma inmediata'
    ],
    prices: {
      standard: '35.99€'
    }
  },
  recubrimiento: {
    display_name: 'Recubrimiento',
    category: 'manicure',
    summary: 'Refuerza la una natural sin alargarla',
    benefits: [
      'refuerza la una natural',
      'acabado resistente y elegante',
      'mayor duracion',
      'ayuda a que la una crezca sin romperse'
    ],
    prices: {
      standard: '31.99€'
    }
  },
  retoque_gel: {
    display_name: 'Retoque Gel',
    category: 'manicure',
    summary: 'Mantenimiento del gel ya crecido',
    benefits: [
      'mantiene unas impecables',
      'prolonga duracion',
      'evita levantamientos',
      'ahorra tiempo y dinero frente a set nuevo'
    ],
    prices: {
      standard: '31.99€'
    }
  },
  pedicura_semipermanente: {
    display_name: 'Pedicura Semipermanente',
    category: 'pedicure',
    summary: 'Larga duracion y secado inmediato',
    benefits: [
      'larga duracion',
      'secado inmediato',
      'ahorra tiempo',
      'pies mas limpios e hidratados'
    ],
    prices: {
      standard: '29.99€'
    }
  },
  retiro_gel: {
    display_name: 'Retiro de Gel',
    category: 'additional',
    summary: 'Retiro profesional sin danar la una natural',
    benefits: [
      'protege la una natural',
      'preparacion para nuevo servicio',
      'evita debilitamiento y danos'
    ],
    prices: {
      standard: '8.99€'
    }
  },
  retiro_semipermanente: {
    display_name: 'Retiro de Semipermanente',
    category: 'additional',
    summary: 'Retiro seguro del esmalte de larga duracion',
    benefits: [
      'protege la una natural'
    ],
    prices: {
      standard: '6.99€'
    }
  },
  reconstruccion_extension_una: {
    display_name: 'Reconstruccion y Extension de Unas',
    category: 'additional',
    summary: 'Repara, alarga y mejora la apariencia de unas danadas',
    benefits: [
      'restaura forma o resistencia',
      'correccion temporal',
      'ideal para unas deformadas'
    ],
    prices: {
      standard: '4.99€'
    }
  }
};

module.exports = {
  SERVICE_CATALOG
};
