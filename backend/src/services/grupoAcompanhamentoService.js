const grupoAcompanhamentoRepository = require("../repositories/grupoAcompanhamentoRepository");
const notificacaoService = require("./notificacaoService");

class GrupoAcompanhamentoService {
  async listarGrupos(authHeader) {
    return await grupoAcompanhamentoRepository.listarTodos(authHeader);
  }

  async criarGrupo(dados, authHeader) {
    const nome = dados.nome?.trim();

    if (!nome || nome.length < 2) {
      throw new Error("O nome do grupo deve ter pelo menos 2 caracteres.");
    }

    const payload = {
      nome,
      descricao: dados.descricao?.trim() || null,
    };

    return await grupoAcompanhamentoRepository.criar(payload, authHeader);
  }

  async dispararMensagens(grupoId, mensagem, usuarioId, authHeader) {
    if (!grupoId) {
      throw new Error("Informe o grupo para iniciar o disparo.");
    }

    const mensagemFinal = mensagem?.trim();

    if (!mensagemFinal) {
      throw new Error("Informe a mensagem para iniciar o disparo.");
    }

    const pacientes = await grupoAcompanhamentoRepository.listarPacientesDoGrupo(
      grupoId,
      authHeader,
    );

    if (!pacientes || pacientes.length === 0) {
      throw new Error("Nenhum paciente vinculado a este grupo.");
    }

    const resumo = {
      total: pacientes.length,
      enviados: 0,
      falhas: 0,
    };

    for (const paciente of pacientes) {
      try {
        await notificacaoService.enviarMensagemPaciente({
          paciente,
          mensagem: mensagemFinal,
          usuario_id: usuarioId,
        });

        resumo.enviados += 1;

        await this.sleep(this.calcularDelayDisparo());
      } catch (error) {
        resumo.falhas += 1;

        console.error(
          `[GRUPO_DISPARO] Falha ao enviar para paciente ID ${paciente.id}:`,
          error.message,
        );

        let telefoneLimpo = "";
        try {
          telefoneLimpo = notificacaoService.sanitizarTelefone(
            paciente.telefone,
          );
        } catch {
          telefoneLimpo = "";
        }

        await notificacaoService
          .registrarFalhaEnvio({
            paciente,
            telefone: telefoneLimpo,
            mensagem: mensagemFinal,
            usuario_id: usuarioId,
            status: "FALHA",
          })
          .catch((erroRegistro) => {
            console.error(
              `[GRUPO_DISPARO] Falha ao registrar erro do paciente ID ${paciente.id}:`,
              erroRegistro.message,
            );
          });
      }
    }

    return {
      sucesso: true,
      mensagem: `Disparo finalizado: ${resumo.enviados} enviada(s), ${resumo.falhas} falha(s).`,
      ...resumo,
    };
  }

  calcularDelayDisparo() {
    return Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new GrupoAcompanhamentoService();
