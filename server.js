// ==================== test-server.js ====================
// Script para testar o servidor automaticamente

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Iniciando testes do servidor...\n');

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  // Teste 1: Verificar se o servidor está online
  console.log('📝 Teste 1: Verificar se o servidor está online');
  try {
    const response = await fetch(`${BASE_URL}/api/tokens`);
    if (response.ok) {
      console.log('✅ Servidor está online\n');
      testsPassed++;
    } else {
      throw new Error('Servidor retornou erro');
    }
  } catch (error) {
    console.log('❌ Servidor está offline ou não responde');
    console.log('   Certifique-se de que o servidor está rodando: node server.js\n');
    testsFailed++;
    return;
  }

  // Teste 2: Listar tokens
  console.log('📝 Teste 2: Listar tokens');
  try {
    const response = await fetch(`${BASE_URL}/api/tokens`);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.tokens)) {
      console.log(`✅ Tokens listados com sucesso (${data.count} tokens)`);
      console.log(`   Tokens encontrados: ${data.tokens.map(t => t.token).join(', ')}\n`);
      testsPassed++;
    } else {
      throw new Error('Formato de resposta inválido');
    }
  } catch (error) {
    console.log('❌ Erro ao listar tokens:', error.message, '\n');
    testsFailed++;
  }

  // Teste 3: Validar token padrão
  console.log('📝 Teste 3: Validar token padrão (VIP-DEMO-2024)');
  try {
    const response = await fetch(`${BASE_URL}/api/validate-token?token=VIP-DEMO-2024`);
    const data = await response.json();
    
    if (data.valid && data.active) {
      console.log('✅ Token VIP-DEMO-2024 é válido e ativo');
      console.log(`   Usuário: ${data.name || data.userId}`);
      console.log(`   Expira: ${new Date(data.expiresAt).toLocaleDateString('pt-BR')}\n`);
      testsPassed++;
    } else {
      throw new Error(`Token inválido: ${data.error || 'motivo desconhecido'}`);
    }
  } catch (error) {
    console.log('❌ Erro ao validar token:', error.message, '\n');
    testsFailed++;
  }

  // Teste 4: Validar token inexistente
  console.log('📝 Teste 4: Validar token inexistente');
  try {
    const response = await fetch(`${BASE_URL}/api/validate-token?token=TOKEN-INVALIDO-123`);
    const data = await response.json();
    
    if (!data.valid || !data.active) {
      console.log('✅ Sistema rejeitou token inválido corretamente\n');
      testsPassed++;
    } else {
      throw new Error('Sistema aceitou token inválido');
    }
  } catch (error) {
    console.log('❌ Erro ao testar token inválido:', error.message, '\n');
    testsFailed++;
  }

  // Teste 5: Criar novo token
  console.log('📝 Teste 5: Criar novo token de teste');
  const testToken = `TEST-${Date.now()}`;
  try {
    const response = await fetch(`${BASE_URL}/api/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: testToken,
        userId: 'test-user',
        name: 'Teste Automático',
        expiresInDays: 1
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Token criado com sucesso: ${testToken}\n`);
      testsPassed++;
    } else {
      throw new Error(data.error || 'Falha ao criar token');
    }
  } catch (error) {
    console.log('❌ Erro ao criar token:', error.message, '\n');
    testsFailed++;
  }

  // Teste 6: Validar token recém-criado
  console.log('📝 Teste 6: Validar token recém-criado');
  try {
    const response = await fetch(`${BASE_URL}/api/validate-token?token=${testToken}`);
    const data = await response.json();
    
    if (data.valid && data.active) {
      console.log('✅ Token recém-criado é válido e ativo\n');
      testsPassed++;
    } else {
      throw new Error('Token não está válido após criação');
    }
  } catch (error) {
    console.log('❌ Erro ao validar token criado:', error.message, '\n');
    testsFailed++;
  }

  // Teste 7: Desativar token
  console.log('📝 Teste 7: Desativar token');
  try {
    const response = await fetch(`${BASE_URL}/api/tokens/${testToken}/toggle`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Token desativado com sucesso\n');
      testsPassed++;
    } else {
      throw new Error(data.error || 'Falha ao desativar token');
    }
  } catch (error) {
    console.log('❌ Erro ao desativar token:', error.message, '\n');
    testsFailed++;
  }

  // Teste 8: Validar token desativado
  console.log('📝 Teste 8: Verificar se token desativado é rejeitado');
  try {
    const response = await fetch(`${BASE_URL}/api/validate-token?token=${testToken}`);
    const data = await response.json();
    
    if (!data.active) {
      console.log('✅ Token desativado foi corretamente rejeitado\n');
      testsPassed++;
    } else {
      throw new Error('Token desativado ainda está ativo');
    }
  } catch (error) {
    console.log('❌ Erro ao verificar token desativado:', error.message, '\n');
    testsFailed++;
  }

  // Teste 9: Remover token
  console.log('📝 Teste 9: Remover token de teste');
  try {
    const response = await fetch(`${BASE_URL}/api/tokens/${testToken}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Token removido com sucesso\n');
      testsPassed++;
    } else {
      throw new Error(data.error || 'Falha ao remover token');
    }
  } catch (error) {
    console.log('❌ Erro ao remover token:', error.message, '\n');
    testsFailed++;
  }

  // Teste 10: Obter configurações
  console.log('📝 Teste 10: Obter configurações de IDs');
  try {
    const response = await fetch(`${BASE_URL}/api/get-ids?token=VIP-DEMO-2024`);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.replacements)) {
      console.log('✅ Configurações obtidas com sucesso');
      console.log(`   ${data.replacements.length} configuração(ões) ativa(s)\n`);
      testsPassed++;
    } else {
      throw new Error('Formato de resposta inválido');
    }
  } catch (error) {
    console.log('❌ Erro ao obter configurações:', error.message, '\n');
    testsFailed++;
  }

  // Resumo
  console.log('═══════════════════════════════════════');
  console.log('📊 RESUMO DOS TESTES');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Testes aprovados: ${testsPassed}`);
  console.log(`❌ Testes falharam: ${testsFailed}`);
  console.log(`📈 Taxa de sucesso: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════\n');

  if (testsFailed === 0) {
    console.log('🎉 PARABÉNS! Todos os testes passaram!');
    console.log('✅ Seu servidor está funcionando perfeitamente.\n');
    console.log('🔗 Acesse o painel: http://localhost:3000');
    console.log('🔑 Token de teste: VIP-DEMO-2024\n');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os erros acima.');
    console.log('💡 Dica: Certifique-se de que o servidor está rodando.\n');
  }
}

// Executar testes
runTests().catch(error => {
  console.error('❌ Erro fatal durante os testes:', error);
  process.exit(1);
});
