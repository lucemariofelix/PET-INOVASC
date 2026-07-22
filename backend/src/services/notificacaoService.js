const mensageriaService = require("./mensageriaService");
const { TIPOS_MENSAGEM } = require("./mensageriaService");

class NotificacaoService {
  async iniciarDisparoLote(dadosDisparo, authHeader) {
    const { pacientes, mensagemBase, usuario_id } = dadosDisparo;

    if (!pacientes || pacientes.length === 0) {
      throw new Error("A lista de pacientes está vazia.");
    }

    if (!mensagemBase || !mensagemBase.includes("{nome}")) {
      throw new Error(
        "A mensagem deve conter a variável {nome} para personalização.",
      );
    }

    await this.verificarConexaoWhatsApp();

    this.processarFilaAssincrona(pacientes, mensagemBase, usuario_id);

    return {
      sucesso: true,
      mensagem: `Disparo em massa iniciado para ${pacientes.length} pacientes. O processo está rodando em segundo plano.`,
    };
  }

  async processarFilaAssincrona(pacientes, mensagemBase, usuario_id) {
    return mensageriaService.processarLote({
      pacientes,
      mensagemBase,
      usuario_id,
      tipo: TIPOS_MENSAGEM.AVISO_GERAL,
    });
  }

  sanitizarTelefone(telefone) {
    return mensageriaService.sanitizarTelefone(telefone);
  }

  async verificarConexaoWhatsApp() {
    return mensageriaService.verificarConexaoWhatsApp();
  }

  async enviarMensagemPaciente({
    paciente,
    mensagem,
    usuario_id,
    tipo = TIPOS_MENSAGEM.AVISO_GERAL,
    usarBotaoConfirmacao = false,
  } = {}) {
    if (!paciente?.id || !paciente?.telefone || !mensagem) {
      throw new Error("Paciente inválido para envio de mensagem.");
    }

    return mensageriaService.enviarMensagem({
      paciente: {
        ...paciente,
        consentimento_msg: paciente.consentimento_msg === true,
      },
      mensagem,
      usuario_id,
      tipo,
      usarBotaoConfirmacao,
    });
  }

  async registrarFalhaEnvio({
    paciente,
    telefone,
    mensagem,
    usuario_id,
    status = "ERRO",
  }) {
    return mensageriaService.registrarFalhaEnvio({
      paciente,
      telefone,
      mensagem,
      status,
      usuario_id,
      tipo: TIPOS_MENSAGEM.AVISO_GERAL,
    });
  }
}

module.exports = new NotificacaoService();
