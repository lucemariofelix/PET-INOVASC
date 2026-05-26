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
