// ==================== server.js - ARQUIVO ÚNICO COMPLETO ====================
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// BANCO DE TOKENS - EDITE AQUI PARA ADICIONAR/REMOVER
let tokens = {
  'VIP-2024-ABC123XYZ': { user: 'João Silva', active: true, createdAt: '2024-12-20' },
  'VIP-2024-DEF456UVW': { user: 'Maria Santos', active: true, createdAt: '2024-12-21' }
};

// ==================== API ENDPOINTS ====================

// Validar token (usado pela extensão)
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

// Gerar novo token
app.post('/api/generate-token', (req, res) => {
  const { user, password } = req.body;
  
  // SENHA DE ADMIN - MUDE ISSO!
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

// Ativar/Desativar token
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

// Deletar token
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

// Listar tokens
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

// ==================== DASHBOARD WEB ====================

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔐 Painel de Tokens VIP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      border: 1px solid rgba(255,255,255,0.2);
      text-align: center;
    }

    .header h1 {
      color: white;
      font-size: 36px;
      margin-bottom: 10px;
    }

    .header p {
      color: rgba(255,255,255,0.9);
      font-size: 16px;
    }

    .login-box {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      margin: 50px auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .login-box h2 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
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
      transition: 0.3s;
    }

    button:hover {
      background: #5568d3;
      transform: translateY(-2px);
    }

    .controls {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .controls h2 {
      color: white;
      margin-bottom: 20px;
    }

    .token-grid {
      display: grid;
      gap: 20px;
    }

    .token-card {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 25px;
      border: 1px solid rgba(255,255,255,0.2);
      transition: 0.3s;
    }

    .token-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    .token-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .token-user {
      color: white;
      font-size: 20px;
      font-weight: bold;
    }

    .status-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }

    .status-active {
      background: #10b981;
      color: white;
    }

    .status-inactive {
      background: #ef4444;
      color: white;
    }

    .token-code {
      background: rgba(0,0,0,0.3);
      padding: 15px;
      border-radius: 10px;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
      color: #fbbf24;
      font-size: 14px;
      word-break: break-all;
      cursor: pointer;
      position: relative;
    }

    .token-code:hover {
      background: rgba(0,0,0,0.4);
    }

    .token-actions {
      display: flex;
      gap: 10px;
    }

    .btn-toggle {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      transition: 0.3s;
    }

    .btn-delete {
      padding: 12px 20px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      transition: 0.3s;
    }

    .btn-delete:hover {
      background: #dc2626;
    }

    .token-date {
      color: rgba(255,255,255,0.8);
      font-size: 12px;
      margin-top: 10px;
    }

    .hidden {
      display: none;
    }

    .copy-tooltip {
      position: absolute;
      top: -30px;
      right: 10px;
      background: #10b981;
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .copy-tooltip.show {
      opacity: 1;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 25px;
      border: 1px solid rgba(255,255,255,0.2);
      text-align: center;
    }

    .stat-number {
      font-size: 48px;
      font-weight: bold;
      color: white;
      margin-bottom: 10px;
    }

    .stat-label {
      color: rgba(255,255,255,0.9);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Painel de Tokens VIP</h1>
      <p>Gerencie o acesso à extensão</p>
    </div>

    <div id="loginBox" class="login-box">
      <h2>🔑 Login Admin</h2>
      <input type="password" id="adminPassword" placeholder="Senha de administrador">
      <button onclick="login()">Entrar</button>
    </div>

    <div id="dashboard" class="hidden">
      <div class="stats">
        <div class="stat-card">
          <div class="stat-number" id="totalTokens">0</div>
          <div class="stat-label">Total de Tokens</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="activeTokens">0</div>
          <div class="stat-label">Tokens Ativos</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="inactiveTokens">0</div>
          <div class="stat-label">Tokens Inativos</div>
        </div>
      </div>

      <div class="controls">
        <h2>➕ Gerar Novo Token</h2>
        <input type="text" id="newUserName" placeholder="Nome do usuário">
        <button onclick="generateToken()">Gerar Token VIP</button>
      </div>

      <div class="controls">
        <h2>📋 Tokens Cadastrados</h2>
        <div id="tokensList" class="token-grid"></div>
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
        const response = await fetch(\`/api/list-tokens?password=\${adminPassword}\`);
        const data = await response.json();
        
        if (data.error) {
          alert('❌ Senha incorreta!');
          return;
        }

        document.getElementById('loginBox').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        displayTokens(data.tokens);
        updateStats(data.tokens);
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
        card.innerHTML = \`
          <div class="token-header">
            <div class="token-user">\${token.user}</div>
            <span class="status-badge \${token.active ? 'status-active' : 'status-inactive'}">
              \${token.active ? '✅ ATIVO' : '❌ INATIVO'}
            </span>
          </div>
          <div class="token-code" onclick="copyToken('\${token.token}', this)">
            \${token.token}
            <div class="copy-tooltip">Copiado!</div>
          </div>
          <div class="token-date">📅 Criado em: \${token.createdAt}</div>
          <div class="token-actions">
            <button class="btn-toggle" style="background: \${token.active ? '#f59e0b' : '#10b981'}" 
                    onclick="toggleToken('\${token.token}')">
              \${token.active ? '⏸️ Desativar' : '▶️ Ativar'}
            </button>
            <button class="btn-delete" onclick="deleteToken('\${token.token}')">
              🗑️ Deletar
            </button>
          </div>
        \`;
        container.appendChild(card);
      });
    }

    function updateStats(tokens) {
      document.getElementById('totalTokens').textContent = tokens.length;
      document.getElementById('activeTokens').textContent = tokens.filter(t => t.active).length;
      document.getElementById('inactiveTokens').textContent = tokens.filter(t => !t.active).length;
    }

    async function generateToken() {
      const user = document.getElementById('newUserName').value;
      
      if (!user) {
        alert('Digite o nome do usuário!');
        return;
      }

      try {
        const response = await fetch('/api/generate-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, password: adminPassword })
        });

        const data = await response.json();
        
        if (data.success) {
          alert(\`✅ Token gerado com sucesso!

Token: \${data.token}

Copie e envie para o usuário.\`);
          document.getElementById('newUserName').value = '';
          loadTokens();
        }
      } catch (error) {
        alert('Erro ao gerar token');
      }
    }

    async function toggleToken(token) {
      try {
        const response = await fetch('/api/toggle-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: adminPassword })
        });

        const data = await response.json();
        
        if (data.success) {
          loadTokens();
        }
      } catch (error) {
        alert('Erro ao alterar token');
      }
    }

    async function deleteToken(token) {
      if (!confirm('Tem certeza que deseja deletar este token?')) {
        return;
      }

      try {
        const response = await fetch('/api/delete-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: adminPassword })
        });

        const data = await response.json();
        
        if (data.success) {
          alert('✅ Token deletado com sucesso!');
          loadTokens();
        }
      } catch (error) {
        alert('Erro ao deletar token');
      }
    }

    function copyToken(token, element) {
      navigator.clipboard.writeText(token);
      const tooltip = element.querySelector('.copy-tooltip');
      tooltip.classList.add('show');
      setTimeout(() => tooltip.classList.remove('show'), 2000);
    }
  </script>
</body>
</html>
  `);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`
╔═══════════════════════════════════════╗
║  🚀 Servidor Token VIP Rodando!      ║
╚═══════════════════════════════════════╝

📡 URL Local: http://localhost:\${PORT}
🌐 Dashboard: http://localhost:\${PORT}
🔐 Senha Admin: admin123

⚠️  IMPORTANTE: Mude a senha no código!

  \`);
});
