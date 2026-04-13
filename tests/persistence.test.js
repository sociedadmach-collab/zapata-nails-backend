const {
  buildClientRecordForCreate,
  buildClientRecordForUpdate
} = require('../src/utils/persistence');

describe('persistence utils', () => {
  test('prepares birthdate as empty on create when header exists', () => {
    const record = buildClientRecordForCreate({
      timestamp: '2026-04-10T12:00:00.000Z',
      phoneNormalized: '+34612345678',
      displayName: 'Mady',
      headers: ['client_id', 'phone_normalized', 'display_name', 'birthdate', 'email']
    });

    expect(record.birthdate).toBe('');
    expect(record.email).toBe('');
  });

  test('preserves birthdate and email on update when they already exist', () => {
    const updatedRecord = buildClientRecordForUpdate(
      {
        client_id: 'CL-20260410-120000-ABCD',
        phone_normalized: '+34612345678',
        display_name: 'Mady',
        birthdate: '1992-08-10',
        email: 'mady@example.com'
      },
      {
        timestamp: '2026-04-10T12:10:00.000Z',
        displayName: 'Mady Zapata',
        headers: ['client_id', 'phone_normalized', 'display_name', 'birthdate', 'email', 'last_interaction_at']
      }
    );

    expect(updatedRecord.display_name).toBe('Mady Zapata');
    expect(updatedRecord.birthdate).toBe('1992-08-10');
    expect(updatedRecord.email).toBe('mady@example.com');
    expect(updatedRecord.last_interaction_at).toBe('2026-04-10T12:10:00.000Z');
  });
});
