const { supabase } = require('../config/supabase'); // Ajuste o caminho se necessário

exports.receberStatusEvolution = async (request, reply) => {
  try {
    const payload = request.body;
    
    // 1. Log para você ver exatamente o que a Evolution manda (útil para debugar no Render)
    console.log('🔔 Webhook Recebido da Evolution:', JSON.stringify(payload, null, 2));

    // 2. A Evolution envia vários eventos. Só queremos os de atualização de mensagem (entregue/lida)
    // O formato exato depende da versão da sua Evolution, mas geralmente o evento é 'MESSAGES_UPDATE'
    if (payload.event === 'messages.update' || payload.event === 'MESSAGES_UPDATE') {
      
      // Extrai o número de telefone (a Evolution costuma enviar com @s.whatsapp.net no final)
      const remoteJid = payload.data?.key?.remoteJid || payload.data[0]?.key?.remoteJid;
      const telefone = remoteJid ? remoteJid.replace('@s.whatsapp.net', '') : null;
      
      const statusMensagem = payload.data?.update?.status || payload.data[0]?.update?.status; 
      // Status comuns: 2 (Recebido), 3 (Lido), 4 (Assistido)

      if (telefone && statusMensagem) {
        
        // 3. Atualiza o banco de dados (Supabase)
        // Aqui assumimos que você quer registrar que a pessoa foi notificada
        const { error } = await supabase
          .from('pacientes') // ou 'consultas', dependendo de onde você guarda o telefone
          .update({ 
            // Você precisará ter essas colunas criadas lá no seu Supabase
            ultima_notificacao_status: statusMensagem === 3 ? 'LIDO' : 'ENTREGUE',
            data_ultima_notificacao: new Date().toISOString() 
          })
          .like('telefone', `%${telefone.substring(2)}%`); // Busca parcial ignorando o código do país (55)

        if (error) {
          console.error('Erro ao atualizar Supabase via Webhook:', error.message);
        } else {
          console.log(`✅ Paciente do telefone ${telefone} atualizado com sucesso!`);
        }
      }
    }

    // 4. Regra de Ouro do Webhook: Responda rápido com 200 OK, senão a Evolution tenta mandar de novo
    return reply.status(200).send({ recebido: true });

  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ erro: 'Falha interna no processamento do webhook' });
  }
};
