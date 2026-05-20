exports.enviarMensagem = async (request, reply) => {
  try {
    // 1. Recebe os dados do Frontend
    const { telefone, nome, profissional, status_consulta, data_referencia } = request.body;

    // 2. Limpa o telefone (remove parênteses, traços e espaços) e adiciona o 55 (Brasil)
    // A Evolution exige o formato: 55DDD9NNNNNNNN
    const numeroLimpo = telefone.replace(/\D/g, '');
    const telefoneFormatado = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;

    // 3. Monta o texto da mensagem com base no status
    let texto = `Olá, *${nome}*! Aqui é da sua Unidade Básica de Saúde.\n\n`;
    
    if (status_consulta === 'atrasado' || status_consulta === 'urgente') {
      texto += `Consta em nosso sistema que seu acompanhamento com o(a) profissional *${profissional}* está pendente desde *${data_referencia}*.\n\nPor favor, procure o seu Agente Comunitário de Saúde (ACS) ou a recepção da UBS para regularizar sua situação. Cuidar da sua saúde é fundamental!`;
    } else {
      texto += `Este é um lembrete de que você tem um acompanhamento previsto com o(a) profissional *${profissional}* para a data *${data_referencia}*.\n\nContamos com a sua presença!`;
    }

    // 4. Prepara a chamada para a Evolution API
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const apikey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE;

    // Trava de segurança caso falte as variáveis no Render
    if (!evolutionUrl || !apikey || !instanceName) {
      console.log("Simulação de Envio (Variáveis da Evolution ausentes no .env):", { telefoneFormatado, texto });
      return reply.status(200).send({ 
        sucesso: true, 
        aviso: "Mensagem simulada. Configure as variáveis EVOLUTION no backend para disparar de verdade." 
      });
    }

    // 5. Dispara para a Evolution (usando o fetch nativo do Node.js)
    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey
      },
      body: JSON.stringify({
        number: telefoneFormatado,
        text: texto
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.response?.message || 'Falha ao enviar via Evolution');
    }

    return reply.status(200).send({ sucesso: true, evolution: data });

  } catch (error) {
    request.log.error('Erro ao disparar WhatsApp:', error);
    return reply.status(500).send({ erro: 'Falha interna ao tentar disparar a mensagem.' });
  }
};
