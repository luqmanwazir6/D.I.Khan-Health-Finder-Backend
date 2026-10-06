import request from 'supertest';
import app from '../src/app.js';
import { HTTP_STATUS, ERROR_CODES } from '../src/config/constants.js';

describe('Phase 1 Baseline & Health Check API', () => {
  it('GET /api/v1/health should return 200 and healthy status payload', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('D.I. Khan Health Finder API is healthy');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.environment).toBeDefined();
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/v1/non-existent-endpoint should return 404 in standardized error format', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');

    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it('Malformed JSON in request body should return 400 BAD_REQUEST without leaking stack traces', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"badJson": ');

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ERROR_CODES.BAD_REQUEST);
  });
});
