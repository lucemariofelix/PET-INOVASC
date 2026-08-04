const selecionarUltimaMensagem = (mensagens) => {
  if (!Array.isArray(mensagens) || mensagens.length === 0) return null;

  return mensagens.reduce((maisRecente, mensagem) => {
    if (!maisRecente) return mensagem;
    return new Date(mensagem.data_envio) > new Date(maisRecente.data_envio)
      ? mensagem
      : maisRecente;
  }, null);
};

const dataConfirmacao = (mensagem) =>
  new Date(
    mensagem?.respondido_em ||
      mensagem?.confirmado_em ||
      mensagem?.data_envio ||
      0,
  ).getTime();

const selecionarMaisRecente = (mensagens) =>
  mensagens.reduce((maisRecente, mensagem) => {
    if (!maisRecente) return mensagem;
    return dataConfirmacao(mensagem) > dataConfirmacao(maisRecente)
      ? mensagem
      : maisRecente;
  }, null);

const selecionarConfirmacaoEfetiva = (mensagens, agora = new Date()) => {
  const historico = Array.isArray(mensagens) ? mensagens : [];
  const terminais = historico.filter((mensagem) =>
    ["CONFIRMADO", "CANCELAMENTO_SOLICITADO"].includes(
      mensagem?.confirmacao_status,
    ),
  );
  if (terminais.length > 0) return selecionarMaisRecente(terminais);

  const pendentes = historico.filter((mensagem) => {
    if (mensagem?.confirmacao_status !== "PENDENTE") return false;
    const expiracao = new Date(mensagem.confirmacao_expira_em || 0);
    return !Number.isNaN(expiracao.getTime()) && expiracao > agora;
  });
  if (pendentes.length > 0) return selecionarMaisRecente(pendentes);

  const expiradas = historico.filter((mensagem) => {
    if (mensagem?.confirmacao_status === "EXPIRADO") return true;
    if (mensagem?.confirmacao_status !== "PENDENTE") return false;
    const expiracao = new Date(mensagem.confirmacao_expira_em || 0);
    return !Number.isNaN(expiracao.getTime()) && expiracao <= agora;
  });
  const expirada = selecionarMaisRecente(expiradas);
  return expirada
    ? { ...expirada, confirmacao_status: "EXPIRADO" }
    : null;
};

const podeEfetivarCancelamento = (consulta, agora = new Date()) => {
  if (consulta?.status_consulta !== "AGENDADA") return false;
  const confirmacao =
    consulta.confirmacao_whatsapp ||
    selecionarConfirmacaoEfetiva(consulta.historico_mensagens || [], agora);
  return confirmacao?.confirmacao_status === "CANCELAMENTO_SOLICITADO";
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

    return {
      ...consulta,
      historico_mensagens: historico,
      ultima_mensagem_whatsapp: mensagemAtualizada,
      confirmacao_whatsapp:
        mensagemAtualizada.confirmacao_efetiva ||
        selecionarConfirmacaoEfetiva(historico) ||
        consulta.confirmacao_whatsapp,
    };
  });
};

const obterEstadoConfirmacao = (mensagem, agora = new Date()) => {
  const status = mensagem?.confirmacao_status;
  if (!status) return "SEM_CONFIRMACAO";
  if (status === "CONFIRMADO") return "CONFIRMADO";
  if (status === "CANCELAMENTO_SOLICITADO") {
    return "CANCELAMENTO_SOLICITADO";
  }
  if (status === "EXPIRADO") return "EXPIRADO";
  if (status === "SUBSTITUIDO") return "SEM_CONFIRMACAO";

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
  selecionarConfirmacaoEfetiva,
  podeEfetivarCancelamento,
  selecionarUltimaMensagem,
};
