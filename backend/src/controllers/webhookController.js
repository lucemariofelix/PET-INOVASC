const { supabaseAdmin } = require('../config/supabase'); 

class WebhookController {
  async receberStatusEvolution(request, reply) {
    try {
      const payload = request.body;
      
      // Log para auditoria no Render
      console.log('🔔 [WEBHOOK] Evento recebido da Evolution:', payload.event);

      if (payload.event === 'messages.update' || payload.event === 'MESSAGES_UPDATE') {
        // A Evolution pode mandar em formato de objeto único ou array, essa lógica cobre os dois
        const data = Array.isArray(payload.data) ? payload.data[0] : payload.data;
        
        const remoteJid = data?.key?.remoteJid;
        const telefone = remoteJid ? remoteJid.replace('@s.whatsapp.net', '') : null;
        
        // Status da Evolution: 2 (Entregue), 3 (Lido), 4 (Assistido/Reproduzido)
        const statusMensagemNum = data?.update?.status; 
        
        if (telefone && statusMensagemNum) {
          let statusFormatado = null;
          
          if (statusMensagemNum === 2) statusFormatado = 'ENTREGUE';
          if (statusMensagemNum === 3 || statusMensagemNum === 4) statusFormatado = 'LIDO';

          if (statusFormatado) {
            // Atualiza o histórico de mensagens desse paciente que ainda estava como "ENVIADO" ou "ENTREGUE"
            // Retiramos o 55 e o DDD para garantir a busca parcial do número
            const numeroLimpo = telefone.substring(2); 

            const { error } = await supabaseAdmin
              .from('historico_mensagens')
              .update({ status: statusFormatado })
              .like('telefone_destino', `%${numeroLimpo}%`)
              .in('status', ['ENVIADO', 'ENTREGUE']); // Evita reescrever status de ERRO

            if (error) {
              console.error('[WEBHOOK ERRO] Falha ao atualizar Supabase:', error.message);
            } else {
              console.log(`✅ [WEBHOOK] Status atualizado para ${statusFormatado} (Tel: ${telefone})`);
            }
          }
        }
      }

      // Regra de Ouro: Devolver 200 OK imediatamente para a Evolution não bloquear a fila
      return reply.code(200).send({ recebido: true });

    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ erro: 'Falha interna no processamento do webhook' });
    }
  }
}

module.exports = new WebhookController();
