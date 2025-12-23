const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// BANCO DE TOKENS
let tokens = {
  'VIP-2024-ABC123XYZ': { user: 'João Silva', active: true, createdAt: '2024-12-20' },
  'VIP-2024-DEF456UVW': { user: 'Maria Santos', active: true, createdAt: '2024-12-21' }
};

const ADMIN_PASSWORD = 'admin123';

// API: Validar token
app.get('/api/validate-token', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.json({ valid: false, message: 'Token não fornecido' });
  }

  const tokenData = tokens[token];

  if (!tokenData || !tokenData.active) {
    return res.json({ valid: false, message: 'Token inválido' });
  }

  res.json({ valid: true, active: true, user: tokenData.user });
});

// API: Gerar token
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

// API: Toggle token
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

// Dashboard HTML
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Painel Token VIP</title>
<style>
body{font-family:Arial,sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;padding:20px;margin:0}
.container{max-width:900px;margin:0 auto}
.card{background:#fff;border-radius:15px;padding:30px;margin-bottom:20px;box-shadow:0 10px 30px rgba(0,0,0,.2)}
h1{color:#667eea;margin:0 0 10px}
h2{color:#333;margin:0 0 20px}
input,button{width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:16px;margin-bottom:10px;box-sizing:border-box}
button{background:#667eea;color:#fff;border:none;cursor:pointer;font-weight:bold}
button:hover{background:#5568d3}
.token-item{background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:10px}
.token-code{background:#333;color:#fbbf24;padding:10px;border-radius:5px;font-family:monospace;margin:10px 0;word-break:break-all;cursor:pointer;font-size:14px}
.active{color:#10b981;font-weight:bold}
.inactive{color:#ef4444;font-weight:bold}
.hidden{display:none}
.btn-small{display:inline-block;width:auto;padding:8px 15px;margin:5px 5px 5px 0;font-size:14px}
.btn-danger{background:#ef4444}
.btn-warning{background:#f59e0b}
.alert{padding:15px;border-radius:8px;margin-bottom:15px;font-weight:bold}
.alert-error{background:#fee;color:#c00;border:2px solid #c00}
.info{background:#e3f2fd;color:#1976d2;padding:10px;border-radius:5px;margin-top:10px;font-size:14px}
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
<div id="loginError" class="alert alert-error hidden"></div>
<input type="password" id="adminPassword" placeholder="Digite a senha">
<button id="loginBtn">Entrar</button>
<div class="info">
<strong>Senha padrão:</strong> admin123<br>
Pressione Enter ou clique no botão
</div>
</div>

<div id="dashboard" class="hidden">
<div class="card">
<h2>➕ Gerar Novo Token</h2>
<input type="text" id="newUserName" placeholder="Nome do usuário">
<button id="generateBtn">Gerar Token VIP</button>
</div>

<div class="card">
<h2>📋 Tokens Cadastrados (<span id="tokenCount">0</span>)</h2>
<div id="tokensList"></div>
</div>
</div>
</div>

<script>
var adminPassword = '';

function showError(msg) {
  var errorDiv = document.getElementById('loginError');
  errorDiv.textContent = msg;
  errorDiv.classList.remove('hidden');
  console.error('ERRO:', msg);
}

function hideError() {
  document.getElementById('loginError').classList.add('hidden');
}

function login() {
  hideError();
  var passwordInput = document.getElementById('adminPassword');
  adminPassword = passwordInput.value;
  
  console.log('INICIANDO LOGIN...');
  console.log('Senha digitada:', adminPassword);
  
  if (!adminPassword) {
    showError('Digite a senha!');
    return;
  }

  var url = '/api/list-tokens?password=' + encodeURIComponent(adminPassword);
  console.log('Chamando URL:', url);

  fetch(url)
    .then(function(response) {
      console.log('Resposta recebida:', response.status);
      return response.json();
    })
    .then(function(data) {
      console.log('Dados recebidos:', data);
      
      if (data.error) {
        showError('Senha incorreta! Tente: admin123');
        return;
      }

      console.log('LOGIN OK! Mostrando dashboard...');
      document.getElementById('loginBox').classList.add('hidden');
      document.getElementById('dashboard').classList.remove('hidden');
      displayTokens(data.tokens);
    })
    .catch(function(error) {
      console.error('ERRO NO FETCH:', error);
      showError('Erro ao conectar: ' + error.message);
    });
}

function displayTokens(tokensList) {
  console.log('Exibindo tokens:', tokensList);
  var container = document.getElementById('tokensList');
  var countSpan = document.getElementById('tokenCount');
  
  if (!tokensList || tokensList.length === 0) {
    container.innerHTML = '<p>Nenhum token cadastrado.</p>';
    countSpan.textContent = '0';
    return;
  }

  countSpan.textContent = tokensList.length;
  container.innerHTML = '';

  for (var i = 0; i < tokensList.length; i++) {
    var token = tokensList[i];
    var div = document.createElement('div');
    div.className = 'token-item';
    
    var statusClass = token.active ? 'active' : 'inactive';
    var statusText = token.active ? '✅ ATIVO' : '❌ INATIVO';
    var toggleText = token.active ? '⏸️ Desativar' : '▶️ Ativar';
    
    div.innerHTML = 
      '<div><strong>' + token.user + '</strong> - <span class="' + statusClass + '">' + statusText + '</span></div>' +
      '<div class="token-code" data-token="' + token.token + '">📋 ' + token.token + ' (clique para copiar)</div>' +
      '<div style="color:#666;font-size:14px">Criado: ' + token.createdAt + '</div>' +
      '<div style="margin-top:10px">' +
      '<button class="btn-small btn-warning" data-action="toggle" data-token="' + token.token + '">' + toggleText + '</button>' +
      '<button class="btn-small btn-danger" data-action="delete" data-token="' + token.token + '">🗑️ Deletar</button>' +
      '</div>';
    
    container.appendChild(div);
  }
  
  // Adicionar event listeners para os tokens
  var tokenCodes = container.querySelectorAll('.token-code');
  for (var i = 0; i < tokenCodes.length; i++) {
    tokenCodes[i].addEventListener('click', function() {
      copyToken(this.getAttribute('data-token'));
    });
  }
  
  var buttons = container.querySelectorAll('button[data-action]');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function() {
      var action = this.getAttribute('data-action');
      var token = this.getAttribute('data-token');
      if (action === 'toggle') {
        toggleToken(token);
      } else if (action === 'delete') {
        deleteToken(token);
      }
    });
  }
}

function generateToken() {
  var userInput = document.getElementById('newUserName');
  var user = userInput.value.trim();
  
  if (!user) {
    alert('Digite o nome do usuário!');
    return;
  }

  fetch('/api/generate-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: user, password: adminPassword })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      alert('Token gerado com sucesso!\\n\\nToken: ' + data.token + '\\n\\nCopie e envie para o usuário.');
      userInput.value = '';
      loadTokens();
    } else {
      alert('Erro: ' + (data.error || 'Desconhecido'));
    }
  })
  .catch(function(error) {
    alert('Erro ao gerar token!');
    console.error(error);
  });
}

function toggleToken(token) {
  fetch('/api/toggle-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token, password: adminPassword })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) loadTokens();
  })
  .catch(function(error) {
    alert('Erro ao alterar token!');
    console.error(error);
  });
}

function deleteToken(token) {
  if (!confirm('Deletar este token?')) return;

  fetch('/api/delete-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token, password: adminPassword })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      alert('Token deletado com sucesso!');
      loadTokens();
    }
  })
  .catch(function(error) {
    alert('Erro ao deletar!');
    console.error(error);
  });
}

function loadTokens() {
  fetch('/api/list-tokens?password=' + encodeURIComponent(adminPassword))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.error) displayTokens(data.tokens);
    })
    .catch(function(error) {
      console.error('Erro ao carregar tokens:', error);
    });
}

function copyToken(token) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(token).then(function() {
      alert('Token copiado: ' + token);
    });
  } else {
    prompt('Copie o token:', token);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  console.log('=== PAINEL CARREGADO ===');
  console.log('Versão: JavaScript ES5');
  console.log('Senha padrão: admin123');
  
  var loginBtn = document.getElementById('loginBtn');
  var passwordInput = document.getElementById('adminPassword');
  var generateBtn = document.getElementById('generateBtn');
  
  if (loginBtn) {
    console.log('Botão de login encontrado!');
    loginBtn.addEventListener('click', function() {
      console.log('BOTÃO CLICADO!');
      login();
    });
  } else {
    console.error('ERRO: Botão de login NÃO encontrado!');
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        console.log('ENTER PRESSIONADO!');
        login();
      }
    });
  }
  
  if (generateBtn) {
    generateBtn.addEventListener('click', function() {
      generateToken();
    });
  }
});

console.log('=== SCRIPT CARREGADO ===');
</script>
</body>
</html>`);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('========================================');
  console.log('Servidor Token VIP Online!');
  console.log('Porta:', PORT);
  console.log('Senha Admin:', ADMIN_PASSWORD);
  console.log('========================================');
});
