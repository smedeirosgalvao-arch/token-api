const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// BANCO DE TOKENS
let tokens = {
  'VIP-2024-ABC123XYZ': { 
    user: 'João Silva', 
    email: 'joao@email.com',
    active: true, 
    createdAt: '2024-12-20',
    expiresAt: '2025-12-20',
    lastUsed: null,
    usageCount: 0,
    notes: 'Cliente premium'
  },
  'VIP-2024-DEF456UVW': { 
    user: 'Maria Santos',
    email: 'maria@email.com', 
    active: true, 
    createdAt: '2024-12-21',
    expiresAt: '2025-12-21',
    lastUsed: null,
    usageCount: 0,
    notes: ''
  }
};

// 🎯 CONFIGURAÇÃO DE URLS DAS CASAS (ATUALIZÁVEL REMOTAMENTE!)
let activeSites = {
  sites: [
    {
      id: 1,
      name: 'Manga Pinheiro',
      urls: [
        'manga-pinheiro-pg.com/game/wrap',
        'manga-pinheiro-pg.com/api/game/jump'
      ],
      active: true,
      addedAt: '2024-12-20'
    },
    {
      id: 2,
      name: 'Manga Presente',
      urls: [
        'manga-presente-pg.com/game/wrap',
        'manga-presente-pg.com/api/game/jump'
      ],
      active: true, // Inativa até você ativar
      addedAt: '2024-12-23'
    }
  ],
  lastUpdate: new Date().toISOString()
};

// 🎯 CONFIGURAÇÃO DE IDs (para content.js)
let activeIds = {
  replacements: [
    {
      domain: 'uimz80fgj.com',
      oldId: '2012025',
      newId: '1738001',
      active: true
    }
  ],
  lastUpdate: new Date().toISOString()
};

// LOG DE ACESSOS
let accessLogs = [];
let invalidAttempts = [];
let adminLogs = [];

const ADMIN_PASSWORD = 'admin123';

function logAdmin(action, details) {
  adminLogs.push({
    timestamp: new Date().toISOString(),
    action: action,
    details: details
  });
  if (adminLogs.length > 100) {
    adminLogs = adminLogs.slice(-100);
  }
}

// API: Validar token
app.get('/api/validate-token', (req, res) => {
  const { token } = req.query;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  if (!token) {
    return res.json({ valid: false, message: 'Token não fornecido' });
  }

  const tokenData = tokens[token];

  if (!tokenData || !tokenData.active) {
    invalidAttempts.push({
      token: token,
      ip: ip,
      userAgent: userAgent,
      timestamp: new Date().toISOString(),
      reason: !tokenData ? 'Token não existe' : 'Token inativo'
    });
    
    if (invalidAttempts.length > 50) {
      invalidAttempts = invalidAttempts.slice(-50);
    }
    
    return res.json({ valid: false, message: 'Token inválido' });
  }

  // Verifica expiração
  if (tokenData.expiresAt) {
    const today = new Date().toISOString().split('T')[0];
    if (today > tokenData.expiresAt) {
      return res.json({ valid: false, message: 'Token expirado' });
    }
  }

  // Atualiza dados de uso
  tokenData.lastUsed = new Date().toISOString();
  tokenData.usageCount = (tokenData.usageCount || 0) + 1;

  accessLogs.push({
    token: token,
    user: tokenData.user,
    ip: ip,
    userAgent: userAgent,
    timestamp: new Date().toISOString()
  });

  if (accessLogs.length > 100) {
    accessLogs = accessLogs.slice(-100);
  }

  res.json({ valid: true, active: true, user: tokenData.user });
});

// 🆕 API: Obter URLs ativas das casas
app.get('/api/get-sites', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.json({ success: false, message: 'Token não fornecido' });
  }

  const tokenData = tokens[token];
  
  if (!tokenData || !tokenData.active) {
    return res.json({ success: false, message: 'Token inválido' });
  }

  // Retorna apenas sites ativos
  const activeSitesList = activeSites.sites
    .filter(site => site.active)
    .flatMap(site => site.urls);

  res.json({ 
    success: true, 
    urls: activeSitesList,
    lastUpdate: activeSites.lastUpdate
  });
});

// 🆕 API: Obter configurações de IDs (para content.js)
app.get('/api/get-ids', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.json({ success: false, message: 'Token não fornecido' });
  }

  const tokenData = tokens[token];
  
  if (!tokenData || !tokenData.active) {
    return res.json({ success: false, message: 'Token inválido' });
  }

  const activeReplacements = activeIds.replacements.filter(r => r.active);

  res.json({ 
    success: true, 
    replacements: activeReplacements,
    lastUpdate: activeIds.lastUpdate
  });
});

// 🆕 ADMIN: Listar todos os sites
app.get('/api/admin/list-sites', (req, res) => {
  const { password } = req.query;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  res.json({ sites: activeSites.sites });
});

