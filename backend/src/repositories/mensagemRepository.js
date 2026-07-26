const { getSupabaseUsuario } = require("../config/supabase");

const CAMPOS_STATUS_MENSAGEM = `
  id,
  mensagem_id,
  consulta_id,
  paciente_id,
  status,
  status_ordem,
  data_envio,
  status_atualizado_em,
  entregue_em,
  lido_em,
  confirmacao_status,
  confirmado_em,
  confirmacao_expira_em,
  respondido_em,
  resposta_confirmacao,
  botao_id,
  tipo_mensagem
`;

const dataConfirmacao = (mensagem) =>
  new Date(
    mensagem.respondido_em ||
      mensagem.confirmado_em ||
      mensagem.data_envio ||
      0,
  ).getTime();

const selecionarMaisRecente = (mensagens) =>
  mensagens.reduce((maisRecente, mensagem) => {
    if (!maisRecente) return mensagem;
    return dataConfirmacao(mensagem) > dataConfirmacao(maisRecente)
      ? mensagem
      : maisRecente;
  }, null);

const projetarConfirmacao = (mensagem, statusOverride) => {
  if (!mensagem) return null;
  return {
    id: mensagem.id,
    confirmacao_status: statusOverride || mensagem.confirmacao_status,
    confirmado_em: mensagem.confirmado_em,
    confirmacao_expira_em: mensagem.confirmacao_expira_em,
    respondido_em: mensagem.respondido_em,
    resposta_confirmacao: mensagem.resposta_confirmacao,
  };
};

const selecionarConfirmacaoEfetiva = (mensagens, agora = new Date()) => {
  const itens = Array.isArray(mensagens) ? mensagens : [];
  const terminais = itens.filter((mensagem) =>
    ["CONFIRMADO", "CANCELAMENTO_SOLICITADO"].includes(
      mensagem.confirmacao_status,
    ),
  );
  if (terminais.length > 0) {
    return projetarConfirmacao(selecionarMaisRecente(terminais));
  }

  const pendentesAtivas = itens.filter((mensagem) => {
    if (mensagem.confirmacao_status !== "PENDENTE") return false;
    const expiracao = new Date(mensagem.confirmacao_expira_em || 0);
    return !Number.isNaN(expiracao.getTime()) && expiracao > agora;
  });
  if (pendentesAtivas.length > 0) {
    return projetarConfirmacao(selecionarMaisRecente(pendentesAtivas));
  }

  const expiradas = itens.filter((mensagem) => {
    if (mensagem.confirmacao_status === "EXPIRADO") return true;
    if (mensagem.confirmacao_status !== "PENDENTE") return false;
    const expiracao = new Date(mensagem.confirmacao_expira_em || 0);
    return !Number.isNaN(expiracao.getTime()) && expiracao <= agora;
  });
  return projetarConfirmacao(
    selecionarMaisRecente(expiradas),
    expiradas.length > 0 ? "EXPIRADO" : undefined,
  );
};

class MensagemRepository {
  // O authHeader é obrigatório para o Supabase (RLS) saber quem está salvando
  async salvarHistorico(dadosHistorico, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("historico_mensagens")
      .insert([dadosHistorico])
      .select(CAMPOS_STATUS_MENSAGEM)
      .single();

    if (error) {
      console.error("Erro ao salvar histórico de mensagem no Supabase:", error);
      throw error;
    }

    return data;
  }

  async reservarDisparoConfirmacao(dados, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient.rpc(
      "reservar_disparo_confirmacao",
      {
        p_consulta_id: dados.consulta_id,
        p_paciente_id: dados.paciente_id,
        p_telefone_destino: dados.telefone_destino,
        p_texto_enviado: dados.texto_enviado,
        p_tipo_mensagem: dados.tipo_mensagem,
        p_botao_id: dados.botao_id || null,
      },
    );

    if (error) throw error;
    return data;
  }

  async finalizarDisparoConfirmacao(historicoId, mensagemId, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient.rpc(
      "finalizar_disparo_confirmacao",
      {
        p_historico_id: historicoId,
        p_mensagem_id: mensagemId,
      },
    );

    if (error) throw error;
    return data;
  }

  async falharDisparoConfirmacao(historicoId, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);
    const { data, error } = await supabaseClient.rpc(
      "falhar_disparo_confirmacao",
      { p_historico_id: historicoId },
    );

    if (error) throw error;
    return data;
  }

  async listarUltimasPorConsultas(consultaIds, authHeader) {
    const supabaseClient = getSupabaseUsuario(authHeader);

    const { data, error } = await supabaseClient
      .from("historico_mensagens")
      .select(CAMPOS_STATUS_MENSAGEM)
      .in("consulta_id", consultaIds)
      .order("data_envio", { ascending: false });

    if (error) throw error;

    const porConsulta = new Map();
    for (const mensagem of data || []) {
      const historico = porConsulta.get(mensagem.consulta_id) || [];
      historico.push(mensagem);
      porConsulta.set(mensagem.consulta_id, historico);
    }

    return [...porConsulta.values()].map((historico) => ({
      ...historico[0],
      confirmacao_efetiva: selecionarConfirmacaoEfetiva(historico),
    }));
  }
}

module.exports = new MensagemRepository();
module.exports.CAMPOS_STATUS_MENSAGEM = CAMPOS_STATUS_MENSAGEM;
module.exports.selecionarConfirmacaoEfetiva = selecionarConfirmacaoEfetiva;
