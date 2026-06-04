import { useState, useEffect } from "react";
import {
  FaList,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import { api } from "../api/services";
import { formatarDocumento } from "../utils/formatters";
import ModalAlerta from "../components/ModalAlerta";

export default function ListaPacientes() {
  const [pacientesOptions, setPacientesOptions] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);

  // Estados da Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  // Estados do Modal de Edição
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [alerta, setAlerta] = useState({
    isOpen: false,
    tipo: "",
    titulo: "",
    mensagem: "",
  });

  const listaACS = [
    "Área Descoberta",
    "Lucemário",
    "Janúsia",
    "Maria José",
    "Rouse",
    "Fabíola",
    "Alex",
    "Zerilda",
    "Ceiça",
  ];

  const fetchPacientes = async () => {
    setLoadingPacientes(true);
    try {
      const data = await api.getPacientes();
      const lista = data.pacientes || data || [];
      setPacientesOptions(lista);
      setPaginaAtual(1);
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err);
    } finally {
      setLoadingPacientes(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  // Lógica de Paginação
  const indexOfLastItem = paginaAtual * itensPorPagina;
  const indexOfFirstItem = indexOfLastItem - itensPorPagina;
  const pacientesAtuais = pacientesOptions.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPaginas = Math.ceil(pacientesOptions.length / itensPorPagina);

  const irParaProximaPagina = () => {
    if (paginaAtual < totalPaginas) setPaginaAtual(paginaAtual + 1);
  };
  const irParaPaginaAnterior = () => {
    if (paginaAtual > 1) setPaginaAtual(paginaAtual - 1);
  };

  const obterProximaConsulta = (consultas) => {
    if (!consultas || consultas.length === 0) return null;
    const agendadas = consultas.filter(
      (c) => c.status_consulta === "AGENDADA" && c.data_proxima_consulta,
    );
    if (agendadas.length === 0) return null;
    return agendadas.sort(
      (a, b) =>
        new Date(a.data_proxima_consulta) - new Date(b.data_proxima_consulta),
    )[0];
  };

  // --- LÓGICA DE EDIÇÃO ---
  const abrirModalEdicao = (paciente) => {
    // Clonamos os dados para não alterar a tabela antes de salvar no banco
    setPacienteEditando({ ...paciente });
    setModalEdicaoAberto(true);
  };

  const handleChangeEdicao = (e) => {
    const { name, value } = e.target;
    setPacienteEditando((prev) => ({ ...prev, [name]: value }));
  };

  const handleCpfChangeEdicao = (e) => {
    setPacienteEditando((prev) => ({
      ...prev,
      cpf_cns: formatarDocumento(e.target.value),
    }));
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();

    // Limpa o documento antes de enviar
    const documentoLimpo = pacienteEditando.cpf_cns.replace(/\D/g, "");

    if (documentoLimpo.length !== 11 && documentoLimpo.length !== 15) {
      setAlerta({
        isOpen: true,
        tipo: "aviso",
        titulo: "Documento Inválido",
        mensagem: "O documento deve ter 11 (CPF) ou 15 números (CNS).",
      });
      return;
    }

    const payload = {
      nome_completo: pacienteEditando.nome_completo,
      cpf_cns: documentoLimpo,
      data_nascimento: pacienteEditando.data_nascimento,
      telefone: pacienteEditando.telefone,
      endereco: pacienteEditando.endereco,
      acs: pacienteEditando.acs,
      condicao: pacienteEditando.condicao,
    };

    try {
      await api.atualizarPaciente(pacienteEditando.id, payload);
      setModalEdicaoAberto(false);

      // Atualiza a lista por baixo dos panos para refletir a mudança
      fetchPacientes();

      setAlerta({
        isOpen: true,
        tipo: "sucesso",
        titulo: "Paciente Atualizado!",
        mensagem: "Os dados foram alterados com sucesso no banco de dados.",
      });
    } catch (err) {
      setAlerta({
        isOpen: true,
        tipo: "erro",
        titulo: "Erro ao Salvar",
        mensagem: err.message,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaList className="text-sky-700" /> Diretório de Pacientes
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Visão geral e condições clínicas da unidade.
          </p>
        </div>
        <button
          onClick={fetchPacientes}
          className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
        >
          Atualizar Lista
        </button>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        {loadingPacientes ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700"></div>
          </div>
        ) : (
          <>
            {/* TABELA DESKTOP */}
            <div className="hidden lg:block">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Paciente / Documento</th>
                    <th className="px-6 py-4">Agente (ACS)</th>
                    <th className="px-6 py-4">Condição Clínica</th>
                    <th className="px-6 py-4">Próxima Consulta</th>
                    <th className="px-6 py-4 text-center">Status Contato</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pacientesAtuais.map((pac, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">
                          {pac.nome_completo}
                        </p>
                        <p className="text-xs text-slate-400">
                          Doc: {formatarDocumento(pac.cpf_cns)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {pac.acs ? (
                          pac.acs
                        ) : (
                          <span className="text-slate-400 italic">
                            Não Informado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            pac.condicao === "HIPERTENSO"
                              ? "bg-blue-100 text-blue-700"
                              : pac.condicao === "DIABETICO"
                                ? "bg-purple-100 text-purple-700"
                                : pac.condicao === "AMBOS"
                                  ? "bg-red-100 text-red-700"
                                  : pac.condicao === "GESTANTE"
                                    ? "bg-pink-100 text-pink-700"
                                    : pac.condicao === "CD"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {pac.condicao || "NENHUMA"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const proxima = obterProximaConsulta(pac.consultas);
                          if (proxima) {
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded w-fit border border-sky-100">
                                  {new Date(
                                    proxima.data_proxima_consulta,
                                  ).toLocaleDateString("pt-BR", {
                                    timeZone: "UTC",
                                  })}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
                                  {proxima.tipo_profissional}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <span className="text-[11px] font-medium text-slate-400">
                              Sem agendamento
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold border ${pac.status_telefone === "VALIDO" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                        >
                          {pac.status_telefone || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => abrirModalEdicao(pac)}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors"
                          title="Editar Paciente"
                        >
                          <FaEdit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CARDS MOBILE */}
            <div className="block lg:hidden p-4 space-y-4">
              {pacientesAtuais.map((pac, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 relative"
                >
                  <div className="pr-8">
                    <h3 className="font-bold text-slate-800">
                      {pac.nome_completo}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Doc: {formatarDocumento(pac.cpf_cns)}
                    </p>
                  </div>

                  {/* Botão flutuante de edição no mobile */}
                  <button
                    onClick={() => abrirModalEdicao(pac)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-sky-600 bg-slate-50 rounded-full border border-slate-100"
                  >
                    <FaEdit size={14} />
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Agente / ACS
                      </span>
                      <span className="text-slate-700 line-clamp-1">
                        {pac.acs || "Não inf."}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Contato
                      </span>
                      <span className="text-slate-700 truncate">
                        {pac.telefone || "Sem contato"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CONTROLES DE PAGINAÇÃO */}
            {pacientesOptions.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <p className="text-sm text-slate-500">
                  Mostrando{" "}
                  <span className="font-bold text-slate-700">
                    {indexOfFirstItem + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-bold text-slate-700">
                    {Math.min(indexOfLastItem, pacientesOptions.length)}
                  </span>{" "}
                  de{" "}
                  <span className="font-bold text-slate-700">
                    {pacientesOptions.length}
                  </span>{" "}
                  pacientes
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={irParaPaginaAnterior}
                    disabled={paginaAtual === 1}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded border ${paginaAtual === 1 ? "border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed" : "border-slate-300 text-slate-700 hover:bg-slate-200 transition"}`}
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <button
                    onClick={irParaProximaPagina}
                    disabled={paginaAtual === totalPaginas}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded border ${paginaAtual === totalPaginas ? "border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed" : "border-slate-300 text-slate-700 hover:bg-slate-200 transition"}`}
                  >
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE EDIÇÃO DE PACIENTE SOBREPOSTO */}
      {/* ========================================================================= */}
      {modalEdicaoAberto && pacienteEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FaEdit className="text-sky-600" /> Editar Paciente
              </h3>
              <button
                onClick={() => setModalEdicaoAberto(false)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="nome_completo"
                    required
                    value={pacienteEditando.nome_completo || ""}
                    onChange={handleChangeEdicao}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    CPF ou CNS *
                  </label>
                  <input
                    type="text"
                    required
                    value={formatarDocumento(pacienteEditando.cpf_cns || "")}
                    onChange={handleCpfChangeEdicao}
                    maxLength={18}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    name="data_nascimento"
                    required
                    value={pacienteEditando.data_nascimento || ""}
                    onChange={handleChangeEdicao}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Agente de Saúde (ACS)
                  </label>
                  <select
                    name="acs"
                    value={pacienteEditando.acs || listaACS[0]}
                    onChange={handleChangeEdicao}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                  >
                    {listaACS.map((agente, idx) => (
                      <option key={idx} value={agente}>
                        {agente}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={pacienteEditando.endereco || ""}
                    onChange={handleChangeEdicao}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={pacienteEditando.telefone || ""}
                    onChange={handleChangeEdicao}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Condição de Saúde
                </label>
                <select
                  name="condicao"
                  value={pacienteEditando.condicao || "NENHUM"}
                  onChange={handleChangeEdicao}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                >
                  <option value="NENHUM">Nenhum / Não informado</option>
                  <option value="HIPERTENSO">Hipertenso</option>
                  <option value="DIABETICO">Diabético</option>
                  <option value="AMBOS">Hipertenso e Diabético</option>
                  <option value="GESTANTE">Gestante</option>
                  <option value="CD">CD: Crescimento e Desenvolvimento</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalEdicaoAberto(false)}
                  className="px-5 py-2.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-colors flex items-center gap-2"
                >
                  <FaSave /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalAlerta
        isOpen={alerta.isOpen}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensagem={alerta.mensagem}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />
    </div>
  );
}
