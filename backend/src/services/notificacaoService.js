// src/services/notificacaoService.js
const notificacaoRepository = require('../repositories/notificacaoRepository');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class NotificacaoService {
  
  async iniciarDisparoLote(dadosDisparo, authHeader) {
    const { pacientes, mensagemBase } = dadosDisparo;

    if (!pacientes || pacientes.length === 0) {
      throw new Error("A lista de pacientes está vazia.");
    }

    if (!mensagemBase || !mensagemBase.includes('{nome}')) {
      throw new Error("A mensagem deve conter a variável {nome} para personalização.");
    }

    // Libera a requisição do frontend imediatamente e roda o envio em background
    this.processarFilaAssincrona(pacientes, mensagemBase);

    return { 
      sucesso: true, 
      mensagem: `Disparo em massa iniciado para ${pacientes.length} pacientes. O processo está rodando em segundo plano.` 
    };
  }

  async processarFilaAssincrona(pacientes, mensagemBase) {
    console.log(`[START] Iniciando fila de mensagens para ${pacientes.length} contatos.`);

    for (const paciente of pacientes) {
      try {
        const primeiroNome = paciente.nome.split(' ')[0];
        const textoFinal = mensagemBase.replace('{nome}', primeiroNome);

        let telefoneLimpo = paciente.telefone.replace(/\D/g, ''); 
        if (!telefoneLimpo.startsWith('55')) {
          telefoneLimpo = `55${telefoneLimpo}`;
        }

        const payloadEvolution = {
          number: telefoneLimpo,
          textMessage: { text: textoFinal }
        };

        // 1. Dispara para o WhatsApp via Evolution API
        const respostaEvolution = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_NAME}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.EVOLUTION_API_KEY
          },
          body: JSON.stringify(payloadEvolution)
        });

        if (!respostaEvolution.ok) {
          throw new Error('Falha na API da Evolution');
        }

        // 2. AQUI ENTRA O REPOSITORY: Grava no histórico do paciente no banco de dados
        await notificacaoRepository.registrarEnvio(paciente.id, textoFinal, 'ENVIADO');

        console.log(`[OK] Mensagem enviada e registrada para ${primeiroNome} (${telefoneLimpo})`);

      } catch (error) {
        console.error(`[ERRO] Falha ao enviar para paciente ID ${paciente.id}:`, error.message);
        
        // Opcional: Você pode registrar a falha no banco também para controle de relatórios
        await notificacaoRepository.registrarEnvio(paciente.id, 'Falha no envio', 'ERRO').catch(()=>null);
      }

      // Delay de segurança anti-ban (entre 4 e 9 segundos)
      const tempoAleatorio = Math.floor(Math.random() * (9000 - 4000 + 1)) + 4000;
      await delay(tempoAleatorio);
    }

    console.log(`[FIM] Fila de mensagens finalizada.`);
  }
}

module.exports = new NotificacaoService();
