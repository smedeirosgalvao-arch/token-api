const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// BANCO DE TOKENS - EDITE AQUI
let tokens = {
  'VIP-2024-ABC123XYZ': { user: 'João Silva', active: true, createdAt: '2024-12-20' },
  'VIP-2024-DEF456UVW': { user: 'Maria Santos', active: true, createdAt: '2024-12-21' }
};

// API: Validar token (usado pela extensão)
app.get('/api/validate-token', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.json({ valid: false, message: 'Token não fornecido' });
  }

  const tokenData = tokens[token];

  if (!tokenData) {
    return res.json({ valid: false, message: 'Token não encontrado' });
  }

  if (!tokenData.active) {
    return res.json({ valid: false, active: false, message: 'Token desativado' });
  }

  res.json({
    valid: true,
    active: true,
    user: tokenData.user
  });
});

// API: Gerar novo token
app.post('/api/generate-token', (req, res) => {
  const { user, password } = req.body;
  
  if (password !== 'admin123') {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const newToken = 'VIP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  
  tokens[newToken] = {
    user: user,
    active: true,
    createdAt: new Date().toISOString().split('T')[0]
  };

  res.json({ success: true, token: newToken });
});

// API: Ativar/Desativar token
app.post('/api/toggle-token', (req, res) => {
  const { token, password } = req.body;
  
  if (password !== 'admin123') {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  if (!tokens[token]) {
    return res.status(404).json({ error: 'Token não encontrado' });
  }

  tokens[token].active = !tokens[token].active;
  res.json({ success: true, active: tokens[token].active });
});

// API: Deletar token
app.post('/api/delete-token', (req, res) => {
  const { token, password } = req.body;
  
  if (password !== 'admin123') {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  if (!tokens[token]) {
    return res.status(404).json({ error: 'Token não encontrado' });
  }

  delete tokens[token];
  res.json({ success: true });
});

// API: Listar tokens
app.get('/api/list-tokens', (req, res) => {
  const { password } = req.query;
  
  if (password !== 'admin123') {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const tokenList = Object.entries(tokens).map(([token, data]) => ({
    token,
    ...data
  }));

  res.json({ tokens: tokenList });
});

// Página inicial (Dashboard)
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Painel Token VIP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      text-align: center;
      color: white;
    }
    .login-box {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      margin: 50px auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    input, button {
      width: 100%;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 10px;
      font-size: 16px;
      margin-bottom: 15px;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }
    button:hover { background: #5568d3; }
    .controls {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      color: white;
    }
    .token-card {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 15px;
      color: white;
    }
    .token-code {
      background: rgba(0,0,0,0.3);
      padding: 15px;
      border-radius: 10px;
      margin: 15px 0;
      font-family: monospace;
      color: #fbbf24;
      cursor: pointer;
      word-break: break-all;
    }
    .status-active { color: #10b981; font-weight: bold; }
    .status-inactive { color: #ef4444; font-weight: bold; }
    .hidden { display: none; }
    .btn-group { display: flex; gap: 10px; margin-top: 15px; }
    .btn-toggle, .btn-delete {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
    }
    .btn-toggle { background: #f59e0b; color: white; }
    .btn-delete { background: #ef4444; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Painel Token VIP</h1>
      <p>Gerencie o acesso à extensão</p>
    </div>

    <div id="loginBox" class="login-box">
      <h2>🔑 Login Admin</h2>
      <input type="password" id="adminPassword" placeholder="Senha de administrador">
      <button onclick="login()">Entrar</button>
    </div>

    <div id="dashboard" class="hidden">
      <div class="controls">
        <h2>➕ Gerar Novo Token</h2>
        <input type="text" id="newUserName" placeholder="Nome do usuário">
        <button onclick="generateToken()">Gerar Token VIP</button>
      </div>

      <div class="controls">
        <h2>📋 Tokens Cadastrados</h2>
        <div id="tokensList"></div>
      </div>
    </div>
  </div>

  <script>
    let adminPassword = '';

    function login() {
      adminPassword = document.getElementById('adminPassword').value;
      loadTokens();
    }

    async function loadTokens() {
      try {
        const response = await fetch('/api/list-tokens?password=' + adminPassword);
        const data = await response.json();
        
        if (data.error) {
          alert('Senha incorreta!');
          return;
        }

        document.getElementById('loginBox').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        displayTokens(data.tokens);
      } catch (error) {
        alert('Erro ao carregar tokens');
      }
    }

    function displayTokens(tokens) {
      const container = document.getElementById('tokensList');
      container.innerHTML = '';

      tokens.forEach(token => {
        const card = document.createElement('div');
        card.className = 'token-card';
        card.innerHTML = '<div><strong>' + token.user + '</strong> - <span class="' + 
          (token.active ? 'status-active' : 'status-inactive') + '">' +
          (token.active ? '✅ ATIVO' : '❌ INATIVO') + '</span></div>' +
          '<div class="token-code" onclick="copyToken(\'' + token.token + '\')">' + token.token + '</div>' +
          '<div>📅 Criado: ' + token.createdAt + '</div>' +
          '<div class="btn-group">' +
          '<button class="btn-toggle" onclick="toggleToken(\'' + token.token + '\')">' +
          (token.active ? '⏸️ Desativar' : '▶️ Ativar') + '</button>' +
          '<button class="btn-delete" onclick="deleteToken(\'' + token.token + '\')">🗑️ Deletar</button>' +
          '</div>';
        container.appendChild(card);
      });
    }

    async function generateToken() {
      const user = document.getElementById('newUserName').value;
      if (!user) { alert('Digite o nome do usuário!'); return; }

      const response = await fetch('/api/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password: adminPassword })
      });

      const data = await response.json();
      if (data.success) {
        alert('Token gerado: ' + data.token);
        document.getElementById('newUserName').value = '';
        loadTokens();
      }
    }

    async function toggleToken(token) {
      const response = await fetch('/api/toggle-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: adminPassword })
      });
      if ((await response.json()).success) loadTokens();
    }

    async function deleteToken(token) {
      if (!confirm('Deletar este token?')) return;
      const response = await fetch('/api/delete-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: adminPassword })
      });
      if ((await response.json()).success) { alert('Token deletado!'); loadTokens(); }
    }

    function copyToken(token) {
      navigator.clipboard.writeText(token);
      alert('Token copiado: ' + token);
    }
  </script>
</body>
</html>`);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
