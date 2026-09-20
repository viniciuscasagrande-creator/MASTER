import { GeminiService } from '../src/core/ai';

async function runGeminiTests() {
  console.log('================================================================');
  console.log('   TESTES DE INTEGRAÇÃO COM GOOGLE GEMINI AI');
  console.log('================================================================');

  try {
    console.log('1. Testando geração básica com GeminiService...');
    const reply = await GeminiService.generateContent('Responda estritamente a palavra OK.');
    console.log('   -> Resposta do Gemini:', reply.trim());
    if (!reply.toLowerCase().includes('ok')) {
      throw new Error(`Resposta inesperada: ${reply}`);
    }
    console.log('✓ Teste 1 passou: Comunicação com a API do Google Gemini validada com sucesso.');

    console.log('\n2. Testando sumarização inteligente de contrato comercial...');
    const summary = await GeminiService.summarizeContract('Contrato DiskIngressos Teste', [
      { type: 'TICKET_FEE', percentage: 10, minFeeCents: 200 },
      { type: 'GATEWAY_SURCHARGE', percentage: 2.5 }
    ]);
    console.log('   -> Resumo gerado (amostra):', summary.slice(0, 100) + '...');
    if (!summary || summary.length < 20) {
      throw new Error('Resumo muito curto ou vazio');
    }
    console.log('✓ Teste 2 passou: Sumarização executiva de contratos funcionando perfeitamente.');

    console.log('\n================================================================');
    console.log('TODOS OS TESTES DO GEMINI AI FORAM APROVADOS COM SUCESSO! 🎉');
    console.log('================================================================');
  } catch (error: any) {
    console.error('❌ Falha nos testes do Gemini AI:', error.message);
    process.exit(1);
  }
}

runGeminiTests();
