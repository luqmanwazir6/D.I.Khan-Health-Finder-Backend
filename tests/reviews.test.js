import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import { HTTP_STATUS, ERROR_CODES, ROLES, DOCTOR_APPROVAL_STATUS, TARGET_TYPES } from '../src/config/constants.js';
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

describe('Reviews API & Rating Recalculation (/api/v1/reviews)', () => {
  let patientToken;
  let patientUser;
  let doctor;

  beforeEach(async () => {
    // 1. Create patient user
    patientUser = await User.create({
      name: 'Kamran Ali',
      email: 'kamran@example.com',
      phone: '03001234567',
      password: 'Password123!',
      role: ROLES.PATIENT
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'kamran@example.com',
      password: 'Password123!'
    });
    patientToken = loginRes.body.data.token;

    // 2. Create doctor user & profile
    const docUser = await User.create({
      name: 'Dr. Sajid',
      email: 'dr.sajid@example.com',
      phone: '03112223344',
      password: 'Password123!',
      role: ROLES.DOCTOR
    });

    doctor = await Doctor.create({
      userId: docUser._id,
      name: 'Dr. Sajid',
      slug: 'dr-sajid',
      specialty: 'Neurology',
      approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
      isActive: true,
      ratingAverage: 0,
      ratingCount: 0
    });
  });

  it('POST /reviews should allow patient to submit review and recalculate target ratings', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        targetType: TARGET_TYPES.DOCTOR,
        targetId: doctor.id,
        rating: 5,
        comment: 'Great doctor!'
      });

    expect(res.status).toBe(HTTP_STATUS.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating).toBe(5);

    // Verify rating recalculation on doctor
    const updatedDoc = await Doctor.findById(doctor.id);
    expect(updatedDoc.ratingAverage).toBe(5);
    expect(updatedDoc.ratingCount).toBe(1);
  });

  it('POST /reviews should return 409 CONFLICT if patient tries to leave second review for same target', async () => {
    await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        targetType: TARGET_TYPES.DOCTOR,
        targetId: doctor.id,
        rating: 5,
        comment: 'Great doctor!'
      });

    const duplicateRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        targetType: TARGET_TYPES.DOCTOR,
        targetId: doctor.id,
        rating: 4,
        comment: 'Another review'
      });

    expect(duplicateRes.status).toBe(HTTP_STATUS.CONFLICT);
    expect(duplicateRes.body.error.code).toBe(ERROR_CODES.CONFLICT);
  });
});