// 🆕 ADMIN: Adicionar novo site
app.post('/api/admin/add-site', (req, res) => {
  const { password, name, urls } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const newSite = {
    id: activeSites.sites.length + 1,
    name: name,
    urls: urls, // Array de URLs
    active: true,
    addedAt: new Date().toISOString().split('T')[0]
  };

  activeSites.sites.push(newSite);
  activeSites.lastUpdate = new Date().toISOString();

  logAdmin('SITE_ADDED', `Site ${name} adicionado com ${urls.length} URLs`);

  res.json({ success: true, site: newSite });
});

// 🆕 ADMIN: Ativar/Desativar site
app.post('/api/admin/toggle-site', (req, res) => {
  const { password, siteId } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const site = activeSites.sites.find(s => s.id === siteId);
  
  if (!site) {
    return res.status(404).json({ error: 'Site não encontrado' });
  }

  site.active = !site.active;
  activeSites.lastUpdate = new Date().toISOString();

  logAdmin('SITE_TOGGLED', `Site ${site.name} ${site.active ? 'ativado' : 'desativado'}`);

  res.json({ success: true, active: site.active });
});

// 🆕 ADMIN: Deletar site
app.post('/api/admin/delete-site', (req, res) => {
  const { password, siteId } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const index = activeSites.sites.findIndex(s => s.id === siteId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Site não encontrado' });
  }

  const siteName = activeSites.sites[index].name;
  activeSites.sites.splice(index, 1);
  activeSites.lastUpdate = new Date().toISOString();

  logAdmin('SITE_DELETED', `Site ${siteName} deletado`);

  res.json({ success: true });
});

// 🆕 ADMIN: Editar URLs de um site
app.post('/api/admin/edit-site', (req, res) => {
  const { password, siteId, name, urls } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const site = activeSites.sites.find(s => s.id === siteId);
  
  if (!site) {
    return res.status(404).json({ error: 'Site não encontrado' });
  }

  if (name) site.name = name;
  if (urls) site.urls = urls;
  activeSites.lastUpdate = new Date().toISOString();

  logAdmin('SITE_EDITED', `Site ${site.name} editado`);

  res.json({ success: true, site: site });
});

// APIs de Token (mantidas como estavam)
app.post('/api/generate-token', (req, res) => {
  const { user, email, password, expiresInDays, notes } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const newToken = 'VIP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  
  let expiresAt = null;
  if (expiresInDays && expiresInDays > 0) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + parseInt(expiresInDays));
    expiresAt = expDate.toISOString().split('T')[0];
  }

  tokens[newToken] = {
    user: user || 'Sem nome',
    email: email || '',
    active: true,
    createdAt: new Date().toISOString().split('T')[0],
    expiresAt: expiresAt,
    lastUsed: null,
    usageCount: 0,
    notes: notes || ''
  };

  logAdmin('TOKEN_CREATED', `Token ${newToken} criado para ${user}`);

  res.json({ success: true, token: newToken });
});

app.post('/api/toggle-token', (req, res) => {
  const { token, password } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  if (!tokens[token]) {
    return res.status(404).json({ error: 'Token não encontrado' });
  }

  tokens[token].active = !tokens[token].active;
  
  logAdmin('TOKEN_TOGGLED', `Token ${token} ${tokens[token].active ? 'ativado' : 'desativado'}`);

  res.json({ success: true, active: tokens[token].active });
});

app.post('/api/delete-token', (req, res) => {
  const { token, password } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  if (!tokens[token]) {
    return res.status(404).json({ error: 'Token não encontrado' });
  }

  const userName = tokens[token].user;
  delete tokens[token];
  
  logAdmin('TOKEN_DELETED', `Token ${token} (${userName}) deletado`);

  res.json({ success: true });
});

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

