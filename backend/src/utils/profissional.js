const PROFISSIONAIS = Object.freeze({
  MEDICO: { nome: "Médico", artigo: "o" },
  ENFERMEIRO: { nome: "Enfermeiro", artigo: "o" },
  DENTISTA: { nome: "Dentista", artigo: "o(a)" },
  NUTRICAO: { nome: "Nutricionista", artigo: "o(a)" },
  NUTRICIONISTA: { nome: "Nutricionista", artigo: "o(a)" },
});

const normalizarIdentificador = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const formatarTipoProfissional = (valor) => {
  const identificador = normalizarIdentificador(valor);
  if (!identificador) return "Profissional da unidade";
  if (PROFISSIONAIS[identificador]) return PROFISSIONAIS[identificador].nome;
  return identificador
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letra) => letra.toUpperCase());
};

const formatarProfissionalComArtigo = (valor) => {
  const identificador = normalizarIdentificador(valor);
  const profissional = PROFISSIONAIS[identificador];
  if (!profissional) return formatarTipoProfissional(valor);
  return `${profissional.artigo} ${profissional.nome}`;
};

module.exports = {
  formatarProfissionalComArtigo,
  formatarTipoProfissional,
};
