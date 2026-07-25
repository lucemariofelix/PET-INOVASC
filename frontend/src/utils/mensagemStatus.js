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

export { mesclarStatusMensagens, selecionarUltimaMensagem };
