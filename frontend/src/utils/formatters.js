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