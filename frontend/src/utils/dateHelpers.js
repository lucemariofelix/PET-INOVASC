export const calcularAtraso = (dataUltima) => {
  if (!dataUltima) return 0;
  
  // 1. Isola a data e fixa ao meio-dia para evitar fuso horário
  const dataString = dataUltima.split("T")[0];
  const data = new Date(`${dataString}T12:00:00`);
  
  // 2. Fixa o 'hoje' ao meio-dia para uma comparação justa
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  
  // 3. Usa Math.round para evitar falhas por milissegundos
  return Math.round(Math.abs(hoje - data) / (1000 * 60 * 60 * 24));
};

export const getBadgeInfo = (consulta) => {
  if (consulta.data_proxima_consulta) {
    // 1. Isola a data e fixa ao meio-dia
    const dataString = consulta.data_proxima_consulta.split("T")[0];
    const dataProx = new Date(`${dataString}T12:00:00`);
    
    // 2. Fixa o 'hoje' ao meio-dia
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    
    // 3. Cálculo perfeito dos dias de diferença
    const diffTime = Math.round((dataProx - hoje) / (1000 * 60 * 60 * 24));
    
    if (diffTime >= 0 && diffTime <= 2) {
      return { 
        label: "LEMBRETE", 
        color: "bg-blue-100 text-blue-800 border-blue-200", 
        // Adicionada uma validação extra para o "Amanhã" ficar mais natural
        textoDias: diffTime === 0 ? "É Hoje!" : diffTime === 1 ? "Amanhã" : `Faltam ${diffTime} dias` 
      };
    }
  }
  
  const dias = calcularAtraso(consulta.data_ultima_consulta);
  const textoDias = `${dias} dias`;
  
  if (dias > 180) return { label: "URGENTE", color: "bg-red-100 text-red-800 border-red-200", textoDias };
  if (dias >= 150) return { label: "ALERTA", color: "bg-yellow-100 text-yellow-800 border-yellow-200", textoDias };
  
  return { label: "OK", color: "bg-green-100 text-green-800 border-green-200", textoDias };
};
