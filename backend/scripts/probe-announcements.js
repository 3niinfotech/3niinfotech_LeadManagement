const BASE = 'http://127.0.0.1:5000/api';

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, portal: 'admin' }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Login failed ${email}: ${JSON.stringify(body)}`);
  return body.data?.accessToken || body.data?.token;
}

async function get(token, path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function post(token, path, data = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function main() {
  const health = await fetch(`${BASE}/health`).then((r) => r.json()).catch(() => null);
  if (!health?.success) {
    console.log('BACKEND DOWN');
    process.exit(1);
  }

  const adminToken = await login('admin@crm.com', 'Admin@123');
  const counsellorToken = await login('priya.shah@3niinfotech.com', 'Staff@123');

  const stats = await get(adminToken, '/announcements/manage/stats');
  console.log('manage/stats:', JSON.stringify(stats.body, null, 2));

  const adminList = await get(adminToken, '/announcements?pageSize=5');
  console.log('admin announcements count:', adminList.body?.data?.length);

  const counsellorList = await get(counsellorToken, '/announcements?pageSize=5');
  console.log('counsellor announcements:', counsellorList.body?.data?.map((a) => a.title));

  const counsellorNotifs = await get(counsellorToken, '/notifications?limit=10');
  console.log('counsellor notifications unread:', counsellorNotifs.body?.data?.unreadCount);
  console.log('counsellor recent notifs:', (counsellorNotifs.body?.data?.data || [])
    .slice(0, 3)
    .map((n) => ({ title: n.title, event: n.metadata?.event })));

  const first = counsellorList.body?.data?.[0];
  if (first?.id) {
    const view = await post(counsellorToken, `/announcements/${first.id}/view`);
    console.log('record view:', view.status, view.body?.success ? 'ok' : view.body);
    const stats2 = await get(adminToken, '/announcements/manage/stats');
    const row = (stats2.body?.data?.items || []).find((i) => i.announcementId === first.id);
    console.log('stats after view:', row);
  }

  const masters = await get(adminToken, '/master/relational/communication-template?limit=3&channel=ANNOUNCEMENT');
  const rows = masters.body?.data?.data || masters.body?.data || [];
  console.log('master templates:', rows.slice(0, 2).map((r) => ({
    id: r.id,
    name: r.name,
    channel: r.channel,
    eventType: r.eventType,
    isActive: r.isActive,
    variables: r.variables,
  })));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
