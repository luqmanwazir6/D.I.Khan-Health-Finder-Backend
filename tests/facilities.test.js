import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import { HTTP_STATUS, DOCTOR_APPROVAL_STATUS, ROLES } from '../src/config/constants.js';
import { Hospital } from '../src/models/Hospital.js';
import { Pharmacy } from '../src/models/Pharmacy.js';
import { Doctor } from '../src/models/Doctor.js';
import { User } from '../src/models/User.js';

beforeAll(async () => {
  await setupTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe('Facilities, Emergency, Meta & Search Endpoints', () => {
  beforeEach(async () => {
    // Seed test hospital
    await Hospital.create({
      name: 'DHQ Hospital DI Khan',
      slug: 'dhq-hospital-dikhan',
      area: 'Civil Lines',
      city: 'Dera Ismail Khan',
      is24Hours: true,
      isEmergency: true,
      ambulanceAvailable: true,
      ratingAverage: 4.5,
      isActive: true
    });

    // Seed test pharmacy
    await Pharmacy.create({
      name: 'Standard Medicos',
      slug: 'standard-medicos',
      area: 'Mission Road',
      city: 'Dera Ismail Khan',
      is24Hours: false,
      isEmergency: false,
      deliveryAvailable: true,
      ratingAverage: 4.2,
      isActive: true
    });

    // Seed doctor for meta test
    const user = await User.create({
      name: 'Dr. Shah',
      email: 'dr.shah@example.com',
      phone: '03001112233',
      password: 'Password123!',
      role: ROLES.DOCTOR
    });

    await Doctor.create({
      userId: user._id,
      name: 'Dr. Shah',
      slug: 'dr-shah',
      specialty: 'Dermatology',
      area: 'Faridabad',
      approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
      isActive: true
    });
  });

  it('GET /emergency should return 24/7 or emergency healthcare facilities only', async () => {
    const res = await request(app).get('/api/v1/emergency');

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hospitals.length).toBe(1);
    expect(res.body.data.pharmacies.length).toBe(0); // Standard Medicos is not 24h/emergency
  });

  it('GET /meta/specialties and /meta/areas should return aggregate taxonomy', async () => {
    const specRes = await request(app).get('/api/v1/meta/specialties');
    expect(specRes.status).toBe(HTTP_STATUS.OK);
    expect(specRes.body.data.length).toBe(1);
    expect(specRes.body.data[0].value).toBe('Dermatology');
    expect(specRes.body.data[0].doctorCount).toBe(1);

    const areaRes = await request(app).get('/api/v1/meta/areas');
    expect(areaRes.status).toBe(HTTP_STATUS.OK);
    expect(areaRes.body.data).toContain('Civil Lines');
    expect(areaRes.body.data).toContain('Mission Road');
    expect(areaRes.body.data).toContain('Faridabad');
  });

  it('GET /search should perform multi-entity search', async () => {
    const res = await request(app).get('/api/v1/search?q=DHQ');

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.data.hospitals.length).toBe(1);
    expect(res.body.data.hospitals[0].name).toContain('DHQ Hospital');
  });
});
