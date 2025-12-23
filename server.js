const express = require('express');
const cors = require('cors');
const app = express();

// ==================== CONFIGURAÇÃO ====================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuração de CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATABASE ====================
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

// Configurações de substituição de IDs
const replacementConfigs = [
  {
    domain: 'exemplo.com',
    oldId: '2012025',
    newId: '1738001',
    active: true
  }
];

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// ==================== ROTAS DE TOKENS ====================

// Listar todos os tokens
app.get('/api/tokens', (req, res) => {
  try {
    const tokensList = tokens.map(t => ({
      token: t.token,
      userId: t.userId,
      name: t.name,
      active: t.active,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt
    }));
    
    res.json({
      success: true,
      count: tokensList.length,
      tokens: tokensList
    });
  } catch (error) {
    console.error('❌ Erro ao listar tokens:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar tokens' 
    });
  }
});

// Validar token
app.get('/api/validate-token', (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        valid: false, 
        active: false,
        error: 'Token não fornecido' 
      });
    }

    const tokenData = tokens.find(t => t.token === token);

    if (!tokenData) {
      return res.json({ 
        valid: false, 
        active: false,
        error: 'Token não encontrado'
      });
    }

    if (!tokenData.active) {
      return res.json({ 
        valid: true, 
        active: false,
        error: 'Token inativo'
      });
    }

    const now = new Date();
    const expirationDate = new Date(tokenData.expiresAt);
    
    if (now > expirationDate) {
      return res.json({ 
        valid: true, 
        active: false,
        error: 'Token expirado'
      });
    }

    res.json({ 
      valid: true, 
      active: true,
      userId: tokenData.userId,
      name: tokenData.name,
      expiresAt: tokenData.expiresAt
    });

  } catch (error) {
    console.error('❌ Erro ao validar token:', error);
    res.status(500).json({ 
      valid: false, 
      active: false,
      error: 'Erro no servidor' 
    });
  }
});

// Adicionar novo token
app.post('/api/tokens', (req, res) => {
  try {
    const { token, userId, name, expiresInDays = 365 } = req.body;

    if (!token || !userId || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token, userId e name são obrigatórios' 
      });
    }

    const existingToken = tokens.find(t => t.token === token);
    if (existingToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token já existe' 
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

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
      token: newToken,
      message: 'Token criado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar token:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao adicionar token' 
    });
  }
});

// Ativar/Desativar token
app.post('/api/tokens/:token/toggle', (req, res) => {
  try {
    const { token } = req.params;
    const tokenData = tokens.find(t => t.token === token);

    if (!tokenData) {
      return res.status(404).json({ 
        success: false, 
        error: 'Token não encontrado' 
      });
    }

    tokenData.active = !tokenData.active;

    res.json({ 
      success: true, 
      token: tokenData,
      message: `Token ${tokenData.active ? 'ativado' : 'desativado'}`
    });

  } catch (error) {
    console.error('❌ Erro ao alternar token:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao alternar status' 
    });
  }
});

// Remover token
app.delete('/api/tokens/:token', (req, res) => {
  try {
    const { token } = req.params;
    const index = tokens.findIndex(t => t.token === token);

    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Token não encontrado' 
      });
    }

    tokens.splice(index, 1);

    res.json({ 
      success: true, 
      message: 'Token removido com sucesso' 
    });

  } catch (error) {
    console.error('❌ Erro ao remover token:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao remover token' 
    });
  }
});

// ==================== ROTAS DE CONFIGURAÇÃO ====================

// Obter configurações de IDs
app.get('/api/get-ids', (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token não fornecido' 
      });
    }

    const tokenData = tokens.find(t => t.token === token && t.active);

    if (!tokenData) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido ou inativo' 
      });
    }

    res.json({ 
      success: true, 
      replacements: replacementConfigs.filter(c => c.active)
    });

  } catch (error) {
    console.error('❌ Erro ao obter configurações:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao obter configurações' 
    });
  }
});

