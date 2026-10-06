import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import { HTTP_STATUS, ERROR_CODES, ROLES } from '../src/config/constants.js';
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

describe('Auth Endpoints & Security (/api/v1/auth)', () => {
  const patientPayload = {
    name: 'Ahmed Khan',
    email: 'ahmed.khan@example.com',
    phone: '03001234567',
    password: 'Password123!',
    role: ROLES.PATIENT
  };

  it('POST /auth/signup should register a new patient successfully', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send(patientPayload);

    expect(res.status).toBe(HTTP_STATUS.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.user._id).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.email).toBe(patientPayload.email);
  });

  it('POST /auth/signup with role "doctor" should require specialty and auto-create Doctor profile', async () => {
    // Missing specialty
    const failRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Dr. Bilal Qureshi',
      email: 'dr.bilal@example.com',
      phone: '03451234567',
      password: 'Password123!',
      role: ROLES.DOCTOR
    });

    expect(failRes.status).toBe(HTTP_STATUS.VALIDATION_ERROR);
    expect(failRes.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

    // With specialty
    const successRes = await request(app).post('/api/v1/auth/signup').send({
      name: 'Dr. Bilal Qureshi',
      email: 'dr.bilal@example.com',
      phone: '03451234567',
      password: 'Password123!',
      role: ROLES.DOCTOR,
      specialty: 'Pediatrics'
    });

    expect(successRes.status).toBe(HTTP_STATUS.CREATED);
    expect(successRes.body.data.user.role).toBe(ROLES.DOCTOR);

    const doctorProfile = await Doctor.findOne({ userId: successRes.body.data.user.id });
    expect(doctorProfile).not.toBeNull();
    expect(doctorProfile.specialty).toBe('Pediatrics');
    expect(doctorProfile.approvalStatus).toBe('pending');
  });

  it('POST /auth/signup with role "admin" should be rejected with 422 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Malicious Admin',
      email: 'fake.admin@example.com',
      phone: '03009999999',
      password: 'Password123!',
      role: ROLES.ADMIN
    });

    expect(res.status).toBe(HTTP_STATUS.VALIDATION_ERROR);
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('POST /auth/signup should reject duplicate email with 409 CONFLICT', async () => {
    await request(app).post('/api/v1/auth/signup').send(patientPayload);
    const res = await request(app).post('/api/v1/auth/signup').send(patientPayload);

    expect(res.status).toBe(HTTP_STATUS.CONFLICT);
    expect(res.body.error.code).toBe(ERROR_CODES.CONFLICT);
  });

  it('POST /auth/login should authenticate valid user', async () => {
    await request(app).post('/api/v1/auth/signup').send(patientPayload);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: patientPayload.email,
      password: patientPayload.password
    });

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(patientPayload.email);
  });

  it('POST /auth/login with wrong password should return 401 UNAUTHORIZED', async () => {
    await request(app).post('/api/v1/auth/signup').send(patientPayload);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: patientPayload.email,
      password: 'WrongPassword123'
    });

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it('POST /auth/login for deactivated user should return 403 FORBIDDEN', async () => {
    const signupRes = await request(app).post('/api/v1/auth/signup').send(patientPayload);
    await User.findByIdAndUpdate(signupRes.body.data.user.id, { isActive: false });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: patientPayload.email,
      password: patientPayload.password
    });

    expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it('GET /auth/me and PATCH /auth/me should return and update authenticated profile', async () => {
    const signupRes = await request(app).post('/api/v1/auth/signup').send(patientPayload);
    const token = signupRes.body.data.token;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(HTTP_STATUS.OK);
    expect(meRes.body.data.user.email).toBe(patientPayload.email);

    const updateRes = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ahmed Khan Updated' });

    expect(updateRes.status).toBe(HTTP_STATUS.OK);
    expect(updateRes.body.data.user.name).toBe('Ahmed Khan Updated');
  });

  it('PATCH /auth/change-password should verify current password and update securely', async () => {
    const signupRes = await request(app).post('/api/v1/auth/signup').send(patientPayload);
    const token = signupRes.body.data.token;

    // Bad current password
    const badRes = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword!', newPassword: 'NewPassword999!' });

    expect(badRes.status).toBe(HTTP_STATUS.BAD_REQUEST);

    // Good current password
    const goodRes = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: patientPayload.password, newPassword: 'NewPassword999!' });

    expect(goodRes.status).toBe(HTTP_STATUS.OK);
    expect(goodRes.body.data).toBeNull();
  });
});
