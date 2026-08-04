export const formatarDocumento = (valor) => {
  if (!valor) return '';
  const apenasNumeros = valor.replace(/\D/g, '');

  if (apenasNumeros.length <= 11) {
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }

  return apenasNumeros
    .replace(/(\d{3})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/( \d{4})\d+?$/, '$1');
};

export const formatarTelefone = (telefone) => {
  if (!telefone) return "Sem contato";
  
  // Limpa tudo que não for número
  const limpo = telefone.replace(/\D/g, '');
  
  // Formato celular: (84) 99999-9999
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  } 
  // Formato fixo: (84) 3271-9999
  else if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }
  
  // Se for um número estranho ou internacional, retorna como está
  return telefone;
};

export const formatarDataConsulta = (valor) => {
  if (!valor) return "Sem registro";

  const correspondencia = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!correspondencia) return "Data inválida";

  const [, ano, mes, dia] = correspondencia;
  const data = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
  const dataValida =
    data.getUTCFullYear() === Number(ano) &&
    data.getUTCMonth() === Number(mes) - 1 &&
    data.getUTCDate() === Number(dia);

  return dataValida ? `${dia}/${mes}/${ano}` : "Data inválida";
};

const PROFISSIONAIS = Object.freeze({
  MEDICO: "Médico",
  ENFERMEIRO: "Enfermeiro",
  DENTISTA: "Dentista",
  NUTRICAO: "Nutricionista",
  NUTRICIONISTA: "Nutricionista",
});

export const normalizarTextoBusca = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const formatarTipoProfissional = (valor) => {
  const identificador = normalizarTextoBusca(valor)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (!identificador) return "Não informado";
  if (PROFISSIONAIS[identificador]) return PROFISSIONAIS[identificador];
  return identificador
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letra) => letra.toUpperCase());
};
