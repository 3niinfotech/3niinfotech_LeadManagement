const res = await fetch('http://127.0.0.1:5000/api/health').catch((e) => ({ ok: false, error: e.message }));
if (res.error) {
  console.log('BACKEND DOWN:', res.error);
  process.exit(1);
}
const body = await res.json();
console.log('health:', body);

const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@crm.com', password: '123', portal: 'admin' }),
}).catch((e) => ({ error: e.message }));

if (loginRes.error) {
  console.log('LOGIN FAIL (connection):', loginRes.error);
  process.exit(1);
}

const loginText = await loginRes.text();
console.log('login status:', loginRes.status);
console.log('login body:', loginText.slice(0, 400));
