const crypto = require('crypto');
const {
  getClientSheetData,
  appendAppointmentRecord
} = require('./googleSheetsService');
const { normalizePhoneForLookup } = require('./checkClientService');

function validateSaveAppointmentPayload(payload) {
  const requiredFields = [
    'phone',
    'service_name',
    'price',
    'appointment_date',
    'appointment_time'
  ];

  const hasMissingFields = requiredFields.some((field) => {
    return !payload?.[field] || !String(payload[field]).trim();
  });

  return {
    ok: !hasMissingFields
  };
}

function generateAppointmentId() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `APT-${timestamp}-${randomSuffix}`;
}

function buildAppointmentDatetimeIso(appointmentDate, appointmentTime) {
  return `${appointmentDate}T${appointmentTime}:00`;
}

async function findClientByPhoneNormalized(phoneNormalized) {
  const { records } = await getClientSheetData();

  return (
    records.find((record) => {
      return normalizePhoneForLookup(record.phone_normalized) === phoneNormalized;
    }) || null
  );
}

async function saveAppointment(payload) {
  const phoneNormalized = normalizePhoneForLookup(payload.phone);
  const clientRecord = await findClientByPhoneNormalized(phoneNormalized);

  if (!clientRecord) {
    return {
      clientFound: false
    };
  }

  const clientName = clientRecord.display_name || clientRecord.name || '';
  const address = clientRecord.address || '';
  const timestamp = new Date().toISOString();
  const appointmentRecord = {
    appointment_id: generateAppointmentId(),
    phone_normalized: phoneNormalized,
    client_name: clientName,
    service_name: payload.service_name,
    price: payload.price,
    appointment_date: payload.appointment_date,
    appointment_time: payload.appointment_time,
    appointment_datetime_iso: buildAppointmentDatetimeIso(
      payload.appointment_date,
      payload.appointment_time
    ),
    address,
    status: 'confirmed',
    calendar_event_id: '',
    created_at: timestamp,
    updated_at: timestamp,
    notes: payload.notes || ''
  };

  await appendAppointmentRecord(appointmentRecord);

  return {
    clientFound: true,
    appointment: appointmentRecord
  };
}

module.exports = {
  saveAppointment,
  validateSaveAppointmentPayload,
  buildAppointmentDatetimeIso,
  generateAppointmentId
};
