import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import { HTTP_STATUS, ERROR_CODES, ROLES, DOCTOR_APPROVAL_STATUS, APPOINTMENT_STATUS } from '../src/config/constants.js';
import { User } from '../src/models/User.js';
import { Doctor } from '../src/models/Doctor.js';

beforeAll(async () => {
  await setupTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe('Appointments API & Anti-Collision Double-Booking Guard (/api/v1/appointments)', () => {
  let patientToken;
  let patientUser;
  let doctorToken;
  let doctor;

  // Next Monday date helper
  const getFutureMonday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7) + 7);
    return d.toISOString().split('T')[0];
  };

  beforeEach(async () => {
    // 1. Patient User
    patientUser = await User.create({
      name: 'Patient Zubair',
      email: 'zubair@example.com',
      phone: '03001234567',
      password: 'Password123!',
      role: ROLES.PATIENT
    });

    const pLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'zubair@example.com',
      password: 'Password123!'
    });
    patientToken = pLogin.body.data.token;

    // 2. Doctor User
    const docUser = await User.create({
      name: 'Dr. Noman',
      email: 'dr.noman@example.com',
      phone: '03009876543',
      password: 'Password123!',
      role: ROLES.DOCTOR
    });

    const dLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'dr.noman@example.com',
      password: 'Password123!'
    });
    doctorToken = dLogin.body.data.token;

    // 3. Doctor Profile
    doctor = await Doctor.create({
      userId: docUser._id,
      name: 'Dr. Noman',
      slug: 'dr-noman',
      specialty: 'ENT Specialist',
      approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
      isActive: true,
      availability: [
        { day: 'monday', startTime: '10:00', endTime: '12:00', isAvailable: true }
      ],
      slotDurationMinutes: 30
    });
  });

  it('POST /appointments should successfully book an available slot', async () => {
    const futureDate = getFutureMonday();

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctor.id,
        date: futureDate,
        startTime: '10:00',
        reason: 'Sore throat consultation'
      });

    expect(res.status).toBe(HTTP_STATUS.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(APPOINTMENT_STATUS.PENDING);
    expect(res.body.data.doctor.name).toBe('Dr. Noman');
    expect(res.body.data.endTime).toBe('10:30');
  });

  it('POST /appointments should reject double-booking with 409 CONFLICT', async () => {
    const futureDate = getFutureMonday();

    // First booking
    await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctor.id,
        date: futureDate,
        startTime: '10:00',
        reason: 'First booking'
      });

    // Attempt second booking for identical slot
    const duplicateRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctor.id,
        date: futureDate,
        startTime: '10:00',
        reason: 'Duplicate collision attempt'
      });

    expect(duplicateRes.status).toBe(HTTP_STATUS.CONFLICT);
    expect(duplicateRes.body.error.code).toBe(ERROR_CODES.CONFLICT);
  });

  it('PATCH /appointments/:id/status transitions and terminal state enforcement', async () => {
    const futureDate = getFutureMonday();

    const bookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctor.id,
        date: futureDate,
        startTime: '10:30',
        reason: 'Checkup'
      });

    const appointmentId = bookRes.body.data.id;

    // Doctor confirms
    const confirmRes = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: APPOINTMENT_STATUS.CONFIRMED });

    expect(confirmRes.status).toBe(HTTP_STATUS.OK);
    expect(confirmRes.body.data.status).toBe(APPOINTMENT_STATUS.CONFIRMED);

    // Doctor completes
    const completeRes = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: APPOINTMENT_STATUS.COMPLETED });

    expect(completeRes.status).toBe(HTTP_STATUS.OK);
    expect(completeRes.body.data.status).toBe(APPOINTMENT_STATUS.COMPLETED);

    // Attempting modification after completed must be rejected
    const terminalAttempt = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: APPOINTMENT_STATUS.CANCELLED });

    expect(terminalAttempt.status).toBe(HTTP_STATUS.BAD_REQUEST);
  });
});
