export const obterNomeAgentePaciente = (paciente) =>
  paciente?.agente?.nome || paciente?.acs || "Área Descoberta";

export const substituirPacienteAtualizado = (pacientes, atualizado) =>
  pacientes.map((paciente) =>
    paciente.id === atualizado.id ? atualizado : paciente,
  );
