import request from 'supertest';

const DEFAULT_PASSWORD = 'BranchTest@123';

export async function login(app, email, password = DEFAULT_PASSWORD) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password, portal: 'admin' });

  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    token: res.body.data.accessToken,
    user: res.body.data.user,
  };
}

export function withAuth(app, token) {
  return {
    get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    patch: (url) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
  };
}

export function expectStatus(res, status, label = '') {
  if (res.status !== status) {
    throw new Error(
      `${label} expected ${status}, got ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }
}

export function collectIds(items = []) {
  return (items || []).map((row) => row.id).filter(Boolean);
}

export function bodyContainsAnyId(body, ids) {
  const text = JSON.stringify(body);
  return ids.some((id) => id && text.includes(id));
}

export function assertNoCrossBranchLeak(body, forbiddenIds, label = '') {
  if (bodyContainsAnyId(body, forbiddenIds)) {
    throw new Error(`${label} leaked forbidden record id(s) in response body`);
  }
}

export { DEFAULT_PASSWORD };
