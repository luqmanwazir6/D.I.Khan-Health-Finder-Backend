import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import { HTTP_STATUS, ROLES, DOCTOR_APPROVAL_STATUS } from '../src/config/constants.js';
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

describe('Admin Management Endpoints (/api/v1/admin)', () => {
  let adminToken;
  let adminUser;
  let pendingDoctor;
  let regularUser;

  beforeEach(async () => {
    // 1. Admin User
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin.test@example.com',
      phone: '03001234567',
      password: 'Password123!',
      role: ROLES.ADMIN
    });

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.test@example.com',
      password: 'Password123!'
    });
    adminToken = adminLogin.body.data.token;

    // 2. Regular User
    regularUser = await User.create({
      name: 'Test Regular User',
      email: 'regular@example.com',
      phone: '03002223344',
      password: 'Password123!',
      role: ROLES.PATIENT
    });

    // 3. Pending Doctor
    const docUser = await User.create({
      name: 'Dr. Pending',
      email: 'dr.pending@example.com',
      phone: '03003334455',
      password: 'Password123!',
      role: ROLES.DOCTOR
    });

    pendingDoctor = await Doctor.create({
      userId: docUser._id,
      name: 'Dr. Pending',
      slug: 'dr-pending',
      specialty: 'Urology',
      approvalStatus: DOCTOR_APPROVAL_STATUS.PENDING,
      isVerified: false
    });
  });

  it('GET /admin/stats should return system counters', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data.users).toBe(3);
    expect(res.body.data.doctors).toBe(1);
    expect(res.body.data.pendingDoctorApprovals).toBe(1);
  });

  it('PATCH /admin/users/:id/status should prevent admin self-deactivation', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${adminUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  it('PATCH /admin/users/:id/status should deactivate another user', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${regularUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data.isActive).toBe(false);
  });

  it('PATCH /admin/doctors/:id/approval should approve doctor and set isVerified true', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/doctors/${pendingDoctor.id}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED });

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data.approvalStatus).toBe(DOCTOR_APPROVAL_STATUS.APPROVED);
    expect(res.body.data.isVerified).toBe(true);
  });
});
