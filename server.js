const express = require('express');
const cors = require('cors');
const app = express();

// ==================== CONFIGURAÇÃO ====================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== AUTH SIMPLES (SEM SESSÃO) ====================
const ADMIN_PASSWORD = 'Manuela9';

function requireAdminPassword(req, res, next) {
  const password =
    req.headers['x-admin-password'] ||
    req.query.password ||
    req.body?.password;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: 'Senha administrativa inválida'
    });
  }

  next();
}

// ==================== CORS ====================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-password'],
  credentials: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATABASE (MEMÓRIA) ====================
let tokens = [
  {
    token: 'VIP-DEMO-2024',
    userId: 'user001',
    name: 'Usuário Demo',
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const replacementConfigs = [
  {
    domain: 'exemplo.com',
    oldId: '2012025',
    newId: '1738001',
    active: true
  }
];

// ==================== HEALTH ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ==================== TOKENS (ADMIN) ====================

// Listar tokens
app.get('/api/tokens', requireAdminPassword, (req, res) => {
  res.json({
    success: true,
    count: tokens.length,
    tokens
  });
});

// Criar token
app.post('/api/tokens', requireAdminPassword, (req, res) => {
  const { token, userId, name, expiresInDays = 365 } = req.body;

  if (!token || !userId || !name) {
    return res.status(400).json({
      success: false,
      error: 'Token, userId e name são obrigatórios'
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

  res.json({
    success: true,
    token: newToken
  });
});

// Ativar / Desativar
app.post('/api/tokens/:token/toggle', requireAdminPassword, (req, res) => {
  const tokenData = tokens.find(t => t.token === req.params.token);

  if (!tokenData) {
    return res.status(404).json({
      success: false,
      error: 'Token não encontrado'
    });
  }

  tokenData.active = !tokenData.active;

  res.json({
    success: true,
    token: tokenData
  });
});

// Remover token
app.delete('/api/tokens/:token', requireAdminPassword, (req, res) => {
  const index = tokens.findIndex(t => t.token === req.params.token);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Token não encontrado'
    });
  }

  tokens.splice(index, 1);

  res.json({
    success: true,
    message: 'Token removido'
  });
});

// ==================== TOKEN PÚBLICO ====================

// Validar token (SEM senha)
app.get('/api/validate-token', (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.json({ valid: false });
  }

  const tokenData = tokens.find(t => t.token === token);

  if (!tokenData || !tokenData.active) {
    return res.json({ valid: false });
  }

  if (new Date() > new Date(tokenData.expiresAt)) {
    return res.json({ valid: false });
  }

  res.json({
    valid: true,
    userId: tokenData.userId,
    name: tokenData.name,
    expiresAt: tokenData.expiresAt
  });
});

// IDs (SEM senha)
app.get('/api/get-ids', (req, res) => {
  res.json({
    success: true,
    replacements: replacementConfigs.filter(r => r.active)
  });
});

// ==================== PAINEL HTML ====================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Painel VIP</title>
</head>
<body>
<h2>Painel de Tokens</h2>

<script>
const ADMIN_PASSWORD = prompt('🔐 Senha do painel');

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-admin-password': ADMIN_PASSWORD
  };
}

async function listar() {
  const r = await fetch('/api/tokens', { headers: headers() });
  const d = await r.json();
  console.log(d);
}

listar();
</script>
</body>
</html>
  `);
});

// ==================== 404 ====================
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ==================== ERRO ====================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno' });
});

// ==================== START ====================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// ==================== SHUTDOWN ====================
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

module.exports = app;
