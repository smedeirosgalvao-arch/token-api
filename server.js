const express = require('express');
const cors = require('cors');
const app = express();

// ================= CONFIG =================
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = 'Manuela9';

// ================= AUTH =================
function requireAdminPassword(req, res, next) {
  const password =
    req.headers['x-admin-password'] ||
    req.body?.password ||
    req.query?.password;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Senha inválida' });
  }
  next();
}

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= DATABASE (MEMÓRIA) =================
let tokens = [
  {
    token: 'VIP-DEMO-2024',
    userId: 'user001',
    name: 'Usuário Demo',
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()
  }
];

// ================= HEALTH =================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ================= LOGIN =================
app.post('/api/login', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false });
  }
  res.json({ success: true });
});

// ================= TOKENS API =================
app.get('/api/tokens', requireAdminPassword, (req, res) => {
  res.json({ success: true, tokens });
});

app.post('/api/tokens', requireAdminPassword, (req, res) => {
  const { token, userId, name, expiresInDays = 365 } = req.body;
  if (!token || !userId || !name) {
    return res.status(400).json({ success: false });
  }

  const newToken = {
    token,
    userId,
    name,
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiresInDays * 86400000).toISOString()
  };

  tokens.push(newToken);
  res.json({ success: true });
});

app.post('/api/tokens/:token/toggle', requireAdminPassword, (req, res) => {
  const t = tokens.find(x => x.token === req.params.token);
  if (!t) return res.status(404).json({ success: false });
  t.active = !t.active;
  res.json({ success: true });
});

app.delete('/api/tokens/:token', requireAdminPassword, (req, res) => {
  tokens = tokens.filter(t => t.token !== req.params.token);
  res.json({ success: true });
});

// ================= PAINEL VISUAL =================
app.get('/panel', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Painel Tokens</title>
<style>
body { font-family: Arial; background:#111; color:#fff; padding:20px }
.card { background:#1f1f1f; padding:20px; border-radius:8px; margin-bottom:20px }
input, button { padding:10px; margin:5px 0; width:100% }
button { background:#4f46e5; color:white; border:none; cursor:pointer }
table { width:100%; margin-top:10px }
td, th { padding:8px; border-bottom:1px solid #333 }
</style>
</head>
<body>

<h1>🔐 Painel de Tokens</h1>

<div class="card">
  <h3>Criar Token</h3>
  <input id="token" placeholder="Token">
  <input id="userId" placeholder="User ID">
  <input id="name" placeholder="Nome">
  <button onclick="create()">Criar</button>
</div>

<div class="card">
  <h3>Tokens</h3>
  <table id="table"></table>
</div>

<script>
const password = prompt('Senha do painel');

function headers() {
  return {
    'Content-Type':'application/json',
    'x-admin-password': password
  }
}

async function load() {
  const r = await fetch('/api/tokens', { headers: headers() });
  const d = await r.json();
  const t = document.getElementById('table');
  t.innerHTML = '<tr><th>Token</th><th>Nome</th><th>Status</th><th>Ações</th></tr>';
  d.tokens.forEach(x => {
    t.innerHTML += \`
      <tr>
        <td>\${x.token}</td>
        <td>\${x.name}</td>
        <td>\${x.active ? 'Ativo' : 'Inativo'}</td>
        <td>
          <button onclick="toggle('\${x.token}')">Toggle</button>
          <button onclick="remove('\${x.token}')">Excluir</button>
        </td>
      </tr>
    \`
  });
}

async function create() {
  await fetch('/api/tokens', {
    method:'POST',
    headers: headers(),
    body: JSON.stringify({
      token: token.value,
      userId: userId.value,
      name: name.value
    })
  });
  load();
}

async function toggle(t) {
  await fetch('/api/tokens/'+t+'/toggle', {
    method:'POST',
    headers: headers()
  });
  load();
}

async function remove(t) {
  await fetch('/api/tokens/'+t, {
    method:'DELETE',
    headers: headers()
  });
  load();
}

load();
</script>

</body>
</html>
`);
});

// ================= ROOT =================
app.get('/', (req, res) => {
  res.send('🚀 Token API Online');
});

// ================= START =================
app.listen(PORT, () => {
  console.log('Servidor online na porta', PORT);
});
