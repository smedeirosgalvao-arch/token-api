const express = require('express');
const cors = require('cors');
const app = express();

// ==================== CONFIG ====================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== AUTH SIMPLES ====================
const ADMIN_PASSWORD = 'Manuela9';

function requireAdminPassword(req, res, next) {
  const password =
    req.headers['x-admin-password'] ||
    req.body?.password ||
    req.query?.password;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: 'Senha administrativa inválida'
    });
  }
  next();
}

// ==================== MIDDLEWARE ====================
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
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()
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
    environment: NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ==================== LOGIN (FAKE – SENHA FIXA) ====================
app.post('/api/login', (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: 'Senha inválida'
    });
  }

  res.json({
    success: true,
    message: 'Login realizado com sucesso (senha fixa)',
    admin: true
  });
});

// ==================== TOKENS (ADMIN) ====================
app.get('/api/tokens', requireAdminPassword, (req, res) => {
  res.json({
    success: true,
    count: tokens.length,
    tokens
  });
});

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

// ==================== ROTAS PÚBLICAS ====================
app.get('/api/validate-token', (req, res) => {
  const { token } = req.query;

  if (!token) return res.json({ valid: false });

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

app.get('/api/get-ids', (req, res) => {
  res.json({
    success: true,
    replacements: replacementConfigs.filter(r => r.active)
  });
});

// ==================== FAVICON (EVITA 404) ====================
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ==================== ROOT ====================
app.get('/', (req, res) => {
  res.send('🚀 Token API Online');
});

// ==================== 404 ====================
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path
  });
});

// ==================== ERROR ====================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});

// ==================== START ====================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor online na porta ${PORT}`);
});

// ==================== SHUTDOWN ====================
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

module.exports = app;
