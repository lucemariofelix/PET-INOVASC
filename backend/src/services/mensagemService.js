const mensageriaService = require("./mensageriaService");
const { TIPOS_MENSAGEM } = require("./mensageriaService");

class MensagemService {
  // ========================================================================
  // MÉTODO 1: DISPARO DE MENSAGENS
  // ========================================================================
  async dispararMensagem(
    {
      paciente_id,
      consulta_id,
      telefone,
      nome,
      nome_completo,
      profissional,
      status_consulta,
      data_referencia,
      tipo = TIPOS_MENSAGEM.LEMBRETE_CONSULTA,
      templateOverride,
      usarBotaoConfirmacao = false,
      consentimento_msg,
    },
    authHeader,
  ) {
    if (!telefone)
      throw new Error(
        "Este paciente não possui um número de telefone cadastrado.",
      );

    const resultado = await mensageriaService.enviarMensagem({
      paciente: {
        id: paciente_id,
        telefone,
        nome_completo: nome_completo || nome,
        consentimento_msg: consentimento_msg === true,
      },
      consulta_id,
      tipo,
      profissional,
      status_consulta,
      data_referencia,
      templateOverride,
      usarBotaoConfirmacao,
      authHeader,
    });

    return resultado.resposta || resultado;
  }

  // ========================================================================
  // MÉTODO 2: CHECAGEM DE STATUS E GERAÇÃO DO QR CODE
  // ========================================================================
  async statusConexaoWhatsApp() {
    return mensageriaService.statusConexaoWhatsApp();
  }
}

module.exports = new MensagemService();
