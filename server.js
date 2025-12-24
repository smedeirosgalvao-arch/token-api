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

// ================= LOGIN (FAKE) =================
app.post('/api/login', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Senha inválida' });
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
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatórios'
    });
  }

  if (tokens.find(t => t.token === token)) {
    return res.status(400).json({
      success: false,
      error: 'Token já existe'
    });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 86400000);

  const newToken = {
    token,
    userId,
    name,
    active: true,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  tokens.push(newToken);

  res.json({ success: true, token: newToken });
});

app.post('/api/tokens/:token/toggle', requireAdminPassword, (req, res) => {
  const t = tokens.find(x => x.token === req.params.token);
  if (!t) return res.status(404).json({ success: false });
  t.active = !t.active;
  res.json({ success: true });
});

app.delete('/api/tokens/:token', requireAdminPassword, (req, res) => {
  const index = tokens.findIndex(t => t.token === req.params.token);
  if (index === -1) return res.status(404).json({ success: false });
  tokens.splice(index, 1);
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
body { font-family: Arial; background:#0f172a; color:#fff; padding:20px }
.card { background:#111827; padding:20px; border-radius:8px; margin-bottom:20px }
input, button { padding:10px; margin:5px 0; width:100% }
button { background:#4f46e5; color:white; border:none; cursor:pointer }
button:hover { opacity:0.9 }
table { width:100%; margin-top:10px }
td, th { padding:8px; border-bottom:1px solid #334155 }
th { text-align:left }
</style>
</head>
<body>

<h1>🔐 Painel de Tokens</h1>

<div class="card">
  <h3>Criar Token</h3>
  <input id="tokenInput" placeholder="Token">
  <input id="userIdInput" placeholder="User ID">
  <input id="nameInput" placeholder="Nome">
  <button onclick="createToken()">Criar Token</button>
</div>

<div class="card">
  <h3>Tokens Cadastrados</h3>
  <table>
    <thead>
      <tr>
        <th>Token</th>
        <th>Nome</th>
        <th>Status</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody id="tokensTable"></tbody>
  </table>
</div>

<script>
const ADMIN_PASSWORD = prompt('Digite a senha do painel');

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-admin-password': ADMIN_PASSWORD
  };
}

async function loadTokens() {
  const res = await fetch('/api/tokens', { headers: headers() });
  const data = await res.json();

  if (!data.success) {
    alert('Senha incorreta');
    return;
  }

  const tbody = document.getElementById('tokensTable');
  tbody.innerHTML = '';

  data.tokens.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = \`
      <td>\${t.token}</td>
      <td>\${t.name}</td>
      <td>\${t.active ? 'Ativo' : 'Inativo'}</td>
      <td>
        <button onclick="toggleToken('\${t.token}')">Ativar/Desativar</button>
        <button onclick="deleteToken('\${t.token}')">Excluir</button>
      </td>
    \`;
    tbody.appendChild(tr);
  });
}

async function createToken() {
  const token = document.getElementById('tokenInput').value.trim();
  const userId = document.getElementById('userIdInput').value.trim();
  const name = document.getElementById('nameInput').value.trim();

  if (!token || !userId || !name) {
    alert('Preencha todos os campos');
    return;
  }

  const res = await fetch('/api/tokens', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ token, userId, name })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.error || 'Erro ao criar token');
    return;
  }

  document.getElementById('tokenInput').value = '';
  document.getElementById('userIdInput').value = '';
  document.getElementById('nameInput').value = '';

  loadTokens();
}

async function toggleToken(token) {
  await fetch('/api/tokens/' + token + '/toggle', {
    method: 'POST',
    headers: headers()
  });
  loadTokens();
}

async function deleteToken(token) {
  if (!confirm('Deseja remover este token?')) return;
  await fetch('/api/tokens/' + token, {
    method: 'DELETE',
    headers: headers()
  });
  loadTokens();
}

loadTokens();
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
  console.log('🚀 Servidor rodando na porta', PORT);
});
