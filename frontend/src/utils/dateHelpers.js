export const calcularAtraso = (dataUltima) => {
  if (!dataUltima) return 0;
  const hoje = new Date(); 
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(dataUltima); 
  data.setHours(0, 0, 0, 0);
  return Math.ceil(Math.abs(hoje - data) / (1000 * 60 * 60 * 24));
};

export const getBadgeInfo = (consulta) => {
  if (consulta.data_proxima_consulta) {
    const hoje = new Date(); 
    hoje.setHours(0, 0, 0, 0);
    const dataProx = new Date(consulta.data_proxima_consulta); 
    dataProx.setHours(0, 0, 0, 0);
    const diffTime = (dataProx - hoje) / (1000 * 60 * 60 * 24);
    
    if (diffTime >= 0 && diffTime <= 2) {
      return { 
        label: "LEMBRETE", 
        color: "bg-blue-100 text-blue-800 border-blue-200", 
        textoDias: diffTime === 0 ? "É Hoje!" : `Faltam ${diffTime} dias` 
      };
    }
  }
  
  const dias = calcularAtraso(consulta.data_ultima_consulta);
  const textoDias = `${dias} dias`;
  
  if (dias > 180) return { label: "URGENTE", color: "bg-red-100 text-red-800 border-red-200", textoDias };
  if (dias >= 150) return { label: "ALERTA", color: "bg-yellow-100 text-yellow-800 border-yellow-200", textoDias };
  
  return { label: "OK", color: "bg-green-100 text-green-800 border-green-200", textoDias };
};