// ==================== PAINEL HTML ====================

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Painel de Tokens VIP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      color: white;
      text-align: center;
      margin-bottom: 30px;
      font-size: 2.5em;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .card {
      background: white;
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 25px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .form-group { margin-bottom: 15px; }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #333;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      padding: 12px 25px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .btn-danger {
      background: #e74c3c;
      color: white;
    }
    .btn-success {
      background: #10b981;
      color: white;
    }
    .btn-warning {
      background: #f59e0b;
      color: white;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    tr:hover { background: #f8f9fa; }
    .status {
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: bold;
    }
    .status-active {
      background: #d1fae5;
      color: #065f46;
    }
    .status-inactive {
      background: #fee2e2;
      color: #991b1b;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .stat-number {
      font-size: 2.5em;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      color: #666;
      margin-top: 5px;
    }
    .health-indicator {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 10px 20px;
      border-radius: 20px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .health-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  </style>
</head>
<body>
  <div class="health-indicator">
    <div class="health-dot"></div>
    <span>Servidor Online</span>
  </div>

  <div class="container">
    <h1>🔐 Painel de Tokens VIP</h1>
    
    <div class="stats" id="stats"></div>

    <div class="card">
      <h2>➕ Adicionar Novo Token</h2>
      <div class="form-group">
        <label>Token:</label>
        <input type="text" id="newToken" placeholder="Ex: VIP-2024-ABC123">
      </div>
      <div class="form-group">
        <label>User ID:</label>
        <input type="text" id="newUserId" placeholder="Ex: user001">
      </div>
      <div class="form-group">
        <label>Nome:</label>
        <input type="text" id="newName" placeholder="Ex: João Silva">
      </div>
      <div class="form-group">
        <label>Validade (dias):</label>
        <input type="number" id="expiresInDays" value="365">
      </div>
      <button class="btn-primary" onclick="addToken()">Criar Token</button>
    </div>

    <div class="card">
      <h2>📋 Tokens Cadastrados</h2>
      <button class="btn-primary" onclick="loadTokens()">🔄 Atualizar Lista</button>
      <table id="tokensTable">
        <thead>
          <tr>
            <th>Token</th>
            <th>User ID</th>
            <th>Nome</th>
            <th>Status</th>
            <th>Criado</th>
            <th>Expira</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="tokensBody"></tbody>
      </table>
    </div>
  </div>

  <script>
    async function loadTokens() {
      try {
        const response = await fetch('/api/tokens');
        const data = await response.json();

        if (data.success) {
          const tbody = document.getElementById('tokensBody');
          tbody.innerHTML = '';

          let activeCount = 0;
          let inactiveCount = 0;

          data.tokens.forEach(token => {
            if (token.active) activeCount++;
            else inactiveCount++;

            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td><strong>\${token.token}</strong></td>
              <td>\${token.userId}</td>
              <td>\${token.name}</td>
              <td>
                <span class="status status-\${token.active ? 'active' : 'inactive'}">
                  \${token.active ? '✅ Ativo' : '❌ Inativo'}
                </span>
              </td>
              <td>\${new Date(token.createdAt).toLocaleDateString('pt-BR')}</td>
              <td>\${new Date(token.expiresAt).toLocaleDateString('pt-BR')}</td>
              <td>
                <button class="btn-warning" onclick="toggleToken('\${token.token}')">
                  \${token.active ? '⏸️' : '▶️'}
                </button>
                <button class="btn-danger" onclick="deleteToken('\${token.token}')">🗑️</button>
              </td>
            \`;
            tbody.appendChild(tr);
          });

          document.getElementById('stats').innerHTML = \`
            <div class="stat-card">
              <div class="stat-number">\${data.count}</div>
              <div class="stat-label">Total de Tokens</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: #10b981">\${activeCount}</div>
              <div class="stat-label">Tokens Ativos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: #e74c3c">\${inactiveCount}</div>
              <div class="stat-label">Tokens Inativos</div>
            </div>
          \`;
        }
      } catch (error) {
        alert('Erro ao carregar tokens: ' + error.message);
      }
    }

    async function addToken() {
      const token = document.getElementById('newToken').value.trim();
      const userId = document.getElementById('newUserId').value.trim();
      const name = document.getElementById('newName').value.trim();
      const expiresInDays = parseInt(document.getElementById('expiresInDays').value);

      if (!token || !userId || !name) {
        alert('Preencha todos os campos!');
        return;
      }

      try {
        const response = await fetch('/api/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, userId, name, expiresInDays })
        });

        const data = await response.json();

        if (data.success) {
          alert('✅ Token criado com sucesso!');
          document.getElementById('newToken').value = '';
          document.getElementById('newUserId').value = '';
          document.getElementById('newName').value = '';
          loadTokens();
        } else {
          alert('❌ Erro: ' + data.error);
        }
      } catch (error) {
        alert('Erro ao criar token: ' + error.message);
      }
    }

    async function toggleToken(token) {
      try {
        const response = await fetch(\`/api/tokens/\${token}/toggle\`, {
          method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
          alert(data.message);
          loadTokens();
        } else {
          alert('❌ Erro: ' + data.error);
        }
      } catch (error) {
        alert('Erro: ' + error.message);
      }
    }

    async function deleteToken(token) {
      if (!confirm(\`Tem certeza que deseja remover o token \${token}?\`)) {
        return;
      }

      try {
        const response = await fetch(\`/api/tokens/\${token}\`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          alert('✅ Token removido!');
          loadTokens();
        } else {
          alert('❌ Erro: ' + data.error);
        }
      } catch (error) {
        alert('Erro: ' + error.message);
      }
    }

    loadTokens();
  </script>
</body>
</html>
  `);
});

// ==================== 404 Handler ====================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.path
  });
});

// ==================== Error Handler ====================
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: NODE_ENV === 'development' ? err.message : 'Erro desconhecido'
  });
});

// ==================== INICIAR SERVIDOR ====================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 SERVIDOR INICIADO COM SUCESSO   ║
╠═══════════════════════════════════════╣
║  📡 Porta: ${PORT}
║  🌐 Ambiente: ${NODE_ENV}
║  🔐 Tokens: ${tokens.length}
║  ⏰ Iniciado: ${new Date().toLocaleString('pt-BR')}
╚═══════════════════════════════════════╝

🔗 URLs:
   Local:  http://localhost:${PORT}
   Rede:   http://0.0.0.0:${PORT}

🎯 Token de teste: VIP-DEMO-2024
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️ SIGINT recebido. Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente.');
    process.exit(0);
  });
});

// Captura erros não tratados
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
});

module.exports = app;
