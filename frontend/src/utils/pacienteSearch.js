const normalizarTexto = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

const somenteNumeros = (valor) => String(valor ?? "").replace(/\D/g, "");

const filtrarPacientesPorBusca = (pacientes, termoBusca) => {
  const lista = Array.isArray(pacientes) ? pacientes : [];
  const termo = String(termoBusca ?? "").trim();

  if (!termo) return lista;

  const nomeBuscado = normalizarTexto(termo);
  const documentoBuscado = somenteNumeros(termo);

  return lista.filter((paciente) => {
    const nomeCorresponde = normalizarTexto(paciente?.nome_completo).includes(
      nomeBuscado,
    );
    const documentoCorresponde =
      documentoBuscado.length > 0 &&
      somenteNumeros(paciente?.cpf_cns).includes(documentoBuscado);

    return nomeCorresponde || documentoCorresponde;
  });
};

export { filtrarPacientesPorBusca };