app.get('/api/stats', (req, res) => {
  const { password } = req.query;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const total = Object.keys(tokens).length;
  const active = Object.values(tokens).filter(t => t.active).length;
  const inactive = total - active;
  
  const today = new Date();
  const in7days = new Date();
  in7days.setDate(today.getDate() + 7);
  const todayStr = today.toISOString().split('T')[0];
  const in7daysStr = in7days.toISOString().split('T')[0];
  
  const expiringSoon = Object.values(tokens).filter(t => 
    t.expiresAt && t.expiresAt >= todayStr && t.expiresAt <= in7daysStr
  ).length;

  const expired = Object.values(tokens).filter(t => 
    t.expiresAt && t.expiresAt < todayStr
  ).length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const usesToday = accessLogs.filter(log => 
    new Date(log.timestamp) >= todayStart
  ).length;

  const invalidToday = invalidAttempts.filter(log => 
    new Date(log.timestamp) >= todayStart
  ).length;

  res.json({
    total,
    active,
    inactive,
    expired,
    expiringSoon,
    usesToday,
    invalidToday,
    totalAccessLogs: accessLogs.length,
    totalInvalidAttempts: invalidAttempts.length,
    totalSites: activeSites.sites.length,
    activeSites: activeSites.sites.filter(s => s.active).length
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Dashboard HTML (simplificado - você pode melhorar depois)
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>🔐 Painel Admin VIP</title>
<style>
body{font-family:Arial,sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);padding:20px;margin:0}
.container{max-width:1200px;margin:0 auto}
.card{background:#fff;border-radius:15px;padding:25px;margin-bottom:20px;box-shadow:0 10px 30px rgba(0,0,0,.2)}
h1{color:#667eea;margin:0 0 20px}
h2{color:#333;margin:0 0 15px}
input,button{padding:12px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin:5px}
button{background:#667eea;color:#fff;border:none;cursor:pointer;font-weight:bold}
button:hover{background:#5568d3}
.site-item{background:#f5f5f5;padding:15px;border-radius:8px;margin:10px 0}
.hidden{display:none}
.badge{display:inline-block;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:bold;margin:5px}
.badge-active{background:#d1fae5;color:#065f46}
.badge-inactive{background:#fee2e2;color:#991b1b}
</style>
</head>
<body>
<div class="container">
<div class="card">
<h1>🔐 Painel Admin VIP</h1>
<input type="password" id="adminPassword" placeholder="Senha admin">
<button id="loginBtn">Entrar</button>
</div>

<div id="dashboard" class="hidden">
<div class="card">
<h2>🏠 Gerenciar Sites/Casas</h2>
<button onclick="showAddSite()">➕ Adicionar Nova Casa</button>
<div id="sitesList"></div>
</div>

<div class="card">
<h2>🎫 Gerenciar Tokens</h2>
<button onclick="location.reload()">Ver Tokens</button>
</div>
</div>

<div id="addSiteModal" class="hidden">
<div class="card">
<h2>➕ Adicionar Nova Casa</h2>
<input type="text" id="siteName" placeholder="Nome da casa (ex: Manga Presente)">
<input type="text" id="siteUrl1" placeholder="URL 1 (ex: manga-presente-pg.com/game/wrap)">
<input type="text" id="siteUrl2" placeholder="URL 2 (ex: manga-presente-pg.com/api/game/jump)">
<button onclick="addSite()">Adicionar</button>
<button onclick="closeAddSite()">Cancelar</button>
</div>
</div>
</div>

<script>
var adminPassword='';
function login(){adminPassword=document.getElementById('adminPassword').value;if(!adminPassword){alert('Digite a senha!');return}loadSites()}
function loadSites(){fetch('/api/admin/list-sites?password='+encodeURIComponent(adminPassword)).then(r=>r.json()).then(d=>{if(d.error){alert('Senha incorreta!');return}document.getElementById('dashboard').classList.remove('hidden');displaySites(d.sites)})}
function displaySites(sites){var c=document.getElementById('sitesList');c.innerHTML='';sites.forEach(s=>{var div=document.createElement('div');div.className='site-item';div.innerHTML='<strong>'+s.name+'</strong> <span class="badge '+(s.active?'badge-active':'badge-inactive')+'">'+(s.active?'✅ ATIVO':'❌ INATIVO')+'</span><br><small>'+s.urls.join(', ')+'</small><br><button onclick="toggleSite('+s.id+')">'+(s.active?'Desativar':'Ativar')+'</button> <button onclick="deleteSite('+s.id+')">🗑️ Deletar</button>';c.appendChild(div)})}
function toggleSite(id){fetch('/api/admin/toggle-site',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({siteId:id,password:adminPassword})}).then(r=>r.json()).then(d=>{if(d.success)loadSites()})}
function deleteSite(id){if(!confirm('Deletar esta casa?'))return;fetch('/api/admin/delete-site',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({siteId:id,password:adminPassword})}).then(r=>r.json()).then(d=>{if(d.success)loadSites()})}
function showAddSite(){document.getElementById('addSiteModal').classList.remove('hidden')}
function closeAddSite(){document.getElementById('addSiteModal').classList.add('hidden')}
function addSite(){var name=document.getElementById('siteName').value;var url1=document.getElementById('siteUrl1').value;var url2=document.getElementById('siteUrl2').value;if(!name||!url1){alert('Preencha nome e pelo menos 1 URL!');return}var urls=[url1];if(url2)urls.push(url2);fetch('/api/admin/add-site',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,urls:urls,password:adminPassword})}).then(r=>r.json()).then(d=>{if(d.success){alert('Casa adicionada!');closeAddSite();loadSites()}})}
document.getElementById('loginBtn').addEventListener('click',login);
</script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Servidor Token VIP Online!');
  console.log('📡 Porta:', PORT);
  console.log('🔑 Senha Admin:', ADMIN_PASSWORD);
  console.log('🏠 Sites ativos:', activeSites.sites.filter(s => s.active).length);
  console.log('========================================');
});

