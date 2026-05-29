// IMPORTAÇÃO: Chamar o repositório de dados para salvar no banco
const mensagemRepository = require('../repositories/mensagemRepository');

class MensagemService {
  
  // ========================================================================
  // MÉTODO 1: DISPARO DE MENSAGENS (COM VÍNCULO DE CONSULTA E PACIENTE)
  // ========================================================================
  async dispararMensagem({ paciente_id, consulta_id, telefone, nome, profissional, status_consulta, data_referencia }, authHeader) {
    // 1. A Trava de Segurança
    if (!telefone) {
      throw new Error('Este paciente não possui um número de telefone cadastrado.');
    }

    // 2. Formatação do Telefone
    const numeroLimpo = telefone.replace(/\D/g, '');
    const telefoneFormatado = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;

    // 3. Tratamento e Inversão da Data (Evitando Fuso Horário)
    let dataFormatada = data_referencia;
    if (data_referencia && data_referencia.includes('-')) {
      const [ano, mes, dia] = data_referencia.split('-');
      dataFormatada = `${dia}/${mes}/${ano}`;
    }

    // 4. Lógica do Texto
    let texto = `Olá, *${nome}*! Aqui é da sua Unidade Básica de Saúde.\n\n`;
    if (status_consulta === 'atrasado' || status_consulta === 'urgente') {
      texto += `Consta em nosso sistema que seu acompanhamento com o(a) profissional *${profissional}* está pendente desde *${dataFormatada}*.\n\nPor favor, procure o seu Agente Comunitário de Saúde (ACS) ou a recepção da UBS para regularizar sua situação. Cuidar da sua saúde é fundamental!`;
    } else {
      texto += `Este é um lembrete de que você tem um acompanhamento previsto com o(a) profissional *${profissional}* para a data *${dataFormatada}*.\n\nContamos com a sua presença!`;
    }

    // 5. Integração AWS (Evolution API)
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const apikey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

    // Se faltar configuração no .env, faz apenas uma simulação e salva no banco
    if (!evolutionUrl || !apikey || !instanceName) {
      console.log("Simulação de Envio:", { telefoneFormatado, texto });
      
      await mensagemRepository.salvarHistorico({
        telefone_destino: telefoneFormatado,
        texto_enviado: texto,
        status: 'SIMULADO',
        paciente_id: paciente_id || null,
        consulta_id: consulta_id || null
      }, authHeader);

      return { aviso: "Mensagem simulada. Configure as variáveis." };
    }

    // Disparo Real
    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey
      },
      body: JSON.stringify({ number: telefoneFormatado, text: texto })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.response?.message || 'Falha ao enviar via Evolution');
    }

    // Salva o histórico Real no Supabase vinculando à consulta correta
    await mensagemRepository.salvarHistorico({
      telefone_destino: telefoneFormatado,
      texto_enviado: texto,
      status: 'ENVIADO',
      paciente_id: paciente_id || null,
      consulta_id: consulta_id || null // <-- Correção aplicada aqui!
    }, authHeader);

    return data;
  }

  // ========================================================================
  // MÉTODO 2: CHECAGEM DE STATUS E GERAÇÃO DO QR CODE (TELA DE CONFIGURAÇÕES)
  // ========================================================================
  async statusConexaoWhatsApp() {
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const apikey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

    if (!evolutionUrl || !apikey || !instanceName) {
      return { status: 'unconfigured', mensagem: 'Variáveis da Evolution não configuradas no .env' };
    }

    try {
      const response = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': apikey }
      });
      
      const data = await response.json();

      // Se a API devolveu a imagem em base64, o WhatsApp precisa ser lido
      if (data.base64) {
        return { status: 'qrcode', qrcode: data.base64 };
      }
      
      // Se a instância já estiver conectada/aberta
      if (data.instance?.state === 'open' || data.state === 'open') {
         return { status: 'connected' };
      }

      return { status: 'disconnected' };
    } catch (error) {
      console.error("Erro ao conectar com Evolution API:", error);
      return { status: 'error', mensagem: 'Servidor do WhatsApp offline.' };
    }
  }

}

module.exports = new MensagemService();
