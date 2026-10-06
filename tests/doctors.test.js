import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import { HTTP_STATUS, ERROR_CODES, ROLES, DOCTOR_APPROVAL_STATUS } from '../src/config/constants.js';
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

describe('Doctor Endpoints & Directory (/api/v1/doctors)', () => {
  let docToken;
  let doctorUser;
  let approvedDoctor;

  beforeEach(async () => {
    // Create doctor user
    doctorUser = await User.create({
      name: 'Dr. Tariq Jamil',
      email: 'dr.tariq@example.com',
      phone: '03001234567',
      password: 'Password123!',
      role: ROLES.DOCTOR
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'dr.tariq@example.com',
      password: 'Password123!'
    });
    docToken = loginRes.body.data.token;

    approvedDoctor = await Doctor.create({
      userId: doctorUser._id,
      name: 'Dr. Tariq Jamil',
      slug: 'dr-tariq-jamil',
      specialty: 'Cardiology',
      consultationFee: 1500,
      area: 'Faridabad',
      city: 'Dera Ismail Khan',
      gender: 'male',
      ratingAverage: 4.8,
      ratingCount: 12,
      approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
      isVerified: true,
      isActive: true,
      availability: [
        { day: 'monday', startTime: '09:00', endTime: '12:00', isAvailable: true },
        { day: 'wednesday', startTime: '14:00', endTime: '18:00', isAvailable: true }
      ],
      slotDurationMinutes: 30
    });
  });

  it('GET /doctors should return paginated list of approved doctors', async () => {
    const res = await request(app).get('/api/v1/doctors');

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.total).toBe(1);
  });

  it('GET /doctors with invalid sort field should reject with 400 BAD_REQUEST', async () => {
    const res = await request(app).get('/api/v1/doctors?sort=maliciousField');

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res.body.error.code).toBe(ERROR_CODES.BAD_REQUEST);
  });

  it('GET /doctors/me should return logged-in doctor profile', async () => {
    const res = await request(app)
      .get('/api/v1/doctors/me')
      .set('Authorization', `Bearer ${docToken}`);

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data.name).toBe('Dr. Tariq Jamil');
    expect(res.body.data.specialty).toBe('Cardiology');
  });

  it('GET /doctors/:id/slots should generate valid time slots', async () => {
    // 2026-10-12 is a Monday
    const res = await request(app).get(`/api/v1/doctors/${approvedDoctor.id}/slots?date=2026-10-12`);

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data.date).toBe('2026-10-12');
    expect(res.body.data.slots).toBeDefined();
    expect(res.body.data.slots.length).toBeGreaterThan(0);
    expect(res.body.data.slots[0].startTime).toBe('09:00');
    expect(res.body.data.slots[0].endTime).toBe('09:30');
  });

  it('PATCH /doctors/:id should prevent doctor from modifying approvalStatus or isVerified', async () => {
    const res = await request(app)
      .patch(`/api/v1/doctors/${approvedDoctor.id}`)
      .set('Authorization', `Bearer ${docToken}`)
      .send({
        bio: 'Updated bio by doctor',
        approvalStatus: 'rejected', // Should be stripped/ignored for doctor role
        isVerified: false
      });

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data.bio).toBe('Updated bio by doctor');
    expect(res.body.data.approvalStatus).toBe(DOCTOR_APPROVAL_STATUS.APPROVED);
    expect(res.body.data.isVerified).toBe(true);
  });
});
