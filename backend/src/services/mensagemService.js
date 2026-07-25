const mensageriaService = require("./mensageriaService");
const { TIPOS_MENSAGEM } = require("./mensageriaService");
const mensagemRepository = require("../repositories/mensagemRepository");
const { ValidationError } = require("../errors/AppError");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    const { evolutionUrl, apikey, instanceName } =
      mensageriaService.obterConfigEvolution();
    if (evolutionUrl && apikey && instanceName) {
      await mensageriaService.verificarConexaoWhatsApp();
    }

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

    return {
      mensagem: resultado.mensagem,
      ...(resultado.aviso ? { aviso: resultado.aviso } : {}),
    };
  }

  async listarStatusMensagens(consultaIdsBrutos, authHeader) {
    const consultaIds = String(consultaIdsBrutos || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (consultaIds.length === 0) {
      throw new ValidationError("Informe ao menos uma consulta para verificar.");
    }

    const idsUnicos = [...new Set(consultaIds)];
    if (idsUnicos.length > 20) {
      throw new ValidationError("Consulte no máximo 20 consultas por vez.");
    }

    if (idsUnicos.some((id) => !UUID_REGEX.test(id))) {
      throw new ValidationError(
        "Um ou mais identificadores de consulta são inválidos.",
      );
    }

    return mensagemRepository.listarUltimasPorConsultas(idsUnicos, authHeader);
  }

  // ========================================================================
  // MÉTODO 2: CHECAGEM DE STATUS E GERAÇÃO DO QR CODE
  // ========================================================================
  async statusConexaoWhatsApp() {
    return mensageriaService.statusConexaoWhatsApp();
  }
}

module.exports = new MensagemService();
