// IMPORTAÇÃO: Precisamos chamar o repositório de dados para salvar no banco
const mensagemRepository = require('../repositories/mensagemRepository');

class MensagemService {
  // MODIFICAÇÃO: Agora recebe o paciente_id e o segundo parâmetro authHeader
  async dispararMensagem({ paciente_id, telefone, nome, profissional, status_consulta, data_referencia }, authHeader) {
    // 1. A Trava de Segurança
    if (!telefone) {
      throw new Error('Este paciente não possui um número de telefone cadastrado.');
    }

    // 2. Formatação
    const numeroLimpo = telefone.replace(/\D/g, '');
    const telefoneFormatado = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;

    // 3. Lógica do Texto
    let texto = `Olá, *${nome}*! Aqui é da sua Unidade Básica de Saúde.\n\n`;
    if (status_consulta === 'atrasado' || status_consulta === 'urgente') {
      texto += `Consta em nosso sistema que seu acompanhamento com o(a) profissional *${profissional}* está pendente desde *${data_referencia}*.\n\nPor favor, procure o seu Agente Comunitário de Saúde (ACS) ou a recepção da UBS para regularizar sua situação. Cuidar da sua saúde é fundamental!`;
    } else {
      texto += `Este é um lembrete de que você tem um acompanhamento previsto com o(a) profissional *${profissional}* para a data *${data_referencia}*.\n\nContamos com a sua presença!`;
    }

    // 4. Integração AWS
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const apikey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE;

    if (!evolutionUrl || !apikey || !instanceName) {
      console.log("Simulação de Envio:", { telefoneFormatado, texto });
      
      // SALVA NO BANCO MESMO NA SIMULAÇÃO: Excelente para validar o funcionamento
      await mensagemRepository.salvarHistorico({
        telefone_destino: telefoneFormatado,
        texto_enviado: texto,
        status: 'SIMULADO',
        paciente_id: paciente_id || null
      }, authHeader);

      return { aviso: "Mensagem simulada. Configure as variáveis." };
    }

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

    // MODIFICAÇÃO: Se o envio deu certo na API externa, salvamos o histórico de verdade no Supabase
    await mensagemRepository.salvarHistorico({
      telefone_destino: telefoneFormatado,
      texto_enviado: texto,
      status: 'ENVIADO',
      paciente_id: paciente_id || null
    }, authHeader);

    return data;
  }
}

module.exports = new MensagemService();
