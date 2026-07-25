const selecionarUltimaMensagem = (mensagens) => {
  if (!Array.isArray(mensagens) || mensagens.length === 0) return null;

  return mensagens.reduce((maisRecente, mensagem) => {
    if (!maisRecente) return mensagem;
    return new Date(mensagem.data_envio) > new Date(maisRecente.data_envio)
      ? mensagem
      : maisRecente;
  }, null);
};

const mesclarStatusMensagens = (consultas, mensagensAtualizadas) => {
  if (!Array.isArray(consultas) || !Array.isArray(mensagensAtualizadas)) {
    return Array.isArray(consultas) ? consultas : [];
  }

  const porConsulta = new Map(
    mensagensAtualizadas
      .filter((mensagem) => mensagem?.consulta_id)
      .map((mensagem) => [mensagem.consulta_id, mensagem]),
  );

  return consultas.map((consulta) => {
    const mensagemAtualizada = porConsulta.get(consulta.id);
    if (!mensagemAtualizada) return consulta;

    const historico = [...(consulta.historico_mensagens || [])];
    const indice = historico.findIndex(
      (mensagem) =>
        (mensagemAtualizada.id && mensagem.id === mensagemAtualizada.id) ||
        (mensagemAtualizada.mensagem_id &&
          mensagem.mensagem_id === mensagemAtualizada.mensagem_id),
    );

    if (indice >= 0) {
      historico[indice] = { ...historico[indice], ...mensagemAtualizada };
    } else {
      historico.unshift(mensagemAtualizada);
    }

    return { ...consulta, historico_mensagens: historico };
  });
};

const obterEstadoConfirmacao = (mensagem, agora = new Date()) => {
  const status = mensagem?.confirmacao_status;
  if (!status) return "SEM_CONFIRMACAO";
  if (status === "CONFIRMADO") return "CONFIRMADO";
  if (status === "CANCELAMENTO_SOLICITADO") {
    return "CANCELAMENTO_SOLICITADO";
  }

  if (status === "PENDENTE" && mensagem.confirmacao_expira_em) {
    const expiracao = new Date(mensagem.confirmacao_expira_em);
    if (!Number.isNaN(expiracao.getTime()) && expiracao <= agora) {
      return "EXPIRADO";
    }
  }

  return "PENDENTE";
};

export {
  mesclarStatusMensagens,
  obterEstadoConfirmacao,
  selecionarUltimaMensagem,
};
