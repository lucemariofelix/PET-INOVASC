const consultaRepository = require("../repositories/consultaRepository");
const mensagemService = require("./mensagemService");
const { TIPOS_MENSAGEM } = require("./mensageriaService");
const { AppError } = require("../errors/AppError");

const ERROS_CANCELAMENTO = {
  CONSULTATION_NOT_FOUND: [404, "Consulta não encontrada."],
  CANCELLATION_NOT_REQUESTED: [409, "Esta consulta não possui solicitação de cancelamento do paciente."],
  CONSULTATION_NOT_CANCELLABLE: [409, "Esta consulta não pode ser cancelada no estado atual."],
};
const ERROS_DESFECHO = {
  CONSULTATION_NOT_FOUND: [404, "Consulta não encontrada."],
  CONSULTATION_OUTCOME_TOO_EARLY: [409, "O desfecho não pode ser registrado antes da data da consulta."],
  CONSULTATION_NOT_OPEN: [409, "Esta consulta já possui um desfecho e não pode ser alterada."],
  INVALID_CONSULTATION_OUTCOME: [400, "Informe REALIZADA ou FALTOU como desfecho."],
};

class ConsultaService {
  async obterConsultasAtrasadas(authHeader) {
    // 1. Regra de Negócio: Calcula a data exata de 150 dias atrás
    const diasAtraso = 150;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtraso);
    const dataFormatada = dataLimite.toISOString();

    // 2. Manda o repositório buscar no banco usando a data calculada e o token de autenticação
    const consultas = await consultaRepository.buscarAtrasadas(
      dataFormatada,
      authHeader,
    );

    // 3. Devolve os dados brutos e o contexto para o Controller
    return {
      dias_regra: diasAtraso,
      corte_de_data: dataFormatada,
      dados: consultas,
    };
  }

  async agendarConsulta(dados, authHeader) {
    // 1. Validações Críticas Cadastrais
    if (!dados.paciente_id) {
      throw new Error(
        "O ID do paciente é obrigatório para agendar uma consulta.",
      );
    }

    if (!dados.tipo_profissional) {
      throw new Error(
        "O tipo de profissional (Médico, Enfermeiro, Dentista...) é obrigatório.",
      );
    }

    if (!dados.data_proxima_consulta) {
      throw new Error("A data da consulta é obrigatória.");
    }

    // 2. Validação de Regra de Negócio: Choque de Horários do Paciente
    const conflito = await consultaRepository.verificarConflitoHorario(
      dados.paciente_id,
      dados.data_proxima_consulta,
      authHeader
    );

    if (conflito) {
      throw new Error(
        `Choque de agenda: Este paciente já possui uma consulta marcada para este mesmo dia e horário com o perfil: ${conflito.tipo_profissional}.`
      );
    }

    // 3. Formatação dos dados para o Banco
    const consultaParaSalvar = {
      paciente_id: dados.paciente_id,
      tipo_profissional: dados.tipo_profissional,
      data_proxima_consulta: dados.data_proxima_consulta,
      // Se mandar a data da última, salva. Se não mandar, fica nulo.
      data_ultima_consulta: dados.data_ultima_consulta || null,
      // Status padrão inicial.
      status_consulta: dados.status_consulta || "AGENDADA",
    };

    // 4. Envia para o Repositório passando o token de autenticação para validar o RLS
    return await consultaRepository.criar(consultaParaSalvar, authHeader);
  }

  // Busca todas sem aplicar regra de atraso
  async obterTodasConsultas(authHeader) {
    return await consultaRepository.listarTodas(authHeader);
  }

  async efetivarCancelamentoSolicitado(consultaId, authHeader) {
    const resultado = await consultaRepository.efetivarCancelamentoSolicitado(
      consultaId,
      authHeader,
    );

    if (!resultado?.sucesso) {
      const [status, mensagem] = ERROS_CANCELAMENTO[resultado?.codigo] || [
        500,
        "Não foi possível cancelar a consulta.",
      ];
      throw new AppError(mensagem, status, resultado?.codigo || "CANCELLATION_ERROR");
    }

    const consulta = await consultaRepository.buscarPorId(consultaId, authHeader);
    let notificacao = { enviada: false, aviso: null };

    if (!resultado.ja_cancelada) {
      try {
        const envio = await mensagemService.dispararMensagem(
          {
            paciente_id: consulta.pacientes.id,
            consulta_id: consulta.id,
            telefone: consulta.pacientes.telefone,
            nome: consulta.pacientes.nome_completo,
            consentimento_msg: consulta.pacientes.consentimento_msg,
            profissional: consulta.tipo_profissional,
            data_referencia: consulta.data_proxima_consulta,
            tipo: TIPOS_MENSAGEM.CANCELAMENTO_CONSULTA,
          },
          authHeader,
        );
        notificacao = { enviada: true, aviso: envio.aviso || null };
      } catch (_error) {
        notificacao = {
          enviada: false,
          aviso: "Consulta cancelada, mas não foi possível avisar o paciente pelo WhatsApp.",
        };
      }
    }

    return { consulta, notificacao, ja_cancelada: resultado.ja_cancelada === true };
  }

  async registrarDesfecho(consultaId, desfecho, authHeader) {
    const resultado = await consultaRepository.registrarDesfecho(
      consultaId,
      desfecho,
      authHeader,
    );

    if (!resultado?.sucesso) {
      const [status, mensagem] = ERROS_DESFECHO[resultado?.codigo] || [
        500,
        "Não foi possível registrar o desfecho da consulta.",
      ];
      throw new AppError(mensagem, status, resultado?.codigo || "CONSULTATION_OUTCOME_ERROR");
    }

    const consulta = await consultaRepository.buscarPorId(consultaId, authHeader);
    let notificacao = { enviada: false, aviso: null };

    if (desfecho === "FALTOU" && !resultado.ja_registrado) {
      try {
        const envio = await mensagemService.dispararMensagem(
          {
            paciente_id: consulta.pacientes.id,
            consulta_id: consulta.id,
            telefone: consulta.pacientes.telefone,
            nome: consulta.pacientes.nome_completo,
            consentimento_msg: consulta.pacientes.consentimento_msg,
            profissional: consulta.tipo_profissional,
            data_referencia: consulta.data_proxima_consulta,
            tipo: TIPOS_MENSAGEM.FALTA_CONSULTA,
          },
          authHeader,
        );
        notificacao = { enviada: true, aviso: envio.aviso || null };
      } catch (_error) {
        notificacao = {
          enviada: false,
          aviso: "Falta registrada, mas não foi possível avisar o paciente pelo WhatsApp.",
        };
      }
    }

    return {
      consulta,
      notificacao,
      ja_registrado: resultado.ja_registrado === true,
    };
  }
}

module.exports = new ConsultaService();
