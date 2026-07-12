const logRepository = require("../repositories/logRepository");

async function registrarAuditoria(configuracao, contexto) {
  if (!configuracao) return;

  const evento =
    typeof configuracao === "function" ? configuracao(contexto) : configuracao;
  if (!evento) return;

  await logRepository.registrar(
    evento.usuario_id ?? contexto.request.user?.id ?? null,
    evento.acao,
    evento.detalhes || "",
  );
}

async function executarController(request, reply, configuracao) {
  try {
    const resultado = await configuracao.executar();
    await registrarAuditoria(configuracao.auditoria, {
      request,
      resultado,
    });

    return configuracao.responder(resultado);
  } catch (error) {
    await registrarAuditoria(configuracao.auditoriaFalha, {
      request,
      error,
    });

    throw error;
  }
}

module.exports = {
  executarController,
};
