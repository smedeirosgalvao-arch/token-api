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

// SENHA ADMIN (MUDE DEPOIS!)
const ADMIN_PASSWORD = 'admin123';

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
  
  if (password !== ADMIN_PASSWORD) {
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
  
  if (password !== ADMIN_PASSWORD) {
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
  
  if (password !== ADMIN_PASSWORD) {
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
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const tokenList = Object.entries(tokens).map(([token, data]) => ({
    token,
    ...data
  }));

  res.json({ tokens: tokenList });
});

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Página inicial (Dashboard)
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Painel Token VIP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .card {
      background: white;
      border-radius: 15px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    h1 { color: #667eea; margin-bottom: 10px; }
    h2 { color: #333; margin-bottom: 20px; }
    input, button {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
      margin-bottom: 10px;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }
    button:hover { background: #5568d3; }
    .token-item {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .token-code {
      background: #333;
      color: #fbbf24;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      margin: 10px 0;
      word-break: break-all;
      cursor: pointer;
    }
    .active { color: #10b981; font-weight: bold; }
    .inactive { color: #ef4444; font-weight: bold; }
    .hidden { display: none; }
    .btn-small {
      display: inline-block;
      width: auto;
      padding: 8px 15px;
      margin: 5px 5px 5px 0;
      font-size: 14px;
    }
    .btn-danger { background: #ef4444; }
    .btn-warning { background: #f59e0b; }
    .btn-success { background: #10b981; }
    .alert {
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      font-weight: bold;
    }
    .alert-error { background: #fee; color: #c00; }
    .alert-success { background: #efe; color: #0a0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>🔐 Painel Token VIP</h1>
      <p>Gerencie o acesso à extensão</p>
    </div>

    <div id="loginBox" class="card">
      <h2>🔑 Login Admin</h2>
      <div id="loginError" class="alert alert-error hidden">Senha incorreta!</div>
      <input type="password" id="adminPassword" placeholder="Digite a senha (admin123)" onkeypress="if(event.key==='Enter')login()">
      <button onclick="login()">Entrar</button>
      <p style="margin-top:10px; color:#666; font-size:14px;">Senha padrão: admin123</p>
    </div>

    <div id="dashboard" class="hidden">
      <div class="card">
        <h2>➕ Gerar Novo Token</h2>
        <input type="text" id="newUserName" placeholder="Nome do usuário">
        <button onclick="generateToken()">Gerar Token VIP</button>
      </div>

      <div class="card">
        <h2>📋 Tokens Cadastrados</h2>
        <div id="tokensList"></div>
      </div>
    </div>
  </div>

  <script>
    let adminPassword = '';

    async function login() {
      const passwordInput = document.getElementById('adminPassword');
      adminPassword = passwordInput.value;
      const errorDiv = document.getElementById('loginError');
      
      if (!adminPassword) {
        errorDiv.textContent = 'Digite a senha!';
        errorDiv.classList.remove('hidden');
        return;
      }

      console.log('Tentando login com senha:', adminPassword);

      try {
        const response = await fetch('/api/list-tokens?password=' + encodeURIComponent(adminPassword));
        const data = await response.json();
        
        console.log('Resposta do servidor:', data);
        
        if (data.error) {
          errorDiv.textContent = 'Senha incorreta!';
          errorDiv.classList.remove('hidden');
          return;
        }

        document.getElementById('loginBox').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        displayTokens(data.tokens);
      } catch (error) {
        console.error('Erro:', error);
        errorDiv.textContent = 'Erro ao conectar com servidor!';
        errorDiv.classList.remove('hidden');
      }
    }

    function displayTokens(tokensList) {
      const container = document.getElementById('tokensList');
      
      if (!tokensList || tokensList.length === 0) {
        container.innerHTML = '<p>Nenhum token cadastrado ainda.</p>';
        return;
      }

      container.innerHTML = '';

      tokensList.forEach(token => {
        const div = document.createElement('div');
        div.className = 'token-item';
        
        const statusClass = token.active ? 'active' : 'inactive';
        const statusText = token.active ? '✅ ATIVO' : '❌ INATIVO';
        const toggleText = token.active ? '⏸️ Desativar' : '▶️ Ativar';
        
        div.innerHTML = 
          '<div><strong>' + token.user + '</strong> - <span class="' + statusClass + '">' + statusText + '</span></div>' +
          '<div class="token-code" onclick="copyToken(\'' + token.token + '\')" title="Clique para copiar">' + token.token + '</div>' +
          '<div style="color:#666; font-size:14px;">Criado em: ' + token.createdAt + '</div>' +
          '<div style="margin-top:10px;">' +
          '<button class="btn-small btn-warning" onclick="toggleToken(\'' + token.token + '\')">' + toggleText + '</button>' +
          '<button class="btn-small btn-danger" onclick="deleteToken(\'' + token.token + '\')">🗑️ Deletar</button>' +
          '</div>';
        
        container.appendChild(div);
      });
    }

    async function generateToken() {
      const userInput = document.getElementById('newUserName');
      const user = userInput.value.trim();
      
      if (!user) {
        alert('Digite o nome do usuário!');
        return;
      }

      try {
        const response = await fetch('/api/generate-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: user, password: adminPassword })
        });

        const data = await response.json();
        
        if (data.success) {
          alert('✅ Token gerado com sucesso!\\n\\nToken: ' + data.token + '\\n\\nCopie e envie para o usuário.');
          userInput.value = '';
          loadTokens();
        } else {
          alert('Erro ao gerar token: ' + (data.error || 'Desconhecido'));
        }
      } catch (error) {
        alert('Erro ao gerar token!');
        console.error(error);
      }
    }

    async function toggleToken(token) {
      try {
        const response = await fetch('/api/toggle-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token, password: adminPassword })
        });

        const data = await response.json();
        if (data.success) {
          loadTokens();
        }
      } catch (error) {
        alert('Erro ao alterar token!');
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
          body: JSON.stringify({ token: token, password: adminPassword })
        });

        const data = await response.json();
        if (data.success) {
          alert('✅ Token deletado com sucesso!');
          loadTokens();
        }
      } catch (error) {
        alert('Erro ao deletar token!');
      }
    }

    async function loadTokens() {
      try {
        const response = await fetch('/api/list-tokens?password=' + encodeURIComponent(adminPassword));
        const data = await response.json();
        
        if (!data.error) {
          displayTokens(data.tokens);
        }
      } catch (error) {
        console.error('Erro ao carregar tokens:', error);
      }
    }

    function copyToken(token) {
      navigator.clipboard.writeText(token).then(function() {
        alert('✅ Token copiado: ' + token);
      }, function() {
        prompt('Copie o token:', token);
      });
    }

    // Adiciona console log para debug
    console.log('Painel carregado. Senha padrão: admin123');
  </script>
</body>
</html>`);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('=================================');
  console.log('Servidor Token VIP Online!');
  console.log('Porta:', PORT);
  console.log('Senha Admin:', ADMIN_PASSWORD);
  console.log('=================================');
});
