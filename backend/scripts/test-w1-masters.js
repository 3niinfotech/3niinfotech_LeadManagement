/**
 * W1 smoke tests for relational Master engine.
 * Usage: node scripts/test-w1-masters.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const results = [];

  // Health
  {
    const r = await req('GET', '/health');
    assert(r.status === 200, `health expected 200 got ${r.status}`);
    results.push('health 200');
  }

  // Unauthenticated
  {
    const r = await req('GET', '/masters/country');
    assert(r.status === 401, `unauth list expected 401 got ${r.status}`);
    results.push('unauth → 401');
  }

  // Login
  const login = await req('POST', '/auth/login', {
    body: { email: 'admin@crm.com', password: 'Admin@123' },
  });
  assert(login.status === 200, `login failed ${login.status} ${JSON.stringify(login.json)}`);
  const token = login.json?.data?.accessToken || login.json?.data?.token || login.json?.accessToken;
  assert(token, `no token in login response: ${JSON.stringify(login.json)}`);
  results.push('login ok');

  // List countries
  {
    const r = await req('GET', '/masters/country?page=1&pageSize=10&search=Can', { token });
    assert(r.status === 200, `list country ${r.status} ${JSON.stringify(r.json)}`);
    assert(Array.isArray(r.json.data), 'list data array');
    assert(r.json.pagination?.total >= 1, 'pagination total');
    results.push(`list country total=${r.json.pagination.total}`);
  }

  // Hub summary
  {
    const r = await req('GET', '/masters/hub/summary', { token });
    assert(r.status === 200, `hub ${r.status}`);
    assert(r.json.data.country?.total >= 22, 'hub country count');
    assert(r.json.data.university?.total >= 1, 'hub university count');
    results.push('hub summary ok');
  }

  // Legacy MasterItem options (visit-purpose) — label values
  {
    const r = await req('GET', '/masters/visit-purpose/options', { token });
    assert(r.status === 200, `legacy options ${r.status}`);
    const first = r.json.data?.[0];
    assert(first?.label, 'legacy option has label');
    assert(typeof first.value === 'string', 'legacy value is string label');
    // Should NOT be uuid-only by default
    results.push(`legacy visit-purpose options: ${r.json.data.length}`);
  }

  // Relational options for document-type (no MasterItem overlap)
  {
    const r = await req('GET', '/masters/document-type/options', { token });
    assert(r.status === 200, `doc-type options ${r.status}`);
    const first = r.json.data?.[0];
    assert(first?.value && first?.label, 'relational option shape');
    results.push(`document-type options: ${r.json.data.length}`);
  }

  // Relational options with source=relational for country
  {
    const r = await req('GET', '/masters/country/options?source=relational', { token });
    assert(r.status === 200, `country relational options ${r.status}`);
    const first = r.json.data?.[0];
    assert(first?.value && first?.label, 'country relational option');
    results.push(`country relational options: ${r.json.data.length}`);
  }

  // Create test country
  const code = `W1T_${Date.now().toString(36).toUpperCase()}`;
  let createdId;
  {
    const r = await req('POST', '/masters/country', {
      token,
      body: { code, name: 'W1 Testland', isoCode: 'ZZ', phoneCode: '+99' },
    });
    assert(r.status === 201, `create country ${r.status} ${JSON.stringify(r.json)}`);
    createdId = r.json.data.id;
    results.push(`create country ${code}`);
  }

  // Duplicate code → 409
  {
    const r = await req('POST', '/masters/country', {
      token,
      body: { code, name: 'Dup' },
    });
    assert(r.status === 409, `duplicate expected 409 got ${r.status}`);
    results.push('duplicate → 409');
  }

  // Update
  {
    const r = await req('PUT', `/masters/country/${createdId}`, {
      token,
      body: { name: 'W1 Testland Updated' },
    });
    assert(r.status === 200, `update ${r.status}`);
    assert(r.json.data.name.includes('Updated'), 'name updated');
    results.push('update ok');
  }

  // Status deactivate
  {
    const r = await req('PATCH', `/masters/country/${createdId}/status`, {
      token,
      body: { isActive: false },
    });
    assert(r.status === 200, `status ${r.status}`);
    assert(r.json.data.isActive === false, 'inactive');
    results.push('deactivate ok');
  }

  // Soft delete (no deps)
  {
    const r = await req('DELETE', `/masters/country/${createdId}`, { token });
    assert(r.status === 200, `delete ${r.status} ${JSON.stringify(r.json)}`);
    results.push('delete orphan country ok');
  }

  // Dependency protection — delete CA should fail
  {
    const ca = await prisma.country.findFirst({ where: { code: 'CA', deletedAt: null } });
    assert(ca, 'CA country exists');
    const r = await req('DELETE', `/masters/country/${ca.id}`, { token });
    assert(r.status === 409, `CA delete expected 409 got ${r.status} ${JSON.stringify(r.json)}`);
    results.push('dependency delete blocked');
  }

  // Dependent university options
  {
    const ca = await prisma.country.findFirst({ where: { code: 'CA', deletedAt: null } });
    const r = await req('GET', `/masters/university/options?source=relational&countryId=${ca.id}`, { token });
    assert(r.status === 200, `univ options ${r.status}`);
    assert(r.json.data.length >= 1, 'univ options filtered');
    results.push(`university options by country: ${r.json.data.length}`);
  }

  // Unknown entity
  {
    const r = await req('GET', '/masters/random-table', { token });
    assert(r.status === 404, `unknown entity expected 404 got ${r.status}`);
    results.push('unknown entity → 404');
  }

  // Invalid sort ignored (still 200)
  {
    const r = await req('GET', '/masters/country?sort=passwordHash', { token });
    assert(r.status === 200, `invalid sort ${r.status}`);
    results.push('invalid sort ignored');
  }

  // Audit trail for CREATE exists
  {
    const audits = await prisma.auditLog.findMany({
      where: { entityType: { startsWith: 'Master:' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    assert(audits.length >= 1, 'audit logs present');
    results.push(`audit Master:* count sample=${audits.length}`);
  }

  // pageSize cap
  {
    const r = await req('GET', '/masters/country?pageSize=100000', { token });
    assert(r.status === 200, 'pageSize abuse request ok');
    assert(r.json.pagination.limit <= 100, `limit capped got ${r.json.pagination.limit}`);
    results.push('pageSize capped at 100');
  }

  console.log('\nW1 TEST RESULTS');
  results.forEach((line) => console.log(' ✓', line));
  console.log('\nALL W1 SMOKE TESTS PASSED');
}

main()
  .catch((e) => {
    console.error('\nW1 TEST FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
