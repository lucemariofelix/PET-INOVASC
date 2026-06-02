export const calcularAtraso = (dataUltima) => {
  // 1. Trava de segurança para dados vazios (Retorna null em vez de 0)
  if (!dataUltima) return null;

  // 2. Isola a data e fixa ao meio-dia para evitar fuso horário
  const dataString = dataUltima.split("T")[0];
  const data = new Date(`${dataString}T12:00:00`);

  // 3. Fixa o 'hoje' ao meio-dia para uma comparação justa
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);

  // 4. Usa Math.round para evitar falhas por milissegundos
  return Math.round(Math.abs(hoje - data) / (1000 * 60 * 60 * 24));
};

export const getBadgeInfo = (consulta) => {
  // --- PARTE 1: AVALIA AGENDAMENTOS FUTUROS ---
  if (consulta.data_proxima_consulta) {
    // Isola a data e fixa ao meio-dia (Mantendo a segurança contra o fuso)
    const dataString = consulta.data_proxima_consulta.split("T")[0];
    const dataProx = new Date(`${dataString}T12:00:00`);

    // Fixa o 'hoje' ao meio-dia
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);

    // Cálculo perfeito dos dias de diferença
    const diffTime = Math.round((dataProx - hoje) / (1000 * 60 * 60 * 24));

    if (diffTime >= 0) {
      if (diffTime === 0)
        return {
          label: "LEMBRETE",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          textoDias: "É Hoje!",
        };
      if (diffTime === 1)
        return {
          label: "LEMBRETE",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          textoDias: "Amanhã",
        };
      if (diffTime === 2)
        return {
          label: "LEMBRETE",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          textoDias: "Faltam 2 dias",
        };

      // NOVA REGRA: Para consultas agendadas para mais de 2 dias no futuro
      return {
        label: "AGENDADO",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        textoDias: `Em ${diffTime} dias`,
      };
    }
  }

  // --- PARTE 2: AVALIA ATRASOS (O Passado) ---
  const dias = calcularAtraso(consulta.data_ultima_consulta);

  // NOVA REGRA: O que fazer quando não sabemos a última data? (Captura o null)
  if (dias === null) {
    return {
      label: "SEM REGISTO",
      color: "bg-red-100 text-red-800 border-red-200",
      textoDias: "Data desconhecida",
    };
  }

  const textoDias = `${dias} dias`;

  // Regras de atraso padrão
  if (dias > 180)
    return {
      label: "URGENTE",
      color: "bg-red-100 text-red-800 border-red-200",
      textoDias,
    };
  if (dias >= 150)
    return {
      label: "ALERTA",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      textoDias,
    };

  return {
    label: "OK",
    color: "bg-green-100 text-green-800 border-green-200",
    textoDias,
  };
};